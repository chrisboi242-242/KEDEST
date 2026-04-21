import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase'; 
import { useNavigate } from 'react-router-dom'; 
import { collection, onSnapshot } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth"; 
import { FaSyncAlt, FaMoneyBillWave, FaLock, FaPowerOff, FaUserCircle, FaCheckCircle, FaExclamationTriangle, FaFileDownload, FaEye, FaEyeSlash, FaWhatsapp, FaTrash, FaPlus, FaTimes, FaShieldAlt, FaKey } from 'react-icons/fa';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BOOKING_API_URL = import.meta.env.VITE_BOOKING_API_URL;
const ADMIN_KEY = import.meta.env.VITE_ADMIN_SECRET || 'Kedest_Owner_Secret_2026'; 

const Admin = () => {
  const navigate = useNavigate(); 
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newMasterKey, setNewMasterKey] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false); 
  const [processingId, setProcessingId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const [confirmModal, setConfirmModal] = useState({ show: false, title: "", message: "", onConfirm: null, type: "danger" });
  const [isManualBooking, setIsManualBooking] = useState(false);
  const [manualData, setManualData] = useState({ roomId: '', guestName: '', nights: 1, arrivalDate: '', guestEmail: '', guestPhone: '' });

  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setNotification({ show: true, message: msg, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 4000);
  }, []);

  const triggerConfirmation = (title, message, onConfirm, type = "danger") => {
    setConfirmModal({ show: true, title, message, onConfirm, type });
  };

  const closeConfirm = () => setConfirmModal({ ...confirmModal, show: false });

  // 1. UPDATED LOGOUT: Resets loading state immediately
  const handleLogout = useCallback(async () => {
    setIsLoggingIn(false);
    await signOut(auth);
    showToast("Session Terminated", "error");
  }, [showToast]);

  // 2. UPDATED EFFECT: Resets loading state on any auth change (login/logout)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setIsLoggingIn(false); 
    });
    
    const unsubscribeRooms = onSnapshot(collection(db, "rooms"), (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubscribeAuth(); unsubscribeRooms(); };
  }, []);

  const totalRevenue = rooms.reduce((acc, room) => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const shiftTotal = (room.bookings || []).reduce((sum, b) => {
      const ts = new Date(b.bookedAt || b.checkIn).getTime();
      return ts >= startOfToday ? sum + (Number(b.totalAmount) || 0) : sum;
    }, 0);
    return acc + shiftTotal;
  }, 0);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked || isLoggingIn) return; 
    
    setIsLoggingIn(true); 
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAttempts(0);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      setShake(true); 
      setAttempts(attempts + 1);
      setIsLoggingIn(false);
      if (attempts >= 4) { 
        setIsLocked(true); 
        setTimeout(() => { setIsLocked(false); setAttempts(0); }, 30000); 
      }
      showToast("Access Denied", "error");
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) return showToast("Enter valid Admin Email", "error");
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Reset Link Sent!");
    } catch (err) { showToast("Reset Failed", "error"); }
  };

  const executeMasterKeyOverwrite = async () => {
    if (newMasterKey.length < 6) return showToast("Key too short (min 6)", "error");
    setProcessingId('overwriting-key');
    closeConfirm();
    try {
      await axios.post(`${API_BASE_URL}/api/admin/force-password-update`, 
        { uid: user.uid, newPassword: newMasterKey }, 
        { headers: { 'x-admin-key': ADMIN_KEY } }
      );
      showToast("Master Key Updated Successfully");
      setNewMasterKey("");
    } catch (err) {
      showToast(err.response?.data?.message || "Protocol Rejected", "error");
    } finally { setProcessingId(null); }
  };

  const executeManualBooking = async () => {
    const selectedRoom = rooms.find(r => r.docId === manualData.roomId);
    if (!selectedRoom) return showToast("Room missing", "error");
    setProcessingId('manual-form');
    closeConfirm();
    try {
      const payload = {
        action: "confirm_payment",
        roomId: String(manualData.roomId),
        name: String(manualData.guestName).trim(),
        email: String(manualData.guestEmail || "walkin@kedest.com").trim(),
        phone: String(manualData.guestPhone || "000").trim(),
        nights: Number(manualData.nights),
        arrivalDate: manualData.arrivalDate,
        receiptBase64: "WALK_IN_GUEST", 
        roomPrice: Number(selectedRoom.price)
      };
      await axios.post(BOOKING_API_URL, payload);
      showToast("Suite Reserved Successfully");
      setIsManualBooking(false);
      setManualData({ roomId: '', guestName: '', nights: 1, arrivalDate: '', guestEmail: '', guestPhone: '' });
    } catch (err) {
      showToast(err.response?.status === 409 ? "DATE CONFLICT" : "Booking Failed", "error");
    } finally { setProcessingId(null); }
  };

  const executeTermination = async (roomDocId, bookingId) => {
    setProcessingId(roomDocId);
    closeConfirm();
    try {
      await axios.post(`${API_BASE_URL}/api/admin/terminate-booking`, 
        { roomId: roomDocId, bookingId },
        { headers: { 'x-admin-key': ADMIN_KEY } }
      );
      showToast("Guest Checked Out");
    } catch (err) { showToast("Rejection", "error"); } finally { setProcessingId(null); }
  };

  const updatePrice = async (id, inputValue) => {
    const newPrice = Number(inputValue);
    if (isNaN(newPrice) || newPrice <= 0) return showToast("Invalid Price", "error");
    setProcessingId(id);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/update-price`, { roomId: id, newPrice }, { headers: { 'x-admin-key': ADMIN_KEY } });
      showToast("Rate Updated");
    } catch (err) { showToast("Sync Error", "error"); } finally { setProcessingId(null); }
  };

  const generateAuditPDF = () => {
    const doc = new jsPDF();
    doc.text("KEDEST HOTEL REVENUE REPORT", 14, 20);
    const tableData = [];
    rooms.forEach(room => (room.bookings || []).forEach(b => tableData.push([room.name, b.guestName, b.checkIn?.split('T')[0] || 'N/A', `N${Number(b.totalAmount || 0).toLocaleString()}`])));
    autoTable(doc, { head: [['Room', 'Guest', 'Date', 'Amount']], body: tableData, startY: 30, theme: 'grid' });
    doc.save(`Kedest-Audit-${new Date().toLocaleDateString()}.pdf`);
    showToast("Audit Exported");
  };

  if (showSuccess) return (
    <div className="h-screen bg-hotelNavy flex flex-col items-center justify-center p-6 text-white font-sans animate-fadeIn">
      <FaCheckCircle className="text-hotelGold text-7xl mb-8 animate-bounce" />
      <h2 className="font-luxury text-4xl italic mb-4 tracking-wider">Identity Verified</h2>
      <p className="text-hotelGold uppercase tracking-[0.5em] text-xs opacity-70">Entering Control Tower</p>
    </div>
  );

  if (!user) return (
    <div className="h-screen bg-hotelNavy flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <form onSubmit={handleLogin} className={`bg-white p-10 shadow-2xl border-t-8 border-hotelGold max-w-sm w-full z-10 transition-all duration-300 ${shake ? 'animate-shake border-red-600' : ''}`}>
        <button type="button" onClick={() => navigate('/')} className="absolute -top-12 left-0 text-white/50 hover:text-hotelGold text-[10px] uppercase tracking-[0.3em]">← Back to Hotel</button>
        <FaLock className={`text-4xl mx-auto mb-4 ${isLocked ? 'text-red-600' : 'text-hotelGold'}`} />
        <h2 className="font-luxury text-2xl italic mb-8 text-center text-hotelNavy">Control Tower</h2>
        <div className="space-y-6">
          <input type="email" placeholder="Admin Email" className="w-full border p-3 outline-none text-sm focus:border-hotelGold" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="relative">
              <input type={showPass ? "text" : "password"} placeholder="Master Key" className="w-full border p-3 outline-none text-sm focus:border-hotelGold" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-400">{showPass ? <FaEyeSlash /> : <FaEye />}</button>
          </div>
        </div>
        <div className="mt-4 text-right">
            <button type="button" onClick={handleForgotPassword} className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-hotelGold transition-colors">Reset Access?</button>
        </div>
        {/* 3. UPDATED BUTTON: Dynamic cursor and loading state */}
        <button 
          type="submit" 
          disabled={isLocked || isLoggingIn} 
          className={`w-full mt-6 py-4 bg-hotelNavy text-hotelGold font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 
            ${(isLocked || isLoggingIn) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black cursor-pointer'}`}
        >
          {isLocked ? "Vault Locked" : isLoggingIn ? <><FaSyncAlt className="animate-spin" /> Establishing Link...</> : "Authorize Entry"}
        </button>
      </form>
    </div>
  );

  return (
    <div className="bg-[#f4f4f4] min-h-screen p-4 md:p-12 pb-32 font-sans text-hotelNavy">
      {confirmModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeConfirm}></div>
          <div className="bg-white w-full max-w-md relative z-10 shadow-2xl border-t-4 border-hotelGold p-8 animate-modalSlide">
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-full ${confirmModal.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-hotelGold/10 text-hotelGold'}`}>
                <FaShieldAlt className="text-2xl" />
              </div>
              <h2 className="font-luxury text-2xl italic">{confirmModal.title}</h2>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">{confirmModal.message}</p>
            <div className="flex gap-4">
              <button onClick={closeConfirm} className="flex-1 py-3 border border-gray-200 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">Abort</button>
              <button onClick={confirmModal.onConfirm} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${confirmModal.type === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-hotelNavy text-hotelGold hover:bg-black'}`}>Execute Protocol</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b-2 border-hotelGold pb-6 gap-6">
          <div>
            <h1 className="font-luxury text-4xl italic leading-none">Kedest Control Tower</h1>
            <p className="text-gray-400 uppercase tracking-[0.3em] text-[10px] mt-2 font-bold">Admin: {user.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={generateAuditPDF} className="bg-hotelGold text-hotelNavy px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white border border-hotelGold transition-all"><FaFileDownload /> Audit PDF</button>
            <div className="text-right border-l-2 border-gray-200 pl-6">
              <p className="text-[10px] uppercase font-bold text-hotelGold">Daily Revenue</p>
              <p className="text-2xl font-luxury italic">N{totalRevenue.toLocaleString()}</p>
            </div>
            <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2 border border-red-100 hover:bg-red-600 hover:text-white transition-all"><FaPowerOff /></button>
          </div>
        </header>

        <div className="mb-10 bg-white p-6 shadow-sm border-l-4 border-red-600 animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
                <FaKey className="text-red-600 text-xs" />
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Security Override: Update Master Key</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-4 relative">
                {processingId === 'overwriting-key' && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10"><FaSyncAlt className="animate-spin text-red-600" /></div>}
                <input 
                    type="text" 
                    placeholder="Enter New Master Key (Login Password)" 
                    className="flex-1 border p-3 outline-none text-sm focus:border-red-600 bg-gray-50"
                    value={newMasterKey}
                    onChange={(e) => setNewMasterKey(e.target.value)}
                />
                <button 
                    onClick={() => triggerConfirmation("Overwrite Master Key?", "This will immediately change your login password. Don't forget it.", executeMasterKeyOverwrite)}
                    className="bg-red-600 text-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                >
                    Update Key
                </button>
            </div>
        </div>

        <div className="mb-10">
            <button onClick={() => setIsManualBooking(!isManualBooking)} className="w-full bg-white border-2 border-dashed border-hotelGold p-4 text-hotelGold font-bold uppercase tracking-widest hover:bg-hotelGold hover:text-white transition-all flex items-center justify-center gap-3">
                {isManualBooking ? <><FaTimes /> Close Registry</> : <><FaPlus /> Register Walk-in Guest</>}
            </button>
            {isManualBooking && (
                <form onSubmit={(e) => { e.preventDefault(); triggerConfirmation("Verify Registration", `Finalize booking for ${manualData.guestName}?`, executeManualBooking, "success"); }} className="bg-white p-8 mt-4 shadow-xl border-t-4 border-hotelNavy grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn relative">
                    {processingId === 'manual-form' && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><FaSyncAlt className="animate-spin text-hotelGold text-3xl" /></div>}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Target Suite</label>
                        <select className="border p-3 outline-none text-sm bg-gray-50 focus:border-hotelGold" required value={manualData.roomId} onChange={e => setManualData({...manualData, roomId: e.target.value})}>
                            <option value="">Select Suite...</option>
                            {rooms.map(r => <option key={r.docId} value={r.docId}>{r.name} - (N{Number(r.price).toLocaleString()})</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Guest Name</label>
                        <input type="text" placeholder="John Doe" className="border p-3 outline-none text-sm bg-gray-50 focus:border-hotelGold" required value={manualData.guestName} onChange={e => setManualData({...manualData, guestName: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Check-In</label>
                        <input type="date" className="border p-3 outline-none text-sm bg-gray-50 focus:border-hotelGold" required value={manualData.arrivalDate} onChange={e => setManualData({...manualData, arrivalDate: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Nights</label>
                        <input type="number" min="1" className="border p-3 outline-none text-sm bg-gray-50 focus:border-hotelGold" required value={manualData.nights} onChange={e => setManualData({...manualData, nights: parseInt(e.target.value) || 1})} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Phone</label>
                        <input type="tel" placeholder="080..." className="border p-3 outline-none text-sm bg-gray-50 focus:border-hotelGold" value={manualData.guestPhone} onChange={e => setManualData({...manualData, guestPhone: e.target.value})} />
                    </div>
                    <button type="submit" className="md:mt-5 bg-hotelNavy text-hotelGold py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all">Initiate Protocol</button>
                </form>
            )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><FaSyncAlt className="animate-spin text-hotelGold text-4xl" /></div>
        ) : (
          <div className="space-y-6">
            {rooms.map((room) => {
              const now = new Date();
              const activeBookings = (room.bookings || []).filter(b => new Date(b.checkOut) > now);
              return (
                <div key={room.docId} className="bg-white p-6 shadow-sm border-l-4 border-hotelGold relative group">
                  {processingId === room.docId && <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center"><FaSyncAlt className="animate-spin text-hotelGold text-2xl" /></div>}
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                      <div className="flex items-center gap-4">
                          <img src={room.image} className="w-12 h-12 object-cover rounded grayscale group-hover:grayscale-0 transition-all" alt="" />
                          <h3 className="font-bold uppercase tracking-widest text-sm">{room.name}</h3>
                      </div>
                      <div className="bg-gray-50 p-2 border flex items-center gap-3 px-6 rounded-sm">
                          <FaMoneyBillWave className="text-hotelGold" />
                          <div className="flex flex-col">
                              <span className="text-[8px] uppercase font-bold text-gray-400">Nightly Rate</span>
                              <input type="number" defaultValue={room.price} onBlur={(e) => updatePrice(room.docId, e.target.value)} className="bg-transparent font-bold outline-none border-b border-transparent focus:border-hotelGold w-24" />
                          </div>
                      </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] uppercase font-black text-gray-300 tracking-[0.2em]">Current Residents</h4>
                    {activeBookings.length > 0 ? (
                      activeBookings.map((booking, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded border border-gray-100 gap-4">
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <FaUserCircle className="text-3xl text-hotelNavy/10" />
                            <div>
                              <p className="font-bold text-sm uppercase">{booking.guestName}</p>
                              <p className="text-[10px] text-gray-400 font-mono italic">{booking.checkIn?.split('T')[0]} — {booking.checkOut?.split('T')[0]}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => window.open(`https://wa.me/${booking.guestPhone?.replace(/\D/g, "")}`, "_blank")} className="p-2 bg-green-50 text-green-600 rounded border border-green-100 hover:bg-green-600 hover:text-white transition-all"><FaWhatsapp /></button>
                            <button onClick={() => triggerConfirmation("Terminate Occupancy", `Force check-out ${booking.guestName}?`, () => executeTermination(room.docId, booking.bookingId))} className="p-2 bg-red-50 text-red-600 rounded border border-red-100 hover:bg-red-600 hover:text-white transition-all"><FaTrash /></button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-lg text-gray-400 text-[10px] uppercase font-bold tracking-widest italic">Suite is Vacant</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ${notification.show ? "opacity-100" : "opacity-0"}`}>
        <div className={`px-8 py-4 rounded shadow-2xl flex items-center gap-4 border ${notification.type === "success" ? "bg-hotelNavy text-white border-hotelGold" : "bg-red-600 text-white border-red-400"}`}>
          {notification.type === "success" ? <FaCheckCircle className="text-hotelGold" /> : <FaExclamationTriangle />}
          <span className="text-[10px] uppercase font-bold tracking-widest">{notification.message}</span>
        </div>
      </div>
    </div>
  );
};

export default Admin;