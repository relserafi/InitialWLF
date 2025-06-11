# Form Template Guide

This project serves as a comprehensive template for creating professional forms with payment processing, validation, and email integration.

## Core Features Included

### 🔧 Technical Infrastructure
- **React + TypeScript** - Modern frontend with type safety
- **Tailwind CSS** - Responsive design system
- **PayPal Integration** - Production-ready payment processing
- **SendGrid Email** - Professional email delivery
- **ShipStation Integration** - Order fulfillment system
- **PDF Generation** - Automatic document creation
- **Form Validation** - Comprehensive input validation
- **Progress Tracking** - Visual progress indicators

### 💳 Payment System
- Multiple payment options (PayPal, Credit Cards)
- Dynamic pricing based on selections
- Secure transaction processing
- Order confirmation and tracking

### 📧 Email System
- Automated confirmation emails
- Professional PDF attachments
- Customer and admin notifications
- Customizable email templates

### 🎨 UI/UX Features
- Responsive mobile-first design
- Progress bars and navigation
- Image integration
- Professional landing pages
- Success/error state handling

## How to Use This Template

### 1. Clone Project Setup
```bash
# Create new Replit project
# Import this project as template
# Update project name and description
```

### 2. Customize Questions (Primary Changes)
Edit `client/src/components/WeightLossQuestionnaire.tsx`:
- Update the `questions` array with your form fields
- Modify validation rules and required fields
- Adjust conditional logic and question flow

### 3. Update Pricing Logic
Modify pricing constants and logic:
- Update `MEDICATION_PRICES` object with your pricing
- Adjust payment processing logic
- Update product descriptions and images

### 4. Customize Email Templates
Edit `backend/app.py`:
- Update `get_email_body()` function
- Modify PDF generation logic
- Adjust recipient settings

### 5. Update Branding
- Replace images in `attached_assets/`
- Update company name and branding
- Modify color scheme in CSS files
- Update page titles and descriptions

## Environment Variables Needed
```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
SENDGRID_API_KEY=your_sendgrid_key
SHIPSTATION_API_KEY=your_shipstation_key
SHIPSTATION_API_SECRET=your_shipstation_secret
MAIL_USERNAME=your_email@domain.com
MAIL_PASSWORD=your_email_password
```

## File Structure Overview

### Core Form Logic
- `client/src/components/WeightLossQuestionnaire.tsx` - Main form component
- `client/src/components/PaymentSection.tsx` - Payment processing
- `client/src/components/PayPalButton.tsx` - PayPal integration

### Backend Processing
- `backend/app.py` - Form submission and email handling
- `server/paypal.ts` - PayPal server-side logic
- `server/routes.ts` - API endpoints

### Styling & UI
- `client/src/components/ui/` - Reusable UI components
- `tailwind.config.js` - Design system configuration
- CSS files for custom styling

## Quick Customization Checklist

### Essential Changes
- [ ] Update questions array with your form fields
- [ ] Modify pricing structure and products
- [ ] Replace product images and branding
- [ ] Update email templates and recipients
- [ ] Test payment processing with your PayPal account

### Optional Enhancements
- [ ] Add new question types if needed
- [ ] Customize validation rules
- [ ] Modify success/error pages
- [ ] Add additional integrations
- [ ] Enhance mobile responsiveness

## Testing Your New Form
1. Test all question flows and validation
2. Verify payment processing with small amounts
3. Check email delivery and PDF generation
4. Test mobile responsiveness
5. Validate all integrations work properly

## Support Files
- `TEMPLATE_GUIDE.md` - This guide
- `CUSTOMIZATION_EXAMPLES.md` - Example modifications
- `API_DOCUMENTATION.md` - Integration details

This template provides a solid foundation for any professional form that requires payment processing, validation, and automated follow-up communications.