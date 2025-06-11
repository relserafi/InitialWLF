// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import React, { useEffect, useState } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  onSuccess?: (orderData: any) => void;
  answers?: Record<string, any>;
  selectedMedication?: string;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
  onSuccess,
  answers,
  selectedMedication,
}: PayPalButtonProps) {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    addressLine1: '',
    addressLine2: '',
    country: 'Canada',
    city: '',
    postalCode: '',
    province: ''
  });
  const [isPaying, setIsPaying] = useState(false);

  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
    };
    const response = await fetch("/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    return data;
  };

  const onApprove = async (data: any) => {
    console.log("onApprove", data);
    const orderData = await captureOrder(data.orderId);
    console.log("Capture result", orderData);
    
    if (onSuccess) {
      onSuccess(orderData);
    }
  };

  const onCancel = async (data: any) => {
    console.log("onCancel", data);
  };

  const onError = async (data: any) => {
    console.log("onError", data);
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);
    
    try {
      // Process credit card payment directly through backend
      const paymentData = {
        amount: parseFloat(amount),
        currency: currency,
        payment_method: 'Credit Card',
        card_details: {
          number: cardData.cardNumber,
          expiry: cardData.expiryDate,
          cvv: cardData.cvv,
          name: cardData.cardholderName
        },
        billing_address: {
          line1: cardData.addressLine1,
          line2: cardData.addressLine2,
          city: cardData.city,
          province: cardData.province,
          postal_code: cardData.postalCode,
          country: cardData.country
        }
      };

      const response = await fetch('/api/process-card-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`Payment failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Card payment error:", error);
      alert("Payment processing failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = "https://www.paypal.com/sdk/js?client-id=ATBmRhZHlN9iR4ty9Z0cs2K5zVMF32recqjAFa3eLjfJF7IZqL3ATNprpS6bVpIWGR9RT00s7Ymspp6T&components=buttons,card-fields&currency=CAD";
          script.async = true;
          script.onload = () => {
            // Add delay to ensure React components are mounted
            setTimeout(initPayPal, 1000);
          };
          script.onerror = (e) => {
            console.error("PayPal script failed to load", e);
          };
          document.head.appendChild(script);
        } else {
          setTimeout(initPayPal, 1000);
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
      }
    };

    // Delay initial load to ensure component is mounted
    setTimeout(loadPayPalSDK, 500);
  }, []);
  
  const initPayPal = async () => {
    try {
      // Wait for DOM elements to be rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if DOM elements exist before initializing
      const paypalButtonElement = document.getElementById('paypal-button');
      const cardNameField = document.getElementById('card-name-field');
      const cardNumberField = document.getElementById('card-number-field');
      const cardExpiryField = document.getElementById('card-expiry-field');
      const cardCvvField = document.getElementById('card-cvv-field');

      if (!paypalButtonElement || !cardNameField || !cardNumberField || !cardExpiryField || !cardCvvField) {
        console.error('PayPal DOM elements not found, retrying in 500ms');
        setTimeout(initPayPal, 500);
        return;
      }

      // Initialize PayPal buttons
      await (window as any).paypal.Buttons({
        createOrder: async () => {
          const result = await createOrder();
          return result.orderId;
        },
        onApprove: async (data: any) => {
          const orderData = await captureOrder(data.orderID);
          if (onSuccess) {
            onSuccess(orderData);
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          onError(err);
        }
      }).render('#paypal-button');

      // Initialize PayPal Card Fields
      const cardFields = (window as any).paypal.CardFields({
        createOrder: async () => {
          const result = await createOrder();
          return result.orderId;
        },
        onApprove: async (data: any) => {
          const orderData = await captureOrder(data.orderID);
          if (onSuccess) {
            onSuccess(orderData);
          }
        },
        onError: (err: any) => {
          console.error('PayPal Card Fields error:', err);
          onError(err);
        }
      });

      // Check if Card Fields are eligible
      if (cardFields.isEligible()) {
        // Render individual card fields
        await cardFields.NameField().render('#card-name-field');
        await cardFields.NumberField().render('#card-number-field');
        await cardFields.ExpiryField().render('#card-expiry-field');
        await cardFields.CVVField().render('#card-cvv-field');

        // Add submit button handler
        const submitButton = document.getElementById('card-field-submit-button');
        if (submitButton) {
          submitButton.addEventListener('click', () => {
            cardFields.submit();
          });
        }
      } else {
        console.log('Card Fields not eligible');
        // Fallback to regular form submission
        const cardSubmitButton = document.getElementById("card-field-submit-button");
        if (cardSubmitButton) {
          cardSubmitButton.addEventListener("click", async (e) => {
            e.preventDefault();
            await handleCardSubmit(e as any);
          });
        }
      }

    } catch (e) {
      console.error("PayPal initialization error:", e);
    }
  };

  return (
    <div className="space-y-8">
      {/* PayPal Buttons */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-bold mb-6 text-gray-900">Pay with PayPal</h3>
        <paypal-button id="paypal-button"></paypal-button>
      </div>

      {/* Credit Card Form - Processes through PayPal */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-bold mb-6 text-gray-900">Card information</h3>
        
        <div className="space-y-6">
          {/* Name on card */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">Name on card</h4>
            <input
              type="text"
              placeholder="Full name as shown on card"
              className="w-full border border-gray-300 rounded-lg p-4 bg-gray-50 focus:border-gray-400 focus:outline-none text-gray-900"
              value={cardData.cardholderName}
              onChange={(e) => setCardData(prev => ({ ...prev, cardholderName: e.target.value }))}
              required
            />
          </div>

          {/* Card Number */}
          <div>
            <input
              type="text"
              placeholder="1234 1234 1234 1234"
              className="w-full border border-gray-300 rounded-lg p-4 bg-gray-50 focus:border-gray-400 focus:outline-none text-gray-900"
              value={cardData.cardNumber}
              onChange={(e) => setCardData(prev => ({ ...prev, cardNumber: e.target.value }))}
              required
            />
          </div>
          
          {/* Expiry and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="MM / YY"
              className="w-full border border-gray-300 rounded-lg p-4 bg-gray-50 focus:border-gray-400 focus:outline-none text-gray-900"
              value={cardData.expiryDate}
              onChange={(e) => setCardData(prev => ({ ...prev, expiryDate: e.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="CVC"
              className="w-full border border-gray-300 rounded-lg p-4 bg-gray-50 focus:border-gray-400 focus:outline-none text-gray-900"
              value={cardData.cvv}
              onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
              required
            />
          </div>

          {/* Submit button for PayPal processing */}
          <button
            id="card-field-submit-button"
            type="button"
            className={`w-full mt-4 py-3 px-6 rounded-lg font-medium text-white transition-colors border-2 ${
              isPaying 
                ? "bg-gray-400 cursor-not-allowed border-gray-400" 
                : "bg-gray-800 hover:bg-gray-900 border-gray-600 hover:border-gray-700"
            }`}
            disabled={isPaying}
          >
            {isPaying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing Payment...
              </div>
            ) : (
              `Pay $${amount} ${currency}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
// <END_EXACT_CODE>