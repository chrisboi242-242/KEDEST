import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios'; // Added missing axios import
import { 
  FaCheckCircle, FaSyncAlt, FaMoon, 
  FaUpload, FaCalendarAlt, FaDoorOpen, FaTimes, FaArrowLeft 
} from 'react-icons/fa';

// Define the API URL correctly from your environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://kedest-engine.onrender.com";

const BookNow = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { 
    selectedRoom: preSelectedRoomName = "", 
    roomId: preSelectedRoomId = null, 
    roomPrice: preSelectedRoomPrice = 0, 
    arrivalDate: passedArrivalDate = "", 
    nights: passedNights = 1 
  } = location.state || {};

  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    phone: '', 
    nights: passedNights, 
    arrivalDate: passedArrivalDate
  });

  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false); 
  const [bookingResult, setBookingResult] = useState(null); 
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [showFinalSuccess, setShowFinalSuccess] = useState(false); 
  const [conflictMessage, setConflictMessage] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);

  useEffect(() => {
    if (!preSelectedRoomId || !passedArrivalDate) {
      setShowSelectionModal(true);
    }
  }, [preSelectedRoomId, passedArrivalDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.name.trim().length < 3) {
      alert("Protocol Error: Please enter a valid legal name.");
      return;
    }
    
    setIsSending(true);

    try {
      // Switched to axios for consistency or kept fetch with corrected URL
      const response = await fetch(`${import.meta.env.VITE_BOOKING_API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "initialize",
          roomId: preSelectedRoomId,
          roomName: preSelectedRoomName,
          roomPrice: preSelectedRoomPrice,
          ...formData
        })
      });

      const result = await response.json();

      if (response.status === 409 || !result.success) {
        setConflictMessage(result.message || "These dates are no longer available.");
        setShowConflict(true);
        return;
      }

      setBookingResult(result); 
      setShowSuccess(true);
    } catch (error) {
      console.error("Booking Error:", error);
      setConflictMessage("Protocol Error: Connection to booking engine failed.");
      setShowConflict(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleReceiptConfirm = async () => {
    if (!receiptFile) return;
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.readAsDataURL(receiptFile);
    reader.onloadend = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BOOKING_API_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            action: "confirm_payment",
            roomId: preSelectedRoomId,
            receiptBase64: reader.result, 
          })
        });

        const result = await response.json();

        if (result.success) {
          setShowSuccess(false);
          setShowFinalSuccess(true); 
          
          setTimeout(() => {
            navigate('/suites', { state: { message: "Booking received. Verification in progress." } });
          }, 4000);
        } else {
          setConflictMessage(result.message);
          setShowConflict(true);
        }
      } catch (error) {
        setConflictMessage("Verification failed. Please retry.");
        setShowConflict(true);
      } finally {
        setIsUploading(false);
      }
    };
  };

  return (
    <div className="bg-hotelSoftWhite min-h-screen font-sans text-hotelNavy selection:bg-hotelGold selection:text-hotelNavy">
      
      {/* FINAL SUCCESS OVERLAY */}
      <AnimatePresence>
        {showFinalSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[2000] bg-hotelNavy flex items-center justify-center p-6 text-center"
          >
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="max-w-sm">
              <FaCheckCircle className="text-hotelGold text-6xl mx-auto mb-8 animate-pulse" />
              <h2 className="font-luxury text-3xl text-white italic uppercase tracking-[0.2em] mb-4">Request Sent</h2>
              <p className="text-gray-400 text-sm font-light tracking-widest leading-relaxed">
                Your reservation protocol has been initiated. Verification is in progress.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SELECTION REQUIRED MODAL */}
      <AnimatePresence>
        {showSelectionModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[500] bg-hotelNavy/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white max-w-lg w-full p-12 shadow-2xl border-t-8 border-hotelGold text-center">
              <FaDoorOpen className="text-hotelGold text-5xl mx-auto mb-6" />
              <h2 className="font-luxury text-3xl italic mb-4 uppercase text-hotelNavy">Selection Required</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                To guarantee the <span className="text-hotelNavy font-bold italic underline">Kedest Experience</span>, please select your dates and a suite before proceeding.
              </p>
              <Link to="/suites" className="block w-full bg-hotelNavy text-hotelGold py-5 font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-hotelGold hover:text-hotelNavy transition-all duration-500 shadow-lg">
                Browse Available Suites
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-hotelNavy py-24 px-6 text-center border-b border-hotelGold/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10"></div>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-hotelGold text-[10px] tracking-[0.8em] uppercase font-black block mb-4">Secure Checkout</span>
          <h1 className="font-luxury text-white text-6xl md:text-8xl italic uppercase leading-none">Reservations</h1>
        </motion.div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-12 pb-24 relative z-10">
        <div className="flex flex-col lg:flex-row shadow-2xl bg-white overflow-hidden border border-gray-100">
          
          <div className="lg:w-5/12 bg-hotelNavy p-12 text-white flex flex-col justify-center space-y-10">
            <div className="border-l-4 border-hotelGold pl-8">
              <p className="text-hotelGold font-black text-[10px] uppercase tracking-[0.4em] mb-4">Priority Protocol</p>
              <h3 className="font-luxury text-4xl italic mb-6">Arrival Protocol</h3>
              <p className="text-gray-400 text-lg font-light leading-relaxed italic opacity-80">
                Confirmed payments guarantee immediate suite access upon arrival.
              </p>
            </div>
            
            <div className="space-y-4 pt-10 border-t border-white/10">
               <div className="flex justify-between text-sm uppercase tracking-widest text-gray-400">
                 <span>Suite:</span>
                 <span className="text-hotelGold font-bold">{preSelectedRoomName || "No Selection"}</span>
               </div>
               <div className="flex justify-between text-sm uppercase tracking-widest text-gray-400">
                 <span>Total Est:</span>
                 <span className="text-white">₦{(Number(preSelectedRoomPrice) * Number(formData.nights)).toLocaleString()}</span>
               </div>
            </div>
          </div>

          <div className="lg:w-7/12 p-10 md:p-20">
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="group relative">
                <label className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400">Full Legal Name</label>
                <input type="text" required className="w-full border-b-2 border-gray-100 py-4 focus:border-hotelGold outline-none transition-all text-xl font-light" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="group">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400 flex items-center gap-2"><FaCalendarAlt className="text-hotelGold"/> Check-In</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]} required className="w-full border-b-2 border-gray-100 py-4 focus:border-hotelGold outline-none" value={formData.arrivalDate} onChange={(e) => setFormData({...formData, arrivalDate: e.target.value})} />
                </div>
                <div className="group">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400 flex items-center gap-2"><FaMoon className="text-hotelGold"/> Nights</label>
                  <input type="number" min="1" required className="w-full border-b-2 border-gray-100 py-4 focus:border-hotelGold outline-none" value={formData.nights} onChange={(e) => setFormData({...formData, nights: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400">Contact Number</label>
                  <input type="tel" placeholder="+234..." required className="w-full border-b-2 border-gray-100 py-4 focus:border-hotelGold outline-none" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400">Communication Email</label>
                  <input type="email" required className="w-full border-b-2 border-gray-100 py-4 focus:border-hotelGold outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={isSending} className="w-full bg-hotelNavy text-hotelGold py-6 font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl hover:bg-hotelGold hover:text-hotelNavy transition-all duration-500 disabled:opacity-50">
                {isSending ? <FaSyncAlt className="animate-spin mx-auto text-xl" /> : "Verify & Generate Invoice"}
              </motion.button>
            </form>
          </div>
        </div>
      </main>

      {/* SUCCESS / INVOICE MODAL */}
      <AnimatePresence>
        {showSuccess && bookingResult && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[600] bg-hotelNavy/98 backdrop-blur-2xl flex items-center justify-center p-6 overflow-y-auto"
          >
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white max-w-lg w-full p-10 md:p-14 border-t-8 border-hotelGold shadow-2xl">
              <div className="text-center mb-8">
                <FaCheckCircle className="text-hotelGold text-5xl mx-auto mb-4" />
                <h2 className="font-luxury text-3xl text-hotelNavy italic uppercase tracking-tighter">Verified Invoice</h2>
              </div>
              
              <div className="bg-gray-50 p-8 text-left border border-gray-100 mb-8 space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Total Investment</p>
                    <p className="text-4xl font-black text-hotelNavy tracking-tighter">₦{bookingResult.total.toLocaleString()}</p>
                  </div>
                  <hr className="border-gray-200"/>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Transfer Details (Access Bank)</p>
                    <p className="text-lg font-bold text-hotelNavy tracking-widest">1704986063</p>
                    <p className="text-[11px] text-hotelNavy/60 uppercase font-black">Anoruo Uzoma Christian Chibueze</p>
                  </div>
              </div>

              <label className={`block border-2 border-dashed p-10 mb-8 text-center cursor-pointer transition-all duration-500 ${receiptFile ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-hotelGold'}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setReceiptFile(e.target.files[0])} />
                  <FaUpload className={`text-3xl mx-auto mb-4 ${receiptFile ? 'text-green-500' : 'text-hotelGold'}`} />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                    {receiptFile ? receiptFile.name : "Attach Transfer Receipt"}
                  </p>
              </label>

              <div className="flex flex-col gap-4">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReceiptConfirm} disabled={isUploading || !receiptFile}
                  className="w-full bg-hotelNavy text-white py-5 font-black uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-3 hover:bg-hotelGold hover:text-hotelNavy transition-all duration-500 disabled:opacity-30 shadow-xl"
                >
                  {isUploading ? <><FaSyncAlt className="animate-spin" /> Verifying...</> : "Confirm Payment"}
                </motion.button>

                {!isUploading && (
                  <button onClick={() => setShowSuccess(false)} className="w-full py-4 bg-gray-100 text-gray-500 font-bold uppercase tracking-[0.2em] text-[9px] hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <FaArrowLeft /> Edit Booking Details
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFLICT MODAL */}
      <AnimatePresence>
        {showConflict && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] bg-hotelNavy/90 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white max-w-md w-full p-10 border-t-8 border-red-600 shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTimes className="text-2xl" />
              </div>
              <h2 className="font-luxury text-2xl italic mb-4 uppercase text-hotelNavy">Booking Conflict</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">{conflictMessage}</p>
              <button onClick={() => setShowConflict(false)} className="w-full bg-hotelNavy text-white py-4 font-bold uppercase tracking-widest hover:bg-red-600 transition-all">Adjust Details</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookNow;