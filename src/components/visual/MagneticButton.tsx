import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const MagneticButton = ({ children, className = '', onClick }: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 200 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  // Handle Gyroscope for Mobile
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta && e.gamma) {
        // beta: -180 to 180, gamma: -90 to 90
        const bx = Math.min(Math.max(e.gamma, -30), 30) / 30;
        const by = Math.min(Math.max(e.beta - 45, -30), 30) / 30;
        x.set(bx * 20);
        y.set(by * 20);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    x.set(distanceX * 0.4);
    y.set(distanceY * 0.4);
    rotateX.set(-distanceY * 0.1);
    rotateY.set(distanceX * 0.1);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY, rotateX: springRotateX, rotateY: springRotateY, perspective: 1000 }}
      className="relative z-10"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`group relative px-12 py-6 bg-gradient-to-br from-[#7B1FA2] to-[#4A148C] text-white rounded-full font-black uppercase tracking-[0.2em] text-sm overflow-hidden transition-all duration-300 shadow-[0_20px_50px_rgba(123,31,162,0.3)] hover:shadow-[0_20px_80px_rgba(123,31,162,0.6)] ${className}`}
      >
        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
        
        {/* Glow Feedback */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),_rgba(255,255,255,0.2)_0%,_transparent_100%)]" />

        <span className="relative z-10 flex items-center gap-3">
          {children}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
        </span>

        {/* 3D Border */}
        <div className="absolute inset-0 border border-white/20 rounded-full group-hover:border-white/40 transition-colors" />
      </motion.button>
      
      {/* Dynamic Glow Shadow */}
      <motion.div 
        style={{ x: useTransform(springX, (v) => v * 1.2), y: useTransform(springY, (v) => v * 1.2), opacity: 0.3 }}
        className="absolute inset-0 bg-[#7B1FA2] blur-3xl -z-10 rounded-full pointer-events-none"
      />
    </motion.div>
  );
};

export default MagneticButton;
