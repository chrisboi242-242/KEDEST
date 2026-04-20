import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase'; 
import { onAuthStateChanged } from 'firebase/auth';

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to the Firebase Bouncer
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Professional Loading State
  if (loading) {
    return (
      <div className="h-screen bg-hotelNavy flex flex-col items-center justify-center">
        <div className="animate-spin text-hotelGold text-5xl mb-4 italic font-luxury">K</div>
        <p className="text-hotelGold text-[10px] uppercase tracking-[0.5em] animate-pulse">Verifying Identity...</p>
      </div>
    );
  }

  /**
   * THE RUTHLESS FIX:
   * You were redirecting to "/admin", but that route doesn't exist in App.jsx.
   * We must redirect to the EXACT URL where your Login form lives.
   */
  if (!user) {
    return <Navigate to="/kedest-admin-portal-2026" replace />; 
  }

  // Access Granted
  return children;
};

export default ProtectedRoute;