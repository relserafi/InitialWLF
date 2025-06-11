import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Truck, Mail, Phone, Check } from 'lucide-react';

export default function SuccessMessage() {
  return (
    <Card className="bg-white rounded-xl elevated-shadow border border-green-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
        <div className="flex items-center">
          <CheckCircle className="text-white text-2xl mr-3 w-8 h-8" />
          <div>
            <h2 className="text-xl font-semibold text-white">Assessment Complete!</h2>
            <p className="text-green-100 text-sm mt-1">Your consultation has been successfully submitted</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-green-600 text-2xl w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-healthcare-800 mb-2">What's Next?</h3>
          <p className="text-healthcare-600">Our licensed healthcare providers will review your assessment within 24-48 hours.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-medical-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock className="text-medical-600 mr-2 w-5 h-5" />
              <h4 className="font-medium text-healthcare-800">Review Timeline</h4>
            </div>
            <p className="text-sm text-healthcare-600">24-48 hours for medical review and approval</p>
          </div>
          <div className="bg-medical-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Truck className="text-medical-600 mr-2 w-5 h-5" />
              <h4 className="font-medium text-healthcare-800">Delivery</h4>
            </div>
            <p className="text-sm text-healthcare-600">3-5 business days after approval</p>
          </div>
        </div>

        <div className="bg-healthcare-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-healthcare-800 mb-2">You'll receive:</h4>
          <ul className="text-sm text-healthcare-600 space-y-1">
            <li className="flex items-center">
              <Check className="text-green-500 mr-2 w-4 h-4" />
              Email confirmation of your assessment
            </li>
            <li className="flex items-center">
              <Check className="text-green-500 mr-2 w-4 h-4" />
              Medical review notification
            </li>
            <li className="flex items-center">
              <Check className="text-green-500 mr-2 w-4 h-4" />
              Shipping tracking information
            </li>
            <li className="flex items-center">
              <Check className="text-green-500 mr-2 w-4 h-4" />
              Follow-up care instructions
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1 bg-medical-600 text-white py-3 rounded-lg hover:bg-medical-700 transition-colors duration-200 font-medium">
            <Mail className="mr-2 w-4 h-4" />
            Check Email for Updates
          </Button>
          <Button variant="outline" className="flex-1 border border-medical-600 text-medical-600 py-3 rounded-lg hover:bg-medical-50 transition-colors duration-200 font-medium">
            <Phone className="mr-2 w-4 h-4" />
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
