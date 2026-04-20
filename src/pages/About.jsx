import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Sun, Star, Award } from 'lucide-react';

const About = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  return (
    <div className="bg-white overflow-x-hidden font-sans">
      
      {/* 1. HERO HEADER */}
      <section className="relative bg-hotelNavy py-40 px-6 text-center border-b border-hotelGold/30 overflow-hidden">
        {/* Animated Background Texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] animate-slow-zoom"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10"
        >
          <span className="text-hotelGold text-[10px] md:text-xs tracking-[0.8em] uppercase font-black mb-6 block">
            Established in Aba • 2026
          </span>
          <h1 className="font-luxury text-white text-6xl md:text-[10rem] italic leading-none">
            Our <span className="text-hotelGold">Legacy</span>
          </h1>
          <div className="h-[1px] w-32 bg-hotelGold mx-auto mt-12 shadow-[0_0_15px_rgba(212,175,55,0.5)]"></div>
        </motion.div>
      </section>

      {/* 2. THE EDITORIAL SPLIT */}
      <section className="max-w-7xl mx-auto py-24 md:py-40 px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
          
          {/* Image Side with Floating Elements */}
          <div className="w-full lg:w-1/2 relative">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="relative z-10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.3)] group"
            >
              <img 
                src="/images/29 Scandinavian.jpg" 
                alt="Kedest Hotel Interior" 
                className="w-full h-[500px] md:h-[700px] object-cover transition-transform duration-[5000ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-hotelNavy/10 group-hover:bg-transparent transition-all duration-700"></div>
            </motion.div>
            
            {/* Excellence Badge */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="absolute -bottom-10 -right-6 md:-right-12 bg-hotelNavy p-8 md:p-12 shadow-2xl z-20 border-l-8 border-hotelGold hidden md:block"
            >
              <Award className="text-hotelGold mb-4" size={32} />
              <p className="text-hotelGold font-luxury italic text-3xl">Excellence</p>
              <p className="text-white text-[10px] tracking-[0.4em] uppercase mt-2 font-bold opacity-70">The Kedest Standard</p>
            </motion.div>
          </div>

          {/* Text Side */}
          <motion.div {...fadeInUp} className="w-full lg:w-1/2 space-y-12">
            <h2 className="font-luxury text-hotelNavy text-5xl md:text-8xl italic leading-tight">
              A Sanctuary <br /> Built for the <span className="text-hotelGold italic">Elite.</span>
            </h2>
            <p className="text-gray-600 leading-relaxed text-xl md:text-2xl font-light italic border-l-4 border-hotelGold/20 pl-8">
              "Kedest Hotel & Suites was born from a singular, ruthless vision: 
              To create a space where the chaos of the outside world stops at the gates."
            </p>
            <p className="text-gray-500 text-lg leading-relaxed">
              We realized that luxury in Aba isn't just about gold curtains—it's about reliability. 
              It's about knowing the AC will never hum to a stop and the gates will always be guarded by the best.
            </p>
            
            <div className="grid grid-cols-2 gap-12 pt-12 border-t border-gray-100">
              <div className="group">
                <Sun className="text-hotelGold mb-3 group-hover:animate-spin-slow" size={24} />
                <h4 className="text-hotelNavy font-bold text-3xl font-luxury italic">24/7</h4>
                <p className="text-gray-400 uppercase text-[9px] tracking-[0.4em] font-black mt-2">Solar Autonomy</p>
              </div>
              <div className="group">
                <ShieldCheck className="text-hotelGold mb-3" size={24} />
                <h4 className="text-hotelNavy font-bold text-3xl font-luxury italic">Secure</h4>
                <p className="text-gray-400 uppercase text-[9px] tracking-[0.4em] font-black mt-2">Smart-Access</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. THE PHILOSOPHY (The "Dark" Quote Section) */}
      <section className="bg-hotelNavy py-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <motion.div 
          {...fadeInUp}
          className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10"
        >
          <Star className="text-hotelGold mb-8 animate-pulse" size={40} />
          <h3 className="font-luxury text-hotelGold text-3xl md:text-5xl italic mb-12">The Mission</h3>
          <p className="text-3xl md:text-5xl text-white italic font-light leading-snug">
            "To provide a sanctuary of luxury where the <span className="text-hotelGold font-semibold">lights never go out</span> and the service never falters."
          </p>
          <div className="mt-16 flex items-center gap-4">
            <div className="h-[1px] w-12 bg-hotelGold/40"></div>
            <span className="text-hotelGold uppercase tracking-[0.5em] text-xs font-bold">The Promise</span>
            <div className="h-[1px] w-12 bg-hotelGold/40"></div>
          </div>
        </motion.div>
      </section>

      {/* 4. CALL TO ACTION */}
      <section className="py-32 bg-white text-center px-6">
        <motion.div {...fadeInUp}>
          <p className="text-gray-400 uppercase tracking-[0.5em] text-[10px] mb-8 font-black">Experience the exceptional</p>
          <h2 className="font-luxury text-hotelNavy text-5xl md:text-8xl italic mb-16 leading-tight">
            Luxury Awaits <br/> Your Arrival.
          </h2>
          <div className="flex flex-col md:flex-row justify-center gap-8 max-w-2xl mx-auto">
              <Link 
                to="/suites" 
                className="flex-1 bg-hotelNavy text-hotelGold px-14 py-6 font-bold uppercase tracking-widest text-xs hover:bg-hotelGold hover:text-hotelNavy transition-all duration-500 shadow-2xl hover:-translate-y-2"
              >
                View The Residences
              </Link>
              <Link 
                to="/experience" 
                className="flex-1 border-2 border-hotelNavy text-hotelNavy px-14 py-6 font-bold uppercase tracking-widest text-xs hover:bg-hotelNavy hover:text-white transition-all duration-500 hover:-translate-y-2"
              >
                Our Gallery
              </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default About;