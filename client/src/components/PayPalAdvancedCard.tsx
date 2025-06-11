// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import React, { useEffect, useRef, useState } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-card-fields-component": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "paypal-card-number-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "paypal-card-expiry-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "paypal-card-cvv-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "paypal-card-name-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalAdvancedCardProps {
  amount: string;
  currency: string;
  intent: string;
  onSuccess: (orderData: any) => void;
  onError?: (error: any) => void;
}

export default function PayPalAdvancedCard({
  amount,
  currency,
  intent,
  onSuccess,
  onError,
}: PayPalAdvancedCardProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cardFieldsRef = useRef<any>(null);
  const payButtonRef = useRef<HTMLButtonElement>(null);

  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
    };
    
    const response = await fetch("/api/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    
    const output = await response.json();
    return output.id;
  };

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`/api/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return data;
  };

  const handlePayment = async () => {
    if (!cardFieldsRef.current || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const orderId = await createOrder();
      
      const { isFormValid } = await cardFieldsRef.current.getState();
      
      if (!isFormValid) {
        alert("Please fill in all required card fields correctly.");
        setIsProcessing(false);
        return;
      }

      const cardFieldsValue = await cardFieldsRef.current.submit({
        contingencies: ["SCA_WHEN_REQUIRED"],
      });

      if (cardFieldsValue.liabilityShift === "POSSIBLE") {
        const orderData = await captureOrder(orderId);
        onSuccess(orderData);
      } else {
        const orderData = await captureOrder(orderId);
        onSuccess(orderData);
      }
    } catch (error) {
      console.error("Payment error:", error);
      if (onError) {
        onError(error);
      } else {
        alert("Payment failed. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          // Remove any existing PayPal scripts first
          const existingScripts = document.querySelectorAll('script[src*="paypal.com"]');
          existingScripts.forEach(script => script.remove());
          
          const script = document.createElement("script");
          script.src = "https://www.paypal.com/sdk/js?client-id=BAAoBBh0W3FFZx8um0H9XwZxyKGYT3JV8DirpmxMncrbZNWDiMnhbN0ZxflaTCUiNtj4JoiikS-dtAlfco&components=card-fields&currency=CAD";
          script.async = true;
          script.onload = () => {
            console.log("PayPal SDK loaded successfully");
            initPayPal();
          };
          script.onerror = (error) => {
            console.error("PayPal SDK failed to load:", error);
          };
          document.head.appendChild(script);
        } else {
          await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
      }
    };

    loadPayPalSDK();
  }, []);

  const initPayPal = async () => {
    try {
      console.log("Fetching PayPal client token...");
      const setupResponse = await fetch("/api/paypal/setup");
      
      if (!setupResponse.ok) {
        throw new Error(`Setup failed: ${setupResponse.status}`);
      }
      
      const setupData = await setupResponse.json();
      console.log("Setup response received:", setupData);
      
      if (!setupData.clientToken) {
        throw new Error("No client token received from server");
      }

      console.log("Creating PayPal SDK instance...");
      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken: setupData.clientToken,
        components: ["card-fields"],
      });
      
      console.log("PayPal SDK instance created successfully");

      const cardFields = sdkInstance.CardFields({
        createOrder: createOrder,
        onApprove: async (data: any) => {
          const orderData = await captureOrder(data.orderID);
          onSuccess(orderData);
        },
        onError: (err: any) => {
          console.error("PayPal card fields error:", err);
          if (onError) {
            onError(err);
          }
        },
        style: {
          input: {
            "font-size": "16px",
            "font-family": "Arial, sans-serif",
            "border-radius": "4px",
            border: "1px solid #ccc",
            padding: "12px",
          },
          ".invalid": {
            color: "red",
          },
          ".valid": {
            color: "green",
          },
        },
      });

      cardFieldsRef.current = cardFields;

      // Wait for DOM elements to be ready
      const waitForElements = () => {
        const cardNumber = document.getElementById("card-number");
        const cardExpiry = document.getElementById("card-expiry");
        const cardCvv = document.getElementById("card-cvv");
        const cardName = document.getElementById("card-name");

        if (cardNumber && cardExpiry && cardCvv && cardName) {
          cardFields.NumberField().render("#card-number");
          cardFields.ExpiryField().render("#card-expiry");
          cardFields.CVVField().render("#card-cvv");
          cardFields.NameField().render("#card-name");
          setIsSDKLoaded(true);
        } else {
          setTimeout(waitForElements, 100);
        }
      };

      waitForElements();
    } catch (e) {
      console.error("PayPal initialization error:", e);
    }
  };

  return (
    <div className="paypal-advanced-card">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Number
          </label>
          <div
            id="card-number"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ minHeight: "44px" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <div
              id="card-expiry"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ minHeight: "44px" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVV
            </label>
            <div
              id="card-cvv"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ minHeight: "44px" }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cardholder Name
          </label>
          <div
            id="card-name"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{ minHeight: "44px" }}
          />
        </div>

        <button
          ref={payButtonRef}
          onClick={handlePayment}
          disabled={!isSDKLoaded || isProcessing}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            !isSDKLoaded || isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isProcessing
            ? "Processing Payment..."
            : !isSDKLoaded
            ? "Loading Payment Form..."
            : `Pay $${amount} ${currency}`}
        </button>
      </div>
    </div>
  );
}
// <END_EXACT_CODE>