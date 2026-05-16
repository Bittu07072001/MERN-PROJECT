import { useEffect, useRef, useState } from 'react';

let googleScriptPromise;

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-identity]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

export default function GoogleAuthButton({ text = 'signin_with', onCredential }) {
  const buttonRef = useRef(null);
  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setError('Google login is not configured');
      return;
    }

    let mounted = true;
    loadGoogleIdentity()
      .then((google) => {
        if (!mounted || !buttonRef.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) onCredential(response.credential);
          },
        });
        buttonRef.current.innerHTML = '';
        google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          width: buttonRef.current.offsetWidth || 360,
        });
      })
      .catch(() => mounted && setError('Google login failed to load'));

    return () => {
      mounted = false;
      window.google?.accounts?.id?.cancel();
    };
  }, [clientId, onCredential, text]);

  if (error) {
    return (
      <button type="button" disabled className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-400">
        {error}
      </button>
    );
  }

  return <div ref={buttonRef} className="w-full min-h-[44px]" />;
}
