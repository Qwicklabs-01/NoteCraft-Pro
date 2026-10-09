import React, { useState, useEffect, useRef } from 'react';
import { account } from '../appwriteClient';
import { OAuthProvider } from 'appwrite';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const telegramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject the Telegram Login Widget dynamically
    if (telegramRef.current && !telegramRef.current.hasChildNodes()) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'NoteCraftAuthBot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-auth-url', window.location.origin + '/api/telegram');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      telegramRef.current.appendChild(script);
    }
  }, []);

  const handleOAuthSignIn = (providerName: string) => {
    try {
      // Cast the string to OAuthProvider enum
      const provider = providerName as OAuthProvider;
      
      account.createOAuth2Session(
        provider,
        window.location.origin, // success url
        window.location.origin  // failure url
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-2">Welcome to NoteCraft</h2>
        <p className="text-gray-500 mb-8 text-center">Sign in to sync your notebooks across devices.</p>
        
        {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={() => handleOAuthSignIn('google')}
            className="flex items-center gap-3 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all font-medium w-full justify-center"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          {/* Telegram Login Widget Container */}
          <div 
            ref={telegramRef}
            className="flex justify-center items-center w-full h-[50px] bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors [&>iframe]:!w-full [&>iframe]:!max-w-[240px]"
          ></div>

          {/* Snapchat button removed for now */}

          <button 
            onClick={() => handleOAuthSignIn('discord')}
            className="flex items-center gap-3 bg-[#5865F2] text-white px-6 py-3 rounded-xl hover:bg-[#4752C4] hover:shadow-md transition-all font-medium w-full justify-center"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>
            Continue with Discord
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
