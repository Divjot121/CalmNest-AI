'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  ShieldCheck, 
  MessageCircle, 
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Lock,
  Leaf,
  Headphones,
  Compass
} from 'lucide-react';
import Link from 'next/link';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 h-16 flex items-center px-6 md:px-12 ${isScrolled ? 'bg-white/90 dark:bg-[#16181D]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-[#2B2F38] shadow-2xs' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group select-none">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform duration-200">
            <Sparkles size={16} strokeWidth={1.75} />
          </div>
          <span className="text-base font-medium tracking-tight text-slate-900 dark:text-slate-100">CalmNest</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-600 dark:text-slate-300">
          <a href="#philosophy" className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150">Philosophy</a>
          <a href="#experience" className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150">Experience</a>
          <a href="#privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150">Privacy & Safety</a>
          <Link href="/dashboard" className="text-primary dark:text-[#A1C2D4] font-medium hover:underline">Sanctuary Workspace</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard" className="btn-secondary px-4 py-2 text-xs">
            Dashboard
          </Link>
          <Link href="/chat" className="btn-primary px-4 py-2 text-xs">
            Start Anonymous Chat
          </Link>
        </div>

        <button 
          className="md:hidden text-slate-700 dark:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-[#1E2128] rounded-xl transition-colors" 
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} strokeWidth={1.75} />
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] bg-[#FAF9F6] dark:bg-[#16181D] p-6 flex flex-col justify-between border-b border-slate-200/70 dark:border-[#2B2F38]"
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white">
                    <Sparkles size={16} strokeWidth={1.75} />
                  </div>
                  <span className="text-base font-medium tracking-tight text-slate-900 dark:text-slate-100">CalmNest</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-600 dark:text-slate-300 p-2 hover:bg-slate-100 dark:hover:bg-[#1E2128] rounded-xl transition-colors">
                  <X size={22} strokeWidth={1.75} />
                </button>
              </div>
              <div className="flex flex-col gap-5 text-base">
                <a href="#philosophy" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 dark:text-slate-200">Philosophy</a>
                <a href="#experience" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 dark:text-slate-200">Experience</a>
                <a href="#privacy" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 dark:text-slate-200">Privacy & Safety</a>
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-primary dark:text-[#A1C2D4] font-medium">Sanctuary Workspace</Link>
              </div>
            </div>
            
            <div className="space-y-3 pt-6 border-t border-slate-200/70 dark:border-[#2B2F38]">
              <Link href="/chat" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary w-full py-3 text-center">
                Start Anonymous Chat
              </Link>
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="btn-secondary w-full py-3 text-center">
                Enter Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] dark:bg-[#16181D] text-slate-800 dark:text-slate-100 font-sans flex flex-col relative transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center max-w-4xl mx-auto px-6 pt-36 pb-24 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6"
        >
          <div className="badge-emerald px-4 py-1.5 shadow-2xs">
            <Leaf size={14} strokeWidth={1.75} />
            <span>A Safe, Peaceful Sanctuary for Your Mind</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium text-slate-900 dark:text-slate-100 tracking-tight leading-[1.15] max-w-3xl">
            You are safe here. <br/>
            <span className="text-primary dark:text-[#A1C2D4] font-normal">Take a quiet breath.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-normal">
            No noise. No judgment. Just a warm, breathable space inspired by mindfulness principles and emotional intelligence where you can step away from stress and find inner calm.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link href="/chat" className="btn-primary px-7 py-3 text-sm shadow-sm">
              <span>Begin Anonymous Chat</span>
              <ArrowRight size={16} strokeWidth={1.75} />
            </Link>
            <Link href="/dashboard" className="btn-secondary px-7 py-3 text-sm">
              Explore Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-6 text-xs text-slate-400 dark:text-slate-500 font-normal">
            <span className="flex items-center gap-1.5">
              <Lock size={14} strokeWidth={1.75} className="text-[#6B907B]" />
              100% Anonymous & Secure
            </span>
            <span>•</span>
            <span>Zero Profiles Required</span>
            <span>•</span>
            <span>English, Hindi & Punjabi</span>
          </div>
        </motion.div>

        {/* Minimalist Overview Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
          className="w-full max-w-3xl mt-6 bg-white dark:bg-[#1E2128] border border-slate-200/70 dark:border-[#2B2F38] rounded-2xl p-6 sm:p-8 shadow-xs text-left grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-slate-200/60 dark:border-[#2B2F38] pb-4 sm:pb-0 sm:pr-6">
            <div className="w-8 h-8 bg-primary-subtle dark:bg-primary/20 text-primary dark:text-[#A1C2D4] rounded-xl flex items-center justify-center mb-3">
              <MessageCircle size={18} strokeWidth={1.75} />
            </div>
            <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">Empathetic AI Companion</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tuned for warm reflections and gentle grounding guidance anytime you need to talk.
            </p>
          </div>

          <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-slate-200/60 dark:border-[#2B2F38] pb-4 sm:pb-0 sm:pr-6">
            <div className="w-8 h-8 bg-[#E6EFEA] dark:bg-[#6B907B]/20 text-[#6B907B] dark:text-[#A8C8B5] rounded-xl flex items-center justify-center mb-3">
              <Headphones size={18} strokeWidth={1.75} />
            </div>
            <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">Ambient Soundscapes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Synthesized acoustics including gentle rain, ocean waves, fireplace, and soothing brown noise.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 bg-[#EFEAF6] dark:bg-[#8D80A9]/20 text-[#8D80A9] dark:text-[#C5B8DD] rounded-xl flex items-center justify-center mb-3">
              <Compass size={18} strokeWidth={1.75} />
            </div>
            <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">Breathing Studio</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Interactive visualizer with Box Breathing and 4-7-8 techniques to calm your nervous system.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-20 bg-white/70 dark:bg-[#1E2128]/40 border-y border-slate-200/70 dark:border-[#2B2F38]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="badge-blue mb-2.5">Our Philosophy</span>
            <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-slate-100 tracking-tight">
              A Place Where Your Mind Can Rest
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Designed with strict minimalism and emotional comfort to lower cognitive load and nurture hope.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              {
                icon: <ShieldCheck size={20} strokeWidth={1.75} />,
                color: "text-primary dark:text-[#A1C2D4] bg-primary-subtle dark:bg-primary/20",
                title: "Complete Privacy by Design",
                desc: "No account or personally identifiable information is ever required. Your emotional journey belongs entirely to you."
              },
              {
                icon: <Leaf size={20} strokeWidth={1.75} />,
                color: "text-[#6B907B] dark:text-[#A8C8B5] bg-[#E6EFEA] dark:bg-[#6B907B]/20",
                title: "Multilingual Cultural Empathy",
                desc: "Full, native support for English, Hindi (हिन्दी), and Punjabi (ਪੰਜਾਬੀ), honoring cultural nuances in emotional expression."
              },
              {
                icon: <Heart size={20} strokeWidth={1.75} />,
                color: "text-[#8D80A9] dark:text-[#C5B8DD] bg-[#EFEAF6] dark:bg-[#8D80A9]/20",
                title: "Gentle Pacing & Zero Pressure",
                desc: "No aggressive streaks, no alarming notifications, and no visual clutter. Move entirely at your own comfortable pace."
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="card-minimal flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                    {item.icon}
                  </div>
                  <h3 className="font-medium text-base text-slate-900 dark:text-slate-100 mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-slate-200/70 dark:border-[#2B2F38] text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white">
              <Sparkles size={12} strokeWidth={1.75} />
            </div>
            <span className="font-medium text-slate-800 dark:text-slate-200">CalmNest Sanctuary</span>
          </div>
          <div className="flex gap-6">
            <Link href="/dashboard" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Workspace</Link>
            <Link href="/chat" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">AI Therapist</Link>
            <Link href="/meditation" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Breathing Studio</Link>
          </div>
          <div>
            © {new Date().getFullYear()} CalmNest. Dedicated to inner peace.
          </div>
        </div>
      </footer>
    </main>
  );
}
