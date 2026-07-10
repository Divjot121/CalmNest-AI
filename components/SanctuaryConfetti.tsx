'use client';

import confetti from 'canvas-confetti';

export function triggerGentleSanctuaryCelebration(type: 'leaves' | 'stars' | 'petals' | 'particles' = 'leaves') {
  const defaults: confetti.Options = {
    spread: 70,
    ticks: 200,
    gravity: 0.6,
    decay: 0.94,
    startVelocity: 15,
    shapes: ['circle' as confetti.Shape],
    colors: ['#8DA9B7', '#6B907B', '#8D80A9', '#C5BAAA', '#E8F0F8']
  };

  if (type === 'leaves') {
    confetti({
      ...defaults,
      particleCount: 24,
      colors: ['#6B907B', '#8FA89B', '#C5BAAA', '#A8C8B5'],
      scalar: 1.1
    });
  } else if (type === 'stars') {
    confetti({
      ...defaults,
      particleCount: 20,
      colors: ['#EFEAF6', '#8D80A9', '#C5B8DD', '#E8F0F8'],
      scalar: 0.9
    });
  } else if (type === 'petals') {
    confetti({
      ...defaults,
      particleCount: 25,
      colors: ['#E8F0F8', '#8DA9B7', '#EFEAF6', '#D6CEDE'],
      scalar: 1.0
    });
  } else {
    confetti({
      ...defaults,
      particleCount: 30,
      colors: ['#5C8397', '#6B907B', '#8D80A9', '#6FA4AD'],
      scalar: 0.8
    });
  }
}
