import React, { useState, useEffect, useRef } from 'react';
import { account } from '../appwriteClient';
import { OAuthProvider } from 'appwrite';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTelegramUser, triggerHaptic } from '../utils/telegram';
import { PenTool, ArrowRight, User as UserIcon, AlertTriangle, ExternalLink } from 'lucide-react';

const Auth: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [showWidget, setShowWidget] = useState(false);
  const telegramRef = useRef<HTMLDivElement>(null);
  const { user, loginAsGuest, loginWithTelegramUser, isProjectPaused } = useAuth();
  const navigate = useNavigate();

  const tgUser = getTelegramUser();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Only inject Telegram Login Widget when explicitly shown and not on localhost
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!tgUser && showWidget && !isLocal && telegramRef.current && !telegramRef.current.hasChildNodes()) {
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
  }, [tgUser, showWidget]);

  const handleOAuthSignIn = (providerName: string) => {
    if (isProjectPaused) {
      setError('Appwrite Cloud project is paused due to inactivity. Please restore it from the Appwrite console, or continue as Guest with local offline storage.');
      return;
    }
    try {
      const provider = providerName as OAuthProvider;
      account.createOAuth2Session(
        provider,
        window.location.origin,
        window.location.origin
      );
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    triggerHaptic('success');
    navigate('/');
  };

  const handleTelegramOneClick = () => {
    loginWithTelegramUser();
    triggerHaptic('success');
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 p-4">
      <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md flex flex-col items-center">
        {/* Brand Icon */}
        <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none mb-4">
          <PenTool className="text-white" size={26} />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2 text-center">
          Welcome to NoteCraft
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-xs">
          Your digital sketchbook & notebook, responsive in both Google and Telegram.
        </p>

        {isProjectPaused && (
          <div className="w-full mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs">
            <div className="font-bold flex items-center gap-1.5 mb-1.5 text-amber-800 dark:text-amber-300 text-sm">
              <AlertTriangle size={16} /> Cloud Project Paused
            </div>
            <p className="text-amber-700/95 dark:text-amber-300/90 mb-3 leading-relaxed">
              Your free-tier Appwrite project is currently paused due to 7 days of inactivity. You can use NoteCraft Pro immediately with offline local storage by clicking <strong>&quot;Try as Guest&quot;</strong> below, or resume your project in the Appwrite Console.
            </p>
            <a
              href="https://cloud.appwrite.io/console"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 underline hover:no-underline"
            >
              <span>Restore Project in Appwrite Console</span>
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        {error && (
          <div className="text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 rounded-xl mb-5 text-xs sm:text-sm w-full text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3.5 w-full">
          {/* Telegram In-App User One-Tap Login */}
          {tgUser && (
            <button
              onClick={handleTelegramOneClick}
              className="flex items-center justify-center gap-3 bg-[#24A1DE] hover:bg-[#1f8fc6] text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all active:scale-95"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.46c.536-.196 1.006.128.832.94z"/>
              </svg>
              <span>Continue as {tgUser.first_name}</span>
            </button>
          )}

          {/* Continue with Google */}
          <button
            onClick={() => handleOAuthSignIn('google')}
            className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm transition-all font-medium w-full justify-center text-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>

          {/* Open in Telegram App */}
          {!tgUser && (
            <div className="flex flex-col gap-2 w-full">
              <a
                href="https://t.me/NotecraftAuthBot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 bg-[#24A1DE] hover:bg-[#1f8fc6] text-white px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-sm active:scale-95 w-full text-center"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.46c.536-.196 1.006.128.832.94z"/>
                </svg>
                <span>Open in Telegram</span>
              </a>

              {/* Optional Web Widget toggle (for custom linked domains) */}
              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowWidget(prev => !prev)}
                  className="text-[11px] text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {showWidget ? 'Hide Telegram Web Widget' : 'Use Telegram Web Widget'}
                </button>
                {showWidget && (
                  <div className="mt-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                    {window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                        Telegram Widget does not support localhost. Please use &quot;Open in Telegram&quot; or test on production domain.
                      </p>
                    ) : (
                      <>
                        <div ref={telegramRef} className="telegram-button-wrapper my-1"></div>
                        <p className="text-[10px] text-gray-400 mt-1">Requires domain linked with @BotFather (/setdomain)</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center my-1">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-800" />
            <span className="px-3 text-xs text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-800" />
          </div>

          {/* Quick Guest / Demo Mode */}
          <button
            onClick={handleGuestLogin}
            className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
          >
            <UserIcon size={16} />
            <span>Try as Guest (Instant Access)</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
