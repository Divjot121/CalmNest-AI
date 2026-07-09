'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Shield, 
  Zap, 
  Users, 
  MessageCircle, 
  Activity, 
  Lock, 
  ChevronDown, 
  ArrowRight,
  HandHelping,
  AlertCircle,
  Menu,
  X,
  CheckCircle2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-20 flex items-center px-6 md:px-12 relative z-10 ${isScrolled ? 'glass' : 'bg-transparent'}`}>
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <div className="w-4 h-4 bg-white rounded-full opacity-90"></div>
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-800 font-display">CalmNest</span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-500">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</a>
          <a href="#safety" className="hover:text-indigo-600 transition-colors">Safety</a>
          <a href="#partners" className="hover:text-indigo-600 font-semibold text-indigo-600">Partners</a>
        </div>

        <div className="hidden md:block">
          <Link href="/chat" className="px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors active:scale-95">
            Start Anonymous Chat
          </Link>
        </div>

        <button className="md:hidden text-slate-900" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            key="mobile-menu"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-white p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-2xl font-display font-bold">CalmNest</span>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium text-slate-600">Features</a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium text-slate-600">How it Works</a>
              <Link href="/chat" onClick={() => setIsMobileMenuOpen(false)} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-medium w-full text-center">
                Start Anonymous Chat
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
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col overflow-x-hidden relative">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] opacity-60 -z-10"></div>
      <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[100px] opacity-40 -z-10"></div>

      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col md:flex-row px-6 md:px-12 items-center relative z-10 pt-32 pb-20">
        <div className="w-full md:w-1/2 md:pr-12 mb-12 md:mb-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-6 uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              24/7 AI-Powered Support
            </div>
            <h1 className="text-5xl md:text-[64px] leading-[1.05] font-bold text-slate-900 mb-6">
              You&apos;re Not Alone.<br/>We&apos;re Here to Listen.
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-lg">
              Anonymous conversations and compassionate AI guidance whenever life feels overwhelming. A safe sanctuary for your mind.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/chat" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-lg font-semibold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                Begin Your Journey
              </Link>
              <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-lg font-semibold hover:bg-slate-50 transition-all active:scale-95">
                Learn More
              </button>
            </div>
          </motion.div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-white/70 backdrop-blur-xl border border-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <MessageCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-800">Compassionate AI</h3>
                <p className="text-slate-500">Empathetic, judgment-free support focused on mood tracking and stress relief.</p>
              </div>
            </div>
            <div className="h-[1px] bg-slate-100 w-full mb-6"></div>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden relative">
                    <Image src={`https://picsum.photos/seed/${i + 20}/100/100`} alt="User" fill referrerPolicy="no-referrer" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold">+1k</div>
              </div>
              <span className="text-sm font-medium text-slate-400">142 people chatting now</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-emerald-500 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-200"
            >
              <h4 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Safety First</h4>
              <p className="text-2xl font-bold leading-tight">Crisis Intervention Pathways</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-lg shadow-slate-100"
            >
              <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-600 mb-2">Privacy</h4>
              <p className="text-2xl font-bold leading-tight text-slate-800">100% Anonymous</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">Comprehensive Care for the Digital Age</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              We&apos;ve built a multi-layered support system that prioritizes your wellbeing, privacy, and safety above all else.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageCircle className="text-indigo-600" />,
                title: "AI Mental Health Assistant",
                description: "Empathetic, 24/7 conversations designed to listen and provide emotional support without judgment."
              },
              {
                icon: <Shield className="text-emerald-600" />,
                title: "Anonymous Chat System",
                description: "Your identity remains hidden. No profiles, no names, just pure privacy and safety."
              },
              {
                icon: <AlertCircle className="text-red-500" />,
                title: "Crisis Detection",
                description: "Advanced logic identifies high-risk situations like self-harm or severe depression instantly."
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card-geometric"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Footer Section */}
      <footer className="h-auto md:h-24 px-6 md:px-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between relative z-10 bg-white/50 backdrop-blur-sm py-8 md:py-0">
        <div className="flex gap-12 mb-6 md:mb-0">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-slate-800">8.2M+</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lives Impacted</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-slate-800">240+</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">NGO Partners</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trusted By</span>
          <div className="flex gap-6 opacity-30 grayscale">
             {/* Logo Placeholders */}
             <div className="h-6 w-20 bg-slate-400 rounded"></div>
             <div className="h-6 w-20 bg-slate-400 rounded"></div>
             <div className="h-6 w-20 bg-slate-400 rounded"></div>
          </div>
        </div>
      </footer>

      {/* Detailed Footer */}
      <div className="bg-white border-t border-slate-50 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Heart size={18} fill="currentColor" />
            </div>
            <span className="text-xl font-bold">CalmNest</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <Link href="/volunteer" className="hover:text-indigo-600 transition-colors">Partner Login</Link>
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
          </div>
          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} CalmNest.
          </div>
        </div>
      </div>
    </main>
  );
}
