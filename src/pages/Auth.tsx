/* eslint-disable */
import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // The signed-in user info
      const user = result.user;
      console.log('Logged in as:', user.displayName);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-2">Welcome to NoteCraft</h2>
        <p className="text-gray-500 mb-8 text-center">Sign in to sync your notebooks across devices and connect to Google Drive.</p>
        
        {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <button 
          onClick={handleGoogleSignIn}
          className="flex items-center gap-3 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all font-medium w-full justify-center"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Auth;
