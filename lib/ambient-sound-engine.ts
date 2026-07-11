'use client';

// Helper buffer generators
function createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

function createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  return buffer;
}

export class AmbientSoundEngine {
  private static instance: AmbientSoundEngine | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: Map<
    string,
    {
      source: AudioNode | HTMLAudioElement;
      gain: GainNode;
      synths?: AudioNode[];
      intervals?: NodeJS.Timeout[];
    }
  > = new Map();
  private masterVolume: number = 0.5;

  static getInstance(): AmbientSoundEngine {
    if (!AmbientSoundEngine.instance) {
      AmbientSoundEngine.instance = new AmbientSoundEngine();
    }
    return AmbientSoundEngine.instance;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      try {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {
        console.warn("Failed to initialize AudioContext:", e);
      }
    }
  }

  getContext(): AudioContext | null {
    this.init();
    return this.ctx;
  }

  setMasterVolume(vol: number) {
    this.masterVolume = vol;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.1);
    }
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  stopAll(fadeDuration: number = 1.0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Smoothly fade out everything
    this.activeNodes.forEach((node) => {
      try {
        node.gain.gain.setValueAtTime(node.gain.gain.value, now);
        node.gain.gain.exponentialRampToValueAtTime(0.001, now + fadeDuration);
      } catch (e) {}
    });

    setTimeout(() => {
      this.activeNodes.forEach((node, key) => {
        this.cleanupNode(key);
      });
      this.activeNodes.clear();
    }, fadeDuration * 1000);
  }

  private cleanupNode(key: string) {
    const node = this.activeNodes.get(key);
    if (!node) return;
    
    // Clear loops or intervals
    if (node.intervals) {
      node.intervals.forEach((interval) => clearInterval(interval));
    }

    // Stop synth nodes
    if (node.synths) {
      node.synths.forEach((synth) => {
        try {
          (synth as any).stop?.();
          synth.disconnect();
        } catch (e) {}
      });
    }

    // Stop HTMLAudioElement or BufferSourceNode
    try {
      if (node.source instanceof HTMLAudioElement) {
        node.source.pause();
        node.source.src = "";
      } else {
        (node.source as any).stop?.();
        node.source.disconnect();
      }
    } catch (e) {}
  }

  toggleSound(soundId: string, play: boolean, volume: number = 0.5) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (!play) {
      const node = this.activeNodes.get(soundId);
      if (node) {
        const now = this.ctx.currentTime;
        try {
          node.gain.gain.setValueAtTime(node.gain.gain.value, now);
          node.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        } catch (e) {}
        setTimeout(() => {
          this.cleanupNode(soundId);
          this.activeNodes.delete(soundId);
        }, 500);
      }
      return;
    }

    if (this.activeNodes.has(soundId)) {
      // Just update volume with crossfade
      this.setSoundVolume(soundId, volume);
      return;
    }

    // Create a new gain node for this channel
    const channelGain = this.ctx.createGain();
    channelGain.gain.setValueAtTime(0.001, this.ctx.currentTime); // start at 0 for fade in
    channelGain.connect(this.masterGain);

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    let sourceNode: AudioNode | HTMLAudioElement;
    let synths: AudioNode[] = [];
    let intervals: NodeJS.Timeout[] = [];

    // PROCEDURAL AUDIO SYNTHESIZERS
    if (soundId === 'white_noise') {
      const src = this.ctx.createBufferSource();
      src.buffer = createWhiteNoiseBuffer(this.ctx);
      src.loop = true;
      src.connect(channelGain);
      src.start();
      sourceNode = src;
    } else if (soundId === 'pink_noise') {
      const src = this.ctx.createBufferSource();
      src.buffer = createPinkNoiseBuffer(this.ctx);
      src.loop = true;
      src.connect(channelGain);
      src.start();
      sourceNode = src;
    } else if (soundId === 'brown_noise') {
      const src = this.ctx.createBufferSource();
      src.buffer = createBrownNoiseBuffer(this.ctx);
      src.loop = true;
      src.connect(channelGain);
      src.start();
      sourceNode = src;
    } else if (soundId === 'fan' || soundId === 'ac') {
      // Synthesized Fan: Low-passed brown noise with subtle 60Hz rotation hum
      const noise = this.ctx.createBufferSource();
      noise.buffer = createBrownNoiseBuffer(this.ctx);
      noise.loop = true;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(soundId === 'ac' ? 100 : 150, now);

      noise.connect(lowpass);
      lowpass.connect(channelGain);
      noise.start();

      const hum = this.ctx.createOscillator();
      hum.type = 'sine';
      hum.frequency.setValueAtTime(60, now);

      const humGain = this.ctx.createGain();
      humGain.gain.setValueAtTime(0.15, now);

      // Add a slow LFO to fan speed
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(8, now); // rotation speed
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.03, now);

      lfo.connect(lfoGain);
      lfoGain.connect(humGain.gain);
      hum.connect(humGain);
      humGain.connect(channelGain);

      lfo.start();
      hum.start();

      sourceNode = noise;
      synths = [lowpass, hum, humGain, lfo, lfoGain];
    } else if (soundId === 'hum') {
      // 60Hz and 120Hz transformer hum mixed with low-passed noise
      const osc1 = this.ctx.createOscillator();
      osc1.frequency.setValueAtTime(60, now);
      const osc2 = this.ctx.createOscillator();
      osc2.frequency.setValueAtTime(120, now);
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = createPinkNoiseBuffer(this.ctx);
      noise.loop = true;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(100, now);

      const g1 = this.ctx.createGain();
      g1.gain.setValueAtTime(0.2, now);
      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.05, now);

      osc1.connect(g1);
      osc2.connect(g2);
      noise.connect(lp);

      g1.connect(channelGain);
      g2.connect(channelGain);
      lp.connect(channelGain);

      osc1.start();
      osc2.start();
      noise.start();

      sourceNode = osc1;
      synths = [osc2, g1, g2, noise, lp];
    } else if (soundId === 'rain_gentle' || soundId === 'rain_heavy') {
      // Rain: Bandpass-filtered Pink Noise + scheduled random droplet sweeps
      const noise = this.ctx.createBufferSource();
      noise.buffer = createPinkNoiseBuffer(this.ctx);
      noise.loop = true;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1200, now);
      bp.Q.setValueAtTime(0.7, now);

      noise.connect(bp);
      bp.connect(channelGain);
      noise.start();

      // Schedule random raindrops
      const dropletInterval = setInterval(() => {
        if (!this.ctx || !play) return;
        try {
          const drop = this.ctx.createOscillator();
          drop.type = 'sine';
          const dropGain = this.ctx.createGain();
          
          const time = this.ctx.currentTime;
          const startFreq = 3000 + Math.random() * 2000;
          drop.frequency.setValueAtTime(startFreq, time);
          drop.frequency.exponentialRampToValueAtTime(800, time + 0.015);
          
          dropGain.gain.setValueAtTime(0.001, time);
          dropGain.gain.linearRampToValueAtTime(0.04 * (soundId === 'rain_heavy' ? 1.5 : 0.8), time + 0.002);
          dropGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);

          drop.connect(dropGain);
          dropGain.connect(channelGain);

          drop.start(time);
          drop.stop(time + 0.02);
        } catch (e) {}
      }, soundId === 'rain_heavy' ? 40 : 150);

      intervals.push(dropletInterval);
      sourceNode = noise;
      synths = [bp];
    } else if (soundId === 'ocean') {
      // Ocean Waves: LFO-driven pink noise filter and volume swell
      const noise = this.ctx.createBufferSource();
      noise.buffer = createPinkNoiseBuffer(this.ctx);
      noise.loop = true;

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(350, now);

      const waveLfo = this.ctx.createOscillator();
      waveLfo.type = 'sine';
      waveLfo.frequency.setValueAtTime(0.08, now); // ~12s waves

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(200, now); // modulate filter frequency

      waveLfo.connect(lfoGain);
      lfoGain.connect(lp.frequency);
      
      noise.connect(lp);
      lp.connect(channelGain);

      waveLfo.start();
      noise.start();

      sourceNode = noise;
      synths = [lp, waveLfo, lfoGain];
    } else if (soundId === 'wind' || soundId === 'breeze') {
      // Wind: Modulated bandpass filter with high Q
      const noise = this.ctx.createBufferSource();
      noise.buffer = createPinkNoiseBuffer(this.ctx);
      noise.loop = true;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(400, now);
      bp.Q.setValueAtTime(soundId === 'wind' ? 6 : 4, now);

      const windLfo = this.ctx.createOscillator();
      windLfo.type = 'sine';
      windLfo.frequency.setValueAtTime(0.05, now);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(soundId === 'wind' ? 250 : 150, now);

      windLfo.connect(lfoGain);
      lfoGain.connect(bp.frequency);

      noise.connect(bp);
      bp.connect(channelGain);

      windLfo.start();
      noise.start();

      sourceNode = noise;
      synths = [bp, windLfo, lfoGain];
    } else if (soundId === 'campfire' || soundId === 'fireplace') {
      // Campfire: Low rumbling brown noise + random popping crackles
      const logs = this.ctx.createBufferSource();
      logs.buffer = createBrownNoiseBuffer(this.ctx);
      logs.loop = true;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(150, now);

      logs.connect(lp);
      lp.connect(channelGain);
      logs.start();

      const crackleInterval = setInterval(() => {
        if (!this.ctx || !play) return;
        try {
          const time = this.ctx.currentTime;
          // Generate wooden pop
          const osc = this.ctx.createOscillator();
          osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(1500 + Math.random() * 3000, time);

          const popGain = this.ctx.createGain();
          popGain.gain.setValueAtTime(0.001, time);
          popGain.gain.linearRampToValueAtTime(0.08 * (Math.random() * 0.8 + 0.2), time + 0.001);
          popGain.gain.exponentialRampToValueAtTime(0.001, time + 0.005 + Math.random() * 0.015);

          const hp = this.ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.setValueAtTime(2000, time);

          osc.connect(hp);
          hp.connect(popGain);
          popGain.connect(channelGain);

          osc.start(time);
          osc.stop(time + 0.03);
        } catch (e) {}
      }, 250);

      intervals.push(crackleInterval);
      sourceNode = logs;
      synths = [lp];
    } else if (soundId === 'tibetan_bowl' || soundId === 'bells' || soundId === 'pads') {
      // Pure synthesized singing instruments / pads
      const mainOsc = this.ctx.createOscillator();
      sourceNode = mainOsc;

      if (soundId === 'tibetan_bowl') {
        // Multi-oscillator additive singing bowl drone
        const freqs = [150, 226, 301, 452];
        const oscList: OscillatorNode[] = [];
        const gainsList: GainNode[] = [];

        freqs.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq + (Math.sin(idx) * 0.4), now);

          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.12 / (idx + 1), now);

          const lfo = this.ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.1 + idx * 0.05, now);
          const lfoG = this.ctx.createGain();
          lfoG.gain.setValueAtTime(0.02, now);

          lfo.connect(lfoG);
          lfoG.connect(g.gain);

          osc.connect(g);
          g.connect(channelGain);
          
          osc.start();
          lfo.start();

          oscList.push(osc);
          gainsList.push(g);
          synths.push(osc, g, lfo, lfoG);
        });

        const bellInterval = setInterval(() => {
          this.triggerProceduralBell(440, 10, channelGain);
        }, 12000);
        intervals.push(bellInterval);

      } else if (soundId === 'bells') {
        const bellInterval = setInterval(() => {
          const baseFreq = 400 + Math.random() * 600;
          this.triggerProceduralBell(baseFreq, 6, channelGain);
        }, 4000);
        intervals.push(bellInterval);
      } else {
        // Ambient Pads: lush detuned triangle cluster
        const padOscs = [220, 221.5, 330, 440];
        padOscs.forEach((freq) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(300, now);

          const filterLfo = this.ctx.createOscillator();
          filterLfo.frequency.setValueAtTime(0.1, now);
          const lfoGain = this.ctx.createGain();
          lfoGain.gain.setValueAtTime(100, now);

          filterLfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);

          osc.connect(filter);
          filter.connect(channelGain);

          osc.start();
          filterLfo.start();

          synths.push(osc, filter, filterLfo, lfoGain);
        });
      }
    } else {
      // HTML5 AUDIO STREAMING FOR REMAINING COMPLEX AUDIO LOOPS
      const AUDIO_SOURCES: Record<string, string> = {
        birds: 'https://assets.mixkit.co/active_storage/sfx/2507/2507-84.wav',
        river: 'https://assets.mixkit.co/active_storage/sfx/2522/2522-84.wav',
        waterfall: 'https://assets.mixkit.co/active_storage/sfx/1654/1654-84.wav',
        forest: 'https://assets.mixkit.co/active_storage/sfx/2508/2508-84.wav',
        coffee_shop: 'https://assets.mixkit.co/active_storage/sfx/2070/2070-84.wav',
        library: 'https://assets.mixkit.co/active_storage/sfx/2659/2659-84.wav',
        keyboard: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav',
        piano: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        guitar: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        strings: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
      };

      const srcUrl = AUDIO_SOURCES[soundId];
      if (srcUrl) {
        const audio = new Audio(srcUrl);
        audio.loop = true;
        audio.crossOrigin = "anonymous";
        
        try {
          const mediaSrc = this.ctx.createMediaElementSource(audio);
          mediaSrc.connect(channelGain);
          audio.play().catch(() => {
            console.warn(`Streaming failed for ${soundId}, falling back to synthetic generator.`);
            this.activeNodes.delete(soundId);
            this.toggleSound(soundId, true, volume);
          });
          sourceNode = audio;
        } catch (e) {
          audio.play();
          sourceNode = audio;
        }
      } else {
        const src = this.ctx.createBufferSource();
        src.buffer = createWhiteNoiseBuffer(this.ctx);
        src.loop = true;
        src.connect(channelGain);
        src.start();
        sourceNode = src;
      }
    }

    channelGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1.0);
    
    this.activeNodes.set(soundId, {
      source: sourceNode,
      gain: channelGain,
      synths,
      intervals
    });
  }

  private triggerProceduralBell(freq: number, decay: number, destination: AudioNode) {
    if (!this.ctx) return;
    try {
      const time = this.ctx.currentTime;
      const partials = [1.0, 2.0, 3.0, 4.2];
      partials.forEach((part, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * part, time);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.001, time);
        g.gain.linearRampToValueAtTime((0.1 / (index + 1)) * 0.5, time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, time + decay / (index + 1));

        osc.connect(g);
        g.connect(destination);

        osc.start(time);
        osc.stop(time + decay);
      });
    } catch (e) {}
  }

  setSoundVolume(soundId: string, volume: number) {
    const node = this.activeNodes.get(soundId);
    if (node && this.ctx) {
      const now = this.ctx.currentTime;
      node.gain.gain.setValueAtTime(node.gain.gain.value, now);
      node.gain.gain.linearRampToValueAtTime(volume, now + 0.2);
    }
  }
}
