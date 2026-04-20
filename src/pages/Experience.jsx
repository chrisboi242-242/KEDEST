import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSolarPanel, FaSwimmingPool, FaShieldAlt, 
  FaGlassMartiniAlt, FaLightbulb, FaLeaf, FaTimes, FaExpandAlt
} from 'react-icons/fa';

const features = [
  { id: 1, icon: <FaLeaf />, title: "Serene Sanctuary", desc: "Tucked away in a quiet, secure street for a peaceful, homely atmosphere." },
  { id: 2, icon: <FaSolarPanel />, title: "Dual-Power Reliability", desc: "Industrial generators backed by 24/7 Solar energy systems." },
  { id: 3, icon: <FaSwimmingPool />, title: "Azure Pool", desc: "A temperature-controlled oasis for guest relaxation and leisure." },
  { id: 4, icon: <FaGlassMartiniAlt />, title: "Vogue Bar", desc: "Curated cocktails and premium spirits in a sophisticated lounge." },
  { id: 5, icon: <FaShieldAlt />, title: "Elite Security", desc: "Round-the-clock personnel and advanced smart-card entry systems." },
  { id: 6, icon: <FaLightbulb />, title: "Luminous Grounds", desc: "Wide, well-lit corridors and common areas for safety and elegance." }
];

const galleryImages = [
  { src: "/images/Hotel night view.jpg", title: "Midnight View", colSpan: "md:col-span-2" },
  { src: "/images/download (8).jpg", title: "Poolside", colSpan: "" },
  { src: "/images/Take me to the nearest bar.jpg", title: "The Lounge", colSpan: "" },
  { src: "/images/BBP NRG.jpg", title: "Solar Array", colSpan: "" },
  { src: "/images/download (9).jpg", title: "Security Detail", colSpan: "" },
  { src: "/images/download (10).jpg", title: "Architecture", colSpan: "md:col-span-2" }
];

const Experience = () => {
  const [selectedImg, setSelectedImg] = useState(null);

  return (
    <div className="bg-hotelSoftWhite min-h-screen font-sans">
      
      {/* 1. HERO HEADER */}
      <section className="bg-hotelNavy py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <span className="text-hotelGold text-[10px] tracking-[0.8em] uppercase font-black mb-4 block">Unrivaled Excellence</span>
          <h1 className="font-luxury text-white text-6xl md:text-8xl italic uppercase leading-none">
            The Experience
          </h1>
          <p className="text-gray-400 mt-8 uppercase tracking-[0.4em] text-[10px] md:text-xs max-w-xl mx-auto leading-loose">
            Beyond a stay—a standard of living. Discover the facilities that define Kedest luxury.
          </p>
        </motion.div>
      </section>

      {/* 2. STAGGERED FEATURES GRID */}
      <section className="max-w-7xl mx-auto py-32 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {features.map((f, i) => (
            <motion.div 
              key={f.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group text-center"
            >
              <div className="w-20 h-20 mx-auto bg-hotelNavy flex items-center justify-center rounded-full mb-8 group-hover:bg-hotelGold transition-colors duration-500 shadow-xl">
                <div className="text-3xl text-hotelGold group-hover:text-hotelNavy transition-colors duration-500">
                  {f.icon}
                </div>
              </div>
              <h3 className="font-luxury text-hotelNavy text-3xl italic mb-4">{f.title}</h3>
              <p className="text-gray-500 font-light leading-relaxed text-sm px-4 italic">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. VISUAL TOUR GALLERY */}
      <section className="bg-hotelNavy py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 flex flex-col md:flex-row items-end justify-between border-b border-white/10 pb-8">
            <h2 className="font-luxury text-hotelGold text-5xl md:text-7xl italic">Visual Tour</h2>
            <p className="text-gray-500 uppercase tracking-widest text-[10px] font-black">Architecture & Ambience</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {galleryImages.map((img, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`relative overflow-hidden cursor-pointer group h-[400px] border border-white/5 ${img.colSpan}`}
                onClick={() => setSelectedImg(img)}
              >
                <img 
                  src={img.src} 
                  alt={img.title} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-hotelNavy/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-8">
                  <FaExpandAlt className="text-hotelGold text-2xl mb-4 transform -translate-y-4 group-hover:translate-y-0 transition-transform" />
                  <span className="text-white uppercase tracking-[0.3em] text-[10px] font-black border-b border-hotelGold pb-2">
                    View {img.title}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-hotelNavy/98 backdrop-blur-2xl flex items-center justify-center p-6"
            onClick={() => setSelectedImg(null)}
          >
            <button className="absolute top-8 right-8 text-white/50 hover:text-hotelGold text-3xl transition-colors">
              <FaTimes />
            </button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative max-w-5xl w-full"
            >
              <img src={selectedImg.src} alt={selectedImg.title} className="w-full h-auto shadow-2xl border border-white/10" />
              <div className="absolute -bottom-12 left-0">
                <p className="font-luxury text-hotelGold text-2xl italic">{selectedImg.title}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. THE MAP SECTON */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/3">
             <span className="text-hotelGold text-[10px] tracking-[0.4em] uppercase font-black">Location</span>
             <h2 className="font-luxury text-hotelNavy text-5xl italic mt-4 mb-6 leading-tight">Our <br />Coordinates</h2>
             <p className="text-gray-500 font-light leading-relaxed italic mb-8">
                Tucked away in the most secure district of the city, Kedest offers both privacy and proximity to the urban heart.
             </p>
             <div className="space-y-4">
                <p className="text-xs uppercase tracking-widest font-black text-hotelNavy">Aba, Abia State, Nigeria</p>
                <p className="text-xs uppercase tracking-widest font-black text-gray-400">+234 806 707 3060</p>
             </div>
          </div>
          <div className="lg:w-2/3 w-full h-[500px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-gray-100 rounded-sm overflow-hidden">
            <iframe 
              title="Hotel Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15891.758414561234!2d7.359876217443848!3d5.11327150000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1042994f31627993%3A0x6a0a09a53823467d!2sAba!5e0!3m2!1sen!2sng!4v1710000000000"
              className="w-full h-full grayscale contrast-125 hover:grayscale-0 transition-all duration-1000" 
              allowFullScreen="" 
              loading="lazy">
            </iframe>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Experience;