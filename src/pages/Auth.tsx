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
      script.setAttribute('data-telegram-login', 'NotecraftAuthBot');
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
          <div className="flex justify-center items-center w-full py-2">
            <div ref={telegramRef} className="telegram-button-wrapper"></div>
          </div>

          {/* Snapchat button removed for now */}

          {/* Discord and Snapchat buttons removed for now */}
        </div>
      </div>
    </div>
  );
};

export default Auth;
