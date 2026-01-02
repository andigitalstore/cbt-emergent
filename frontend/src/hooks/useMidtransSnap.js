import { useEffect, useCallback } from 'react';

export const useMidtransSnap = () => {
  const clientKey = process.env.REACT_APP_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-eeByRpNfqADwDGRW';

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [clientKey]);

  const openSnapPayment = useCallback((snapToken, onSuccess, onError) => {
    if (window.snap) {
      window.snap.pay(snapToken, {
        onSuccess: () => onSuccess(),
        onPending: () => console.log('Payment pending'),
        onError: () => onError(),
        onClose: () => console.log('Payment popup closed')
      });
    } else {
      console.error('Snap not loaded');
      onError();
    }
  }, []);

  return { openSnapPayment };
};