import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface PaymentSectionProps {
  selectedMedication?: string;
  onSuccess: (orderData: any) => void;
  onBack?: () => void;
  answers?: Record<string, any>;
}

export default function PaymentSection({
  selectedMedication,
  onSuccess,
  onBack,
  answers,
}: PaymentSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const medications = {
    drops: {
      name: "Semaglutide Drops",
      price: 100,
      code: "drops",
    },
    quickstrips: {
      name: "Semaglutide QuickStrips",
      price: 120,
      code: "quickstrips",
    },
    ozempic: {
      name: "Ozempic (Semaglutide)",
      price: 300,
      code: "ozempic",
    },
    semaglutide: {
      name: "Ozempic (Semaglutide)",
      price: 300,
      code: "semaglutide",
    },
    tirzepatide: { name: "Tirzepatide (Mounjaro)", price: 599, code: "tirzepatide" },
  };

  // ✅ Ensure selectedMedication is valid
  if (!selectedMedication || !(selectedMedication in medications)) {
    console.error("Invalid or missing selectedMedication:", selectedMedication);
    throw new Error("Invalid medication selection. Cannot proceed to payment.");
  }

  const medication =
    medications[selectedMedication as keyof typeof medications];
  const total = medication.price;

  const handlePaymentSuccess = async (orderData: any) => {
    setIsProcessing(true);
    try {
      const formDataToSend = {
        ...answers,
        selectedMedication,
        paymentData: orderData,
        total,
        medication: medication.name,
      };

      // Check if there's an ID upload file
      const idUpload = answers?.idUpload;
      let response;

      if (idUpload && idUpload instanceof File) {
        // Send as multipart/form-data if there's a file
        const multipartData = new FormData();
        multipartData.append('formData', JSON.stringify(formDataToSend));
        multipartData.append('idFile', idUpload);

        response = await fetch("/api/submit-form", {
          method: "POST",
          body: multipartData,
        });
      } else {
        // Send as JSON if no file
        response = await fetch("/api/submit-form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formDataToSend),
        });
      }

      if (response.ok) {
        onSuccess(orderData);
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert("Order submission failed. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Complete Your Order
        </h2>
        <p className="text-center text-gray-600">Secure payment processing</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Order Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-800">{medication.name}</span>
              <span className="font-bold text-gray-900">
                ${total.toFixed(2)} CAD
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between items-center font-bold text-lg">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">${total.toFixed(2)} CAD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        {onBack && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full max-w-sm"
            >
              ← Back to Medication Selection
            </Button>
          </div>
        )}

        {/* PayPal Payment Integration */}
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Complete your secure payment with PayPal or your credit card.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                PayPal Checkout
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Powered by</span>
                <div className="text-blue-600 font-bold text-sm">PayPal</div>
              </div>
            </div>

            <PayPalScriptProvider
              options={{
                clientId:
                  "ATBmRhZHlN9iR4ty9Z0cs2K5zVMF32recqjAFa3eLjfJF7IZqL3ATNprpS6bVpIWGR9RT00s7Ymspp6T",
                currency: "CAD",
                components: "buttons,funding-eligibility",
              }}
            >
              <PayPalButtons
                style={{
                  layout: "vertical",
                  color: "blue",
                  shape: "pill",
                  label: "pay",
                }}
                createOrder={async () => {
                  const res = await fetch("/paypal/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: total, currency: "CAD" }),
                  });
                  const data = await res.json();
                  return data.id;
                }}
                onApprove={async (data) => {
                  const res = await fetch(
                    `/paypal/order/${data.orderID}/capture`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                    },
                  );
                  const capture = await res.json();

                  if (capture.status === "COMPLETED") {
                    const transaction =
                      capture.purchase_units[0].payments.captures[0];
                    await handlePaymentSuccess({
                      id: transaction.id,
                      status: transaction.status,
                      amount: transaction.amount,
                      create_time: capture.create_time,
                      update_time: capture.update_time,
                    });
                  } else {
                    alert("Payment was not completed. Please try again.");
                  }
                }}
                onError={(err) => {
                  console.error("PayPal error:", err);
                  alert("PayPal checkout failed. Please try again.");
                }}
              />
            </PayPalScriptProvider>

            <p className="text-xs text-gray-500 text-center mt-4">
              You can pay with PayPal or enter your card details securely.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-sm text-green-800 font-medium">
              Your payment information is secured with 256-bit SSL encryption
            </span>
          </div>
        </div>

        {/* Support Contact */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Need help? Contact our support team at info@citylifepharmacy.com
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
