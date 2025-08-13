// frontend-app/src/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // <-- Ensure signOut is imported here
import { auth } from './firebaseConfig'; // Import your Firebase auth instance

// Create the Auth Context
export const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Function to get the current user's ID token
  const getIdToken = async () => {
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  };

  // Function to sign out the user
  const signOutUser = async () => {
    try {
      await signOut(auth); // Perform Firebase sign out
      // The onAuthStateChanged listener will automatically set currentUser to null
      console.log("User signed out from Firebase.");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error; // Re-throw the error to allow components to handle it
    }
  };

  // Value provided by the context
  const value = {
    currentUser,
    loading,
    getIdToken,
    signOutUser // <-- Explicitly expose the signOutUser function
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Render children only after auth state is loaded */}
    </AuthContext.Provider>
  );
};
