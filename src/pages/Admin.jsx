import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase'; 
import { useNavigate } from 'react-router-dom'; 
import { collection, onSnapshot } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"; 
import { FaSyncAlt, FaMoneyBillWave, FaLock, FaPowerOff, FaUserCircle, FaCheckCircle, FaExclamationTriangle, FaFileDownload, FaEye, FaEyeSlash, FaWhatsapp, FaTrash, FaPlus, FaTimes, FaShieldAlt, FaKey } from 'react-icons/fa';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // --- 🔐 NEW: LOGIN-SIDE BACKDOOR RESET ---
  const handleBackdoorReset = async () => {
    if (!email || !password) {
      return showToast("Enter Target Email & New Key in the fields", "error");
    }

    triggerConfirmation(
      "Emergency Backdoor", 
      `This will force-update the password for ${email} using the Admin Secret. Continue?`, 
      async () => {
        setProcessingId('backdoor-reset');
        closeConfirm();
        try {
          await axios.post(`${API_BASE_URL}/backdoor-reset`, {
            email: email,
            newPassword: password, // Uses what's typed in the password box
            adminKey: ADMIN_KEY
          });
          showToast("Access Restored. Try Logging in now.");
        } catch (err) {
          showToast("Reset Failed: Check Admin Key or Email", "error");
        } finally {
          setProcessingId(null);
        }
      }
    );
  };

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsLoggingIn(false);
      setShowSuccess(false);
      setEmail("");
      setPassword("");
      showToast("Session Terminated", "error");
    } catch (err) {
      showToast("Logout Error", "error");
    }
  }, [showToast]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
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
    if (isLocked) return showToast("Vault Locked. Wait 30s.", "error");
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

  // --- ⚙️ INTERNAL MANAGEMENT ACTIONS ---
  const executeMasterKeyOverwrite = async () => {
    if (newMasterKey.length < 6) return showToast("Key too short (min 6)", "error");
    setProcessingId('overwriting-key');
    closeConfirm();
    try {
      await axios.post(`${API_BASE_URL}/force-password-update`, {
        uid: user.uid,
        newPassword: newMasterKey
      }, { headers: { 'x-admin-key': ADMIN_KEY } });
      showToast("Master Key Protocol Updated");
      setNewMasterKey("");
    } catch (err) {
      showToast("Backend Rejection", "error");
    } finally { setProcessingId(null); }
  };

  // ... [executeManualBooking, executeTermination, updatePrice, generateAuditPDF - all stay the same] ...
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
      await axios.post(`${API_BASE_URL}/terminate-booking`, 
        { roomId: roomDocId, bookingId },
        { headers: { 'x-admin-key': ADMIN_KEY } }
      );
      showToast("Guest Checked Out");
    } catch (err) { showToast("Termination Failed", "error"); } finally { setProcessingId(null); }
  };

  const updatePrice = async (id, inputValue) => {
    const newPrice = Number(inputValue);
    if (isNaN(newPrice) || newPrice <= 0) return showToast("Invalid Price", "error");
    setProcessingId(id);
    try {
      await axios.post(`${API_BASE_URL}/update-price`, { roomId: id, newPrice }, { headers: { 'x-admin-key': ADMIN_KEY } });
      showToast("Rate Updated");
    } catch (err) { showToast("Update Failed", "error"); } finally { setProcessingId(null); }
  };

  const generateAuditPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
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

  // --- 🔓 LOGIN INTERFACE ---
  if (!user) return (
    <div className="h-screen bg-hotelNavy flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <form onSubmit={handleLogin} className={`bg-white p-10 shadow-2xl border-t-8 border-hotelGold max-w-sm w-full z-10 transition-all duration-300 ${shake ? 'animate-shake border-red-600' : ''}`}>
        <button type="button" onClick={() => navigate('/')} className="absolute -top-12 left-0 text-white/50 hover:text-hotelGold text-[10px] uppercase tracking-[0.3em]">← Back to Hotel</button>
        <FaLock className={`text-4xl mx-auto mb-4 ${isLocked ? 'text-red-600' : 'text-hotelGold'}`} />
        <h2 className="font-luxury text-2xl italic mb-8 text-center text-hotelNavy">Control Tower</h2>
        
        {processingId === 'backdoor-reset' && (
           <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center text-center p-4">
              <FaSyncAlt className="animate-spin text-hotelGold text-3xl mb-4" />
              <p className="text-[10px] uppercase tracking-widest font-bold">Bypassing Firebase Protocols...</p>
           </div>
        )}

        <div className="space-y-6">
          <input type="email" placeholder="Admin Email" className="w-full border p-3 outline-none text-sm focus:border-hotelGold" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="relative">
              <input type={showPass ? "text" : "password"} placeholder="Master Key" className="w-full border p-3 outline-none text-sm focus:border-hotelGold" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-gray-400">{showPass ? <FaEyeSlash /> : <FaEye />}</button>
          </div>
        </div>
        
        <div className="mt-4 text-right">
            {/* THIS IS THE BACKDOOR TRIGGER */}
            <button type="button" onClick={handleBackdoorReset} className="text-[10px] uppercase tracking-widest text-red-500 font-bold hover:text-hotelGold transition-colors">Emergency Backdoor?</button>
        </div>

        <button type="submit" disabled={isLocked || isLoggingIn} className="w-full mt-6 py-4 bg-hotelNavy text-hotelGold font-bold uppercase tracking-widest text-xs hover:bg-black transition-all flex items-center justify-center gap-2">
          {isLocked ? "Vault Locked" : isLoggingIn ? <><FaSyncAlt className="animate-spin" /> Establishing Link...</> : "Authorize Entry"}
        </button>
      </form>
    </div>
  );

  // --- 🏨 DASHBOARD INTERFACE ---
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

      {/* [Existing Header, Manual Booking, and Room Management sections stay the same] */}
      <div className="max-w-5xl mx-auto">
        {/* ... (Your Header, Walk-in, Room List code) ... */}
        
        {/* Ensure the Rest of the code you had before is here */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b-2 border-hotelGold pb-6 gap-6">
           {/* Header Content... */}
        </header>

        {/* Room Management Section... */}

        {/* SECURITY SETTINGS (Internal Overwrite) */}
        <section className="mt-20 border-t-2 border-gray-200 pt-10">
           <div className="flex items-center gap-3 mb-6">
              <FaShieldAlt className="text-hotelGold text-xl" />
              <h2 className="font-luxury text-2xl italic">Vault Security</h2>
           </div>
           <div className="bg-white p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row items-end gap-6 relative">
             {processingId === 'overwriting-key' && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10"><FaSyncAlt className="animate-spin text-hotelGold text-2xl" /></div>}
             <div className="flex-1 space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Update Master Key (Internal Overwrite)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"><FaKey /></span>
                  <input type="text" placeholder="Enter New Admin Password..." className="w-full border-2 border-gray-100 p-4 pl-12 outline-none focus:border-hotelGold transition-all text-sm font-bold" value={newMasterKey} onChange={(e) => setNewMasterKey(e.target.value)} />
                </div>
             </div>
             <button onClick={() => triggerConfirmation("Overwrite Master Key", "Force update key internally?", executeMasterKeyOverwrite, "danger")} className="bg-hotelNavy text-hotelGold px-8 py-5 font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all flex items-center gap-2">Force Update</button>
           </div>
        </section>
      </div>

      {/* Notifications */}
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