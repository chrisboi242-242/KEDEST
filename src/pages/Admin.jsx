import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase'; 
import { useNavigate } from 'react-router-dom'; 
import { collection, onSnapshot } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"; 
import { FaSyncAlt, FaMoneyBillWave, FaLock, FaPowerOff, FaUserCircle, FaCheckCircle, FaExclamationTriangle, FaFileDownload, FaEye, FaEyeSlash, FaWhatsapp, FaTrash, FaCopy, FaPlus, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CONFIGURATION (Environment Variables) ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/admin';
const BOOKING_API_URL = import.meta.env.VITE_BOOKING_API_URL || 'http://localhost:5000/api/secure-booking';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_SECRET || 'Kedest_Owner_Secret_2026'; 

const Admin = () => {
  const navigate = useNavigate(); 
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Manual Booking State
  const [isManualBooking, setIsManualBooking] = useState(false);
  const [manualData, setManualData] = useState({ 
    roomId: '', 
    guestName: '', 
    nights: 1, 
    arrivalDate: '',
    guestEmail: '',
    guestPhone: ''
  });

  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    showToast("Session Terminated", "error");
  }, [showToast]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });

    const unsubscribeRooms = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      setRooms(roomsData);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRooms();
    };
  }, []);

  const totalRevenue = rooms.reduce((acc, room) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const shiftTotal = (room.bookings || []).reduce((sum, b) => {
      const bookingTimestamp = new Date(b.bookedAt || b.checkIn).getTime();
      if (bookingTimestamp >= startOfToday.getTime()) {
        return sum + (Number(b.totalAmount) || 0);
      }
      return sum;
    }, 0);
    return acc + shiftTotal;
  }, 0);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked) return showToast("Vault Locked. Wait 30s.", "error");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAttempts(0);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      setShake(true);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setIsLocked(true);
        setTimeout(() => { setIsLocked(false); setAttempts(0); }, 30000);
      }
      showToast("Access Denied", "error");
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleManualBooking = async (e) => {
    e.preventDefault();
    const selectedRoom = rooms.find(r => r.docId === manualData.roomId);
    if (!selectedRoom) return showToast("Select a Suite", "error");

    setProcessingId('manual-form');
    try {
      // payload updated to match the backend walk-in logic
      await axios.post(BOOKING_API_URL, {
        action: "confirm_payment",
        roomId: manualData.roomId,
        name: manualData.guestName,
        email: manualData.guestEmail || "walkin@kedest.com",
        phone: manualData.guestPhone,
        nights: manualData.nights,
        arrivalDate: manualData.arrivalDate,
        receiptBase64: "WALK_IN_GUEST", 
        roomPrice: selectedRoom.price
      });
      
      showToast("Suite Reserved Successfully");
      setIsManualBooking(false);
      setManualData({ roomId: '', guestName: '', nights: 1, arrivalDate: '', guestEmail: '', guestPhone: '' });
    } catch (err) {
      showToast(err.response?.data?.message || "Booking Failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const terminateBooking = async (roomDocId, bookingObj) => {
    if (!window.confirm(`Force check out ${bookingObj.guestName}?`)) return;
    setProcessingId(roomDocId);
    try {
      await axios.post(`${API_BASE_URL}/terminate-booking`, 
        { roomId: roomDocId, bookingId: bookingObj.bookingId },
        { headers: { 'x-admin-key': ADMIN_KEY } }
      );
      showToast("Guest Checked Out");
    } catch (err) {
      showToast("Backend Rejection", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const updatePrice = async (id, inputValue) => {
    const newPrice = Number(inputValue);
    if (isNaN(newPrice) || newPrice <= 0) return showToast("Invalid Price", "error");
    setProcessingId(id);
    try {
      await axios.post(`${API_BASE_URL}/update-price`, 
        { roomId: id, newPrice },
        { headers: { 'x-admin-key': ADMIN_KEY } }
      );
      showToast("Rate Updated");
    } catch (err) {
      showToast("Server Error", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const generateAuditPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("KEDEST HOTEL REVENUE REPORT", 14, 20);
    const tableData = [];
    rooms.forEach(room => {
        (room.bookings || []).forEach(b => {
            tableData.push([room.name, b.guestName, b.checkIn.split('T')[0], `N${Number(b.totalAmount).toLocaleString()}`]);
        });
    });
    autoTable(doc, { head: [['Room', 'Guest', 'Date', 'Amount']], body: tableData, startY: 30, theme: 'grid' });
    doc.save(`Kedest-Audit-${new Date().toLocaleDateString()}.pdf`);
    showToast("Audit Exported");
  };

  const copyToClipboard = (text) => {
    if(!text) return;
    navigator.clipboard.writeText(text);
    showToast("Number Copied");
  };

  if (showSuccess) {
    return (
      <div className="h-screen bg-hotelNavy flex flex-col items-center justify-center p-6 text-white font-sans">
        <FaCheckCircle className="text-hotelGold text-7xl mb-8 animate-bounce" />
        <h2 className="font-luxury text-4xl italic mb-4">Identity Verified</h2>
        <p className="text-hotelGold uppercase tracking-[0.5em] text-xs">Entering Control Tower</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-hotelNavy flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <form onSubmit={handleLogin} className={`bg-white p-10 shadow-2xl border-t-8 border-hotelGold max-w-sm w-full z-10 transition-all duration-300 ${shake ? 'animate-shake border-red-600' : ''}`}>
          <button type="button" onClick={() => navigate('/')} className="absolute -top-12 left-0 text-white/50 hover:text-hotelGold text-[10px] uppercase tracking-[0.3em]">← Back to Hotel</button>
          <FaLock className={`text-4xl mx-auto mb-4 ${isLocked ? 'text-red-600' : 'text-hotelGold'}`} />
          <h2 className="font-luxury text-2xl italic mb-8 text-center text-hotelNavy">Control Tower</h2>
          <div className="space-y-6">
            <input type="email" placeholder="Admin Email" className="w-full border p-3 outline-none text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="Master Key" className="w-full border p-3 outline-none text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-400">{showPass ? <FaEyeSlash /> : <FaEye />}</button>
            </div>
          </div>
          <button type="submit" disabled={isLocked} className="w-full mt-8 py-4 bg-hotelNavy text-hotelGold font-bold uppercase tracking-widest text-xs hover:bg-black transition-all">
            {isLocked ? "Vault Locked" : "Authorize Entry"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f4f4] min-h-screen p-4 md:p-12 pb-32 font-sans text-hotelNavy">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b-2 border-hotelGold pb-6 gap-6">
          <div>
            <h1 className="font-luxury text-4xl italic leading-none">Kedest Control Tower</h1>
            <p className="text-gray-400 uppercase tracking-[0.3em] text-[10px] mt-2 font-bold">Admin: {user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={generateAuditPDF} className="bg-hotelGold text-hotelNavy px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white border border-hotelGold transition-all"><FaFileDownload /> Audit PDF</button>
            <div className="text-right border-l-2 border-gray-200 pl-6">
              <p className="text-[10px] uppercase font-bold text-hotelGold">Total Revenue (Today)</p>
              <p className="text-2xl font-luxury italic leading-none">N{totalRevenue.toLocaleString()}</p>
            </div>
            <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2 border border-red-100 hover:bg-red-600 hover:text-white transition-all"><FaPowerOff /></button>
          </div>
        </header>

        <div className="mb-10">
            <button 
                onClick={() => setIsManualBooking(!isManualBooking)}
                className="w-full bg-white border-2 border-dashed border-hotelGold p-4 text-hotelGold font-bold uppercase tracking-widest hover:bg-hotelGold hover:text-white transition-all flex items-center justify-center gap-3"
            >
                {isManualBooking ? <><FaTimes /> Close Registry</> : <><FaPlus /> Register Walk-in Guest</>}
            </button>

            {isManualBooking && (
                <form onSubmit={handleManualBooking} className="bg-white p-8 mt-4 shadow-xl border-t-4 border-hotelNavy grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn relative">
                    {processingId === 'manual-form' && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><FaSyncAlt className="animate-spin text-hotelGold text-3xl" /></div>}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Target Suite</label>
                        <select className="border p-3 outline-none text-sm bg-gray-50 focus:border-hotelGold transition-all" required value={manualData.roomId} onChange={e => setManualData({...manualData, roomId: e.target.value})}>
                            <option value="">Select Suite...</option>
                            {rooms.map(r => <option key={r.docId} value={r.docId}>{r.name} - (N{Number(r.price).toLocaleString()})</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Guest Full Name</label>
                        <input type="text" placeholder="e.g. John Doe" className="border p-3 outline-none text-sm bg-gray-50 focus:border-hotelGold transition-all" required value={manualData.guestName} onChange={e => setManualData({...manualData, guestName: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Check-In Date</label>
                        <input type="date" className="border p-3 outline-none text-sm bg-gray-50 focus:border-hotelGold transition-all" required value={manualData.arrivalDate} onChange={e => setManualData({...manualData, arrivalDate: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Duration (Nights)</label>
                        <input type="number" min="1" className="border p-3 outline-none text-sm bg-gray-50 focus:border-hotelGold transition-all" required value={manualData.nights} onChange={e => setManualData({...manualData, nights: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Guest Phone</label>
                        <input type="tel" placeholder="080..." className="border p-3 outline-none text-sm bg-gray-50 focus:border-hotelGold transition-all" value={manualData.guestPhone} onChange={e => setManualData({...manualData, guestPhone: e.target.value})} />
                    </div>
                    <button type="submit" className="md:mt-5 bg-hotelNavy text-hotelGold py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all">Finalize Reservation</button>
                </form>
            )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><FaSyncAlt className="animate-spin text-hotelGold text-4xl" /></div>
        ) : (
          <div className="space-y-6">
            {rooms.map((room) => {
              const now = new Date();
              const activeBookings = (room.bookings || []).filter(booking => {
                const checkOutDate = new Date(booking.checkOut);
                return checkOutDate > now;
              });

              return (
                <div key={room.docId} className="bg-white p-6 shadow-sm border-l-4 border-hotelGold relative overflow-hidden group">
                  {processingId === room.docId && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-[1px]">
                      <FaSyncAlt className="animate-spin text-hotelGold text-2xl" />
                    </div>
                  )}
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                      <div className="flex items-center gap-4">
                          <img src={room.image} className="w-12 h-12 object-cover rounded shadow-sm grayscale group-hover:grayscale-0 transition-all" alt="" />
                          <h3 className="font-bold uppercase tracking-widest">{room.name}</h3>
                      </div>
                      
                      <div className="bg-gray-50 p-2 border flex items-center gap-3 px-6 rounded-sm hover:border-hotelGold transition-all group/price relative">
                          <FaMoneyBillWave className="text-hotelGold" />
                          <div className="flex flex-col">
                              <span className="text-[8px] uppercase font-bold text-gray-400 group-hover/price:text-hotelGold transition-colors">Nightly Rate (N)</span>
                              <input 
                                  type="number" 
                                  defaultValue={room.price} 
                                  onBlur={(e) => updatePrice(room.docId, e.target.value)} 
                                  className="bg-transparent font-bold outline-none border-b border-transparent focus:border-hotelGold w-24 cursor-pointer focus:cursor-text hover:text-hotelGold transition-colors"
                                  title="Click to edit price"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] uppercase font-black text-gray-300 tracking-[0.2em] mb-2">Current Residents</h4>
                    {activeBookings.length > 0 ? (
                      activeBookings.map((booking, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded-lg gap-4 border border-gray-100 hover:border-hotelGold transition-colors">
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <FaUserCircle className="text-3xl text-hotelNavy/20" />
                            <div>
                              <p className="font-bold text-sm uppercase">{booking.guestName}</p>
                              <p className="text-[10px] text-gray-500 font-mono">{booking.checkIn?.split('T')[0]} — {booking.checkOut?.split('T')[0]}</p>
                              <p className="text-[10px] font-bold text-hotelGold">Total: ₦{Number(booking.totalAmount).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            {booking.receiptURL && (
                              <a href={booking.receiptURL} target="_blank" rel="noreferrer" title="View Receipt" className="p-2 bg-white border border-gray-200 text-hotelNavy hover:text-hotelGold rounded shadow-sm transition-all">
                                <FaEye />
                              </a>
                            )}
                            <button onClick={() => copyToClipboard(booking.guestPhone)} title="Copy Phone Number" className="p-2 bg-blue-50 text-blue-600 rounded border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">
                              <FaCopy />
                            </button>
                            <button onClick={() => window.open(`https://wa.me/${booking.guestPhone?.replace(/\D/g, "")}`, "_blank")} title="WhatsApp Guest" className="p-2 bg-green-50 text-green-600 rounded border border-green-100 hover:bg-green-600 hover:text-white transition-all">
                              <FaWhatsapp />
                            </button>
                            <button onClick={() => terminateBooking(room.docId, booking)} title="Terminate Booking" className="p-2 bg-red-50 text-red-600 rounded border border-red-100 hover:bg-red-600 hover:text-white transition-all">
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-lg">
                          <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest italic">Suite is Vacant</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${notification.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        <div className={`px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 border ${notification.type === "success" ? "bg-hotelNavy text-white border-hotelGold" : "bg-red-600 text-white border-red-400"}`}>
          {notification.type === "success" ? <FaCheckCircle className="text-hotelGold" /> : <FaExclamationTriangle />}
          <span className="text-[10px] uppercase font-bold tracking-widest">{notification.message}</span>
        </div>
      </div>
    </div>
  );
};

export default Admin;