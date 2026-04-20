import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaInstagram, FaWhatsapp, FaMapMarkerAlt, FaPhone, FaSyncAlt } from 'react-icons/fa';

const Footer = () => {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const timerRef = useRef(null);

  // RUTHLESS MENTOR TIP: Always clean up your timers. 
  // If the user leaves the page, we kill the secret access listener.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSecretAccess = (e) => {
    e.preventDefault(); // Prevent any default button behavior
    if (isRedirecting) return; 

    if (timerRef.current) clearTimeout(timerRef.current);

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 5) {
      setIsRedirecting(true);
      setClickCount(0);
      
      // Delay for the "Luxury Loading Bar" vibe
      setTimeout(() => {
        navigate('/kedest-admin-portal-2026');
        // Reset state in case they hit "back" later
        setTimeout(() => setIsRedirecting(false), 1000);
      }, 1500);
    } else {
      // If they stop clicking for 800ms, reset the count
      timerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 800);
    }
  };

  return (
    <footer className="bg-hotelNavy text-white pt-20 pb-10 px-6 border-t border-hotelGold/20 relative">
      
      {/* THE LUXURY LOADING BAR - Ensure 'animate-loading-bar' is in your tailwind config */}
      {isRedirecting && (
        <div className="absolute top-0 left-0 w-full h-1 z-50 overflow-hidden">
          <div className="h-full bg-hotelGold animate-loading-bar shadow-[0_0_10px_#B8860B]"></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
        
        {/* BRAND COLUMN */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Link to="/" className="inline-block">
            <div className="text-3xl font-luxury font-black tracking-tighter text-hotelGold italic flex flex-col">
              <span className="leading-none text-hotelGold">KEDEST</span>
              <span className="text-[10px] tracking-[0.5em] text-white font-sans uppercase">Hotel & Suites</span>
            </div>
          </Link>
          <p className="text-gray-400 font-light max-w-sm leading-relaxed italic">
            Redefining the standard of luxury and reliability in the heart of Aba. 
            Where consistent power meets unparalleled elegance.
          </p>
          <div className="flex gap-4 text-hotelGold text-xl">
             <a href="#" className="hover:text-white transition-colors duration-300"><FaInstagram /></a>
             <a href="https://wa.me/2348067073060" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300"><FaWhatsapp /></a>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="space-y-6">
          <h4 className="text-hotelGold uppercase tracking-widest text-xs font-bold font-sans">Navigation</h4>
          <ul className="space-y-4 text-sm text-gray-400 font-light uppercase tracking-widest font-sans">
            <li><Link to="/about-hotel" className="hover:text-hotelGold transition-colors">The Legacy</Link></li>
            <li><Link to="/suites" className="hover:text-hotelGold transition-colors">Residences</Link></li>
            <li><Link to="/experience" className="hover:text-hotelGold transition-colors">Experience</Link></li>
            <li><Link to="/book-now" className="hover:text-hotelGold transition-colors">Reservations</Link></li>
          </ul>
        </div>

        {/* CONTACT INFO */}
        <div className="space-y-6">
          <h4 className="text-hotelGold uppercase tracking-widest text-xs font-bold font-sans">Contact</h4>
          <ul className="space-y-4 text-sm text-gray-400 font-light font-sans">
            <li className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-hotelGold mt-1" />
              <span>Aba, Abia State, Nigeria</span>
            </li>
            <li className="flex items-center gap-3 group">
              <FaPhone className="text-hotelGold group-hover:scale-110 transition-transform" />
              <a href="tel:+2348067073060" className="hover:text-hotelGold transition-colors duration-300 font-medium">
                0806 707 3060
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* COPYRIGHT & BRANDING SIGNATURE */}
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.3em] font-sans">
        <p className="text-gray-300">
          &copy; 2026 Kedest Hotel & Suites. All Rights Reserved.
        </p>
        
        <div className="flex items-center gap-2 italic text-gray-600">
          <span className="opacity-70">Architected by</span>
          <button 
            onClick={handleSecretAccess}
            className={`transition-all duration-300 font-bold border-b pb-0.5 outline-none bg-transparent cursor-default flex items-center gap-2 
              ${isRedirecting ? 'text-hotelGold border-hotelGold' : 'text-hotelGold/60 border-hotelGold/10 hover:text-hotelGold hover:border-hotelGold/40'}`}
          >
            {isRedirecting ? (
              <>
                <FaSyncAlt className="animate-spin text-[8px]" />
                Initializing Vault...
              </>
            ) : (
              "Chrisboi Excellence"
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;