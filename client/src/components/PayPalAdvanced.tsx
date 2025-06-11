import React, { useEffect, useRef, useState } from 'react';

interface PayPalAdvancedProps {
  amount: string;
  currency: string;
  intent: string;
  onSuccess: (orderData: any) => void;
}

export default function PayPalAdvanced({ amount, currency, intent, onSuccess }: PayPalAdvancedProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPayPalSDK = () => {
      // Check if already loaded
      if ((window as any).paypal) {
        setSdkLoaded(true);
        initializePayPal();
        return;
      }

      // Check if script already exists
      if (document.querySelector('script[src*="paypal.com/sdk/js"]')) {
        const checkInterval = setInterval(() => {
          if ((window as any).paypal) {
            clearInterval(checkInterval);
            setSdkLoaded(true);
            initializePayPal();
          }
        }, 100);
        return;
      }

      // Load new script
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=BAAoBBh0W3FFZx8um0H9XwZxyKGYT3JV8DirpmxMncrbZNWDiMnhbN0ZxflaTCUiNtj4JoiikS-dtAlfco&currency=${currency}&components=buttons,card-fields`;
      script.async = true;

      script.onload = () => {
        console.log('PayPal SDK loaded successfully');
        setSdkLoaded(true);
        initializePayPal();
      };

      script.onerror = () => {
        console.error('Failed to load PayPal SDK');
        setError('Failed to load PayPal payment system');
      };

      document.head.appendChild(script);
    };

    loadPayPalSDK();
  }, [currency]);

  const renderPayPalButtons = () => {
    if (!paypalRef.current) return;
    
    const paypal = (window as any).paypal;
    console.log('Rendering PayPal buttons fallback...');
    
    paypalRef.current.innerHTML = '<div id="paypal-buttons-container"></div>';
    
    paypal.Buttons({
      createOrder: async () => {
        const response = await fetch('/paypal/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency, intent })
        });
        const order = await response.json();
        return order.id;
      },
      onApprove: async (data: any) => {
        const response = await fetch(`/paypal/order/${data.orderID}/capture`, {
          method: 'POST'
        });
        const orderData = await response.json();
        onSuccess(orderData);
      },
      onError: (err: any) => {
        console.error('PayPal button error:', err);
        setError('Payment failed. Please try again.');
      }
    }).render('#paypal-buttons-container');
  };

  const initializePayPal = async () => {
    if (!paypalRef.current || !(window as any).paypal) return;

    try {
      const paypal = (window as any).paypal;
      console.log('Initializing PayPal buttons...');
      
      // Just render PayPal buttons for now
      paypal.Buttons({
        createOrder: async () => {
          console.log('Creating PayPal order...');
          const response = await fetch('/paypal/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency, intent })
          });
          const order = await response.json();
          console.log('Order created:', order);
          return order.id;
        },
        onApprove: async (data: any) => {
          console.log('Payment approved:', data);
          const response = await fetch(`/paypal/order/${data.orderID}/capture`, {
            method: 'POST'
          });
          const orderData = await response.json();
          console.log('Payment captured:', orderData);
          onSuccess(orderData);
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          setError('Payment failed. Please try again.');
        }
      }).render(paypalRef.current);

    } catch (error) {
      console.error('Error initializing PayPal:', error);
      setError('Failed to initialize payment system');
    }
  };

  if (error) {
    return (
      <div className="text-red-600 p-4 border border-red-300 rounded-md">
        {error}
      </div>
    );
  }

  if (!sdkLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading payment system...</span>
      </div>
    );
  }

  return (
    <div className="paypal-container">
      <div ref={paypalRef} className="paypal-buttons"></div>
    </div>
  );
}