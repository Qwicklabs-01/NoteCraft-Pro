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

          <button 
            onClick={() => handleOAuthSignIn('snapchat')}
            className="flex items-center gap-3 bg-[#FFFC00] text-black px-6 py-3 rounded-xl hover:bg-[#F2F000] hover:shadow-md transition-all font-medium w-full justify-center"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.015 1.107c-.43 0-.853.033-1.28.093-1.266.173-2.527.76-3.567 1.573-.893.687-1.633 1.587-2.073 2.627-.473 1.093-.653 2.307-.46 3.487.127.747.387 1.487.8 2.133.153.24.32.467.5.68a.382.382 0 01.073.34c-.12.447-.32.88-.58 1.253-.333.487-.76.9-1.24 1.24-.227.167-.473.307-.733.433-.6.287-1.26.42-1.92.38-.453-.02-.853-.28-1.093-.653a.853.853 0 00-1.4 0c-.24.373-.64.633-1.093.653-.333.013-.667-.067-.96-.24-.267-.16-.48-.4-.613-.68a1.21 1.21 0 00-1.253-.787c-.367.04-.707.24-.92.56-.187.293-.24.647-.147.98.087.32.307.593.6.76.627.353 1.347.533 2.067.52h.16c.86-.067 1.7-.353 2.453-.84.233-.153.447-.333.64-.533.187-.2.34-.42.46-.66.073-.14.127-.293.167-.447.013-.067.047-.12.1-.153.053-.033.12-.047.18-.033.24.053.48.107.72.147.573.093 1.153.127 1.733.093h.293c.187 0 .367.067.48.2.113.133.153.313.113.487-.087.387-.207.767-.36 1.127-.293.687-.713 1.32-1.22 1.867-.293.313-.613.6-1.02.76-.5.207-1.04.307-1.58.307-.36 0-.72-.053-1.067-.153a1.59 1.59 0 00-1.053.033c-.287.12-.52.347-.64.627-.12.28-.107.6.033.867.147.28.38.487.667.573.493.153 1.007.213 1.52.187.8-.04 1.593-.24 2.333-.587.393-.187.76-.413 1.093-.68.22-.173.42-.373.593-.6l.16-.24.16.24c.173.227.373.427.593.6.333.267.7.493 1.093.68.74.347 1.533.547 2.333.587.513.027 1.027-.033 1.52-.187.287-.087.52-.293.667-.573.14-.267.153-.587.033-.867-.12-.28-.353-.507-.64-.627a1.59 1.59 0 00-1.053-.033c-.347.1-.707.153-1.067.153-.54 0-1.08-.1-1.58-.307-.407-.16-.727-.447-1.02-.76-.507-.547-.927-1.18-1.22-1.867-.153-.36-.273-.74-.36-1.127-.04-.173 0-.353.113-.487.113-.133.293-.2.48-.2h.293c.58.034 1.16 0 1.733-.093.24-.04.48-.093.72-.147.06-.013.127 0 .18.033.053.033.087.087.1.153.04.153.093.307.167.447.12.24.273.46.46.66.193.2.407.38.64.533.753.487 1.593.773 2.453.84h.16c.72.013 1.44-.167 2.067-.52.293-.167.513-.44.6-.76.093-.333.04-.687-.147-.98-.213-.32-.553-.52-.92-.56a1.21 1.21 0 00-1.253.787c-.133.28-.347.52-.613.68-.293.173-.627.253-.96.24-.453-.02-.853-.28-1.093-.653a.853.853 0 00-1.4 0c-.24.373-.64.633-1.093.653-.66.04-1.32-.093-1.92-.38-.26-.127-.507-.267-.733-.433-.48-.34-.907-.753-1.24-1.24-.26-.373-.46-.807-.58-1.253a.382.382 0 01.073-.34c.18-.213.347-.44.5-.68.413-.647.673-1.387.8-2.133.193-1.18.013-2.393-.46-3.487-.44-1.04-1.18-1.94-2.073-2.627-1.04-.813-2.3-1.4-3.567-1.573-.427-.06-.85-.093-1.28-.093z"/></svg>
            Continue with Snapchat
          </button>

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
