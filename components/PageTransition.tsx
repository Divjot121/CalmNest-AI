'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface PageTransitionProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function PageTransition({ children, className = '', delay = 0, ...props }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1.0], // Smooth, organic breathing curve
        delay
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FloatingCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: [-2, 2, -2],
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        y: {
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
