import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase'; 
import { collection, onSnapshot, query } from "firebase/firestore";
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaCalendarAlt, FaMoon, FaCheckCircle, FaArrowUp, FaCoffee, FaWifi, FaSnowflake } from 'react-icons/fa';

const RoomCard = ({ room, checkIn, nights }) => {
  const navigate = useNavigate();
  const hasSelectedDates = checkIn !== "";

  // MEMOIZED AVAILABILITY LOGIC - Stability Fix: Handle Firestore Timestamps
  const isBlocked = useMemo(() => {
    if (!hasSelectedDates || !room.bookings) return false;
    
    return room.bookings.some(booking => {
      const selectedStart = new Date(checkIn).getTime();
      const selectedEnd = new Date(checkIn);
      selectedEnd.setDate(selectedEnd.getDate() + Number(nights));
      const endTimestamp = selectedEnd.getTime();

      // Convert Firestore Timestamps to JS Date if necessary
      const bookingStart = booking.checkIn?.seconds 
        ? new Date(booking.checkIn.seconds * 1000).getTime() 
        : new Date(booking.checkIn).getTime();
      const bookingEnd = booking.checkOut?.seconds 
        ? new Date(booking.checkOut.seconds * 1000).getTime() 
        : new Date(booking.checkOut).getTime();
      
      return (selectedStart < bookingEnd) && (endTimestamp > bookingStart);
    });
  }, [room.bookings, checkIn, nights, hasSelectedDates]);

  const handleBooking = () => {
    if (!hasSelectedDates) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (isBlocked) return; 
    navigate('/book-now', { 
      state: { 
        selectedRoom: room.name, 
        roomId: room.docId,
        roomPrice: room.price,
        arrivalDate: checkIn,
        nights: nights
      } 
    });
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group bg-white border border-gray-100 shadow-sm transition-all duration-700 overflow-hidden relative ${isBlocked ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-2xl hover:-translate-y-2'}`}
    >
      <div className="relative h-96 overflow-hidden cursor-pointer" onClick={handleBooking}>
        <img 
          src={room.image} 
          alt={room.name} 
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-[5000ms] ${(!isBlocked && hasSelectedDates) && 'group-hover:scale-110'}`} 
        />
        
        <div className={`absolute inset-0 transition-all duration-500 ${isBlocked ? 'bg-black/70 backdrop-blur-[2px]' : 'bg-gradient-to-t from-hotelNavy/80 via-transparent to-transparent opacity-60 group-hover:opacity-40'}`}></div>
        
        <AnimatePresence>
          {!hasSelectedDates && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-hotelNavy/40 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
            >
              <FaCalendarAlt className="text-hotelGold text-3xl mb-3 animate-bounce" />
              <span className="text-[10px] font-bold tracking-[0.4em] text-white uppercase px-4 py-2 border border-white/20">Lock in dates to view</span>
            </motion.div>
          )}

          {hasSelectedDates && isBlocked && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-hotelGold"
            >
              <FaLock className="text-4xl mb-4 opacity-90" />
              <span className="text-[11px] font-black tracking-[0.6em] uppercase px-6 py-3 border-2 border-hotelGold/50 bg-hotelNavy/90">Fully Booked</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-4 right-4 flex gap-2">
           <div className="bg-white/10 backdrop-blur-md p-2 text-white border border-white/20"><FaWifi size={12}/></div>
           <div className="bg-white/10 backdrop-blur-md p-2 text-white border border-white/20"><FaSnowflake size={12}/></div>
           <div className="bg-white/10 backdrop-blur-md p-2 text-white border border-white/20"><FaCoffee size={12}/></div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h3 className={`font-luxury text-3xl italic ${isBlocked || !hasSelectedDates ? 'text-gray-400' : 'text-hotelNavy'}`}>{room.name}</h3>
            <div className="flex items-center gap-2">
              <span className="w-8 h-[1px] bg-hotelGold"></span>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                {hasSelectedDates ? `Available for ${nights} night(s)` : "Premium Experience"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Per Night</p>
            <div className={`${isBlocked || !hasSelectedDates ? 'text-gray-300' : 'text-hotelNavy'} font-bold text-2xl tracking-tighter`}>
              <span className="text-sm font-light mr-1">₦</span>{Number(room.price).toLocaleString()}
            </div>
          </div>
        </div>

        <button 
          onClick={handleBooking}
          disabled={isBlocked}
          className={`w-full text-center py-5 font-black uppercase tracking-[0.5em] text-[10px] transition-all duration-500 shadow-xl ${
            !hasSelectedDates 
            ? 'bg-hotelGold text-hotelNavy hover:bg-white'
            : isBlocked 
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
            : 'bg-hotelNavy text-hotelGold hover:bg-white hover:text-hotelNavy'
          }`}
        >
          {!hasSelectedDates ? "Initialize Stay" : isBlocked ? "Suites Occupied" : "Secure This Residence"}
        </button>
      </div>
    </motion.div>
  );
};

const Suites = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const [filterDates, setFilterDates] = useState({ checkIn: "", nights: 1 });

  useEffect(() => {
    const q = query(collection(db, "rooms")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      // Robust sorting: prioritize custom index if it exists
      const sortedRooms = roomsData.sort((a, b) => (a.index || 0) - (b.index || 0));
      setRooms(sortedRooms);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error in Suites:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const availableCount = useMemo(() => {
    return rooms.filter(room => {
      if (filterDates.checkIn === "") return true; 
      const isOccupied = room.bookings?.some(b => {
        const sStart = new Date(filterDates.checkIn).getTime();
        const sEnd = new Date(filterDates.checkIn);
        sEnd.setDate(sEnd.getDate() + Number(filterDates.nights));
        const sEndTime = sEnd.getTime();
        
        const bStart = b.checkIn?.seconds ? b.checkIn.seconds * 1000 : new Date(b.checkIn).getTime();
        const bEnd = b.checkOut?.seconds ? b.checkOut.seconds * 1000 : new Date(b.checkOut).getTime();

        return (sStart < bEnd) && (sEndTime > bStart);
      });
      return !isOccupied;
    }).length;
  }, [rooms, filterDates]);

  return (
    <div className="bg-hotelSoftWhite min-h-screen pb-32 font-sans text-hotelNavy">
      <section className="bg-hotelNavy py-32 md:py-48 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-black text-white/[0.02] pointer-events-none select-none">
          KEDEST
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-5xl mx-auto"
        >
          <span className="text-hotelGold text-[10px] md:text-xs tracking-[1em] uppercase font-black">Collection 2026</span>
          <h1 className="font-luxury text-white text-5xl md:text-9xl mt-8 mb-12 italic leading-tight">
            Our Private <span className="text-hotelGold">Residences</span>
          </h1>
          
          <div className={`mt-12 bg-white p-3 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center gap-4 max-w-4xl mx-auto border-2 transition-all duration-1000 ${filterDates.checkIn === "" ? 'border-hotelGold' : 'border-white'}`}>
            <div className="flex items-center gap-4 px-8 py-4 w-full md:border-r border-gray-100">
              <FaCalendarAlt className="text-hotelGold text-xl" />
              <div className="text-left w-full">
                <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Arrival Date</p>
                <input 
                  type="date" 
                  min={today} 
                  className="outline-none text-hotelNavy font-bold text-lg bg-transparent cursor-pointer w-full" 
                  value={filterDates.checkIn} 
                  onChange={(e) => setFilterDates({...filterDates, checkIn: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 px-8 py-4 w-full">
              <FaMoon className="text-hotelGold text-xl" />
              <div className="text-left w-full">
                <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Stay Duration</p>
                <select 
                  className="outline-none text-hotelNavy font-bold text-lg bg-transparent cursor-pointer w-full appearance-none" 
                  value={filterDates.nights} 
                  onChange={(e) => setFilterDates({...filterDates, nights: e.target.value})}
                >
                  {[1,2,3,4,5,7,14,30].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Night' : 'Nights'}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center items-center gap-3 text-hotelGold/80 text-xs uppercase tracking-[0.3em] font-black">
            {filterDates.checkIn === "" ? (
              <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity }} className="flex items-center gap-3">
                <FaArrowUp /> Initialize dates to unlock the collection
              </motion.span>
            ) : (
              <div className="flex items-center gap-3 bg-hotelGold/10 px-6 py-2 rounded-full border border-hotelGold/20">
                <FaCheckCircle className="text-green-500" />
                <span>{availableCount} {availableCount === 1 ? 'Suite' : 'Suites'} Ready for you</span>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-6 mt-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-hotelGold/20 border-t-hotelGold rounded-full animate-spin"></div>
            <p className="text-hotelGold uppercase tracking-[0.4em] text-[10px] font-bold">Curating Residences...</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-20">
            {rooms.map((room) => (
              <RoomCard 
                key={room.docId} 
                room={room} 
                checkIn={filterDates.checkIn} 
                nights={filterDates.nights} 
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Suites;