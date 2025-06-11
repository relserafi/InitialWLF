# API Integration Documentation

This document provides detailed information about all the APIs and integrations used in this form template.

## PayPal Integration

### Setup Requirements
- PayPal Developer Account
- Client ID and Client Secret (Sandbox and Production)
- Webhook configuration for order notifications

### Environment Variables
```
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_CLIENT_ID_PRODUCTION=your_production_client_id
PAYPAL_CLIENT_SECRET_PRODUCTION=your_production_client_secret
```

### API Endpoints
- `POST /setup` - Initialize PayPal client token
- `POST /order` - Create PayPal order
- `POST /order/:orderID/capture` - Capture payment

### Payment Flow
1. User completes form validation
2. PayPal button initializes with form data
3. Order created with calculated amount
4. User approves payment
5. Order captured and confirmed
6. Success actions triggered

## SendGrid Email Service

### Setup Requirements
- SendGrid Account
- Verified sender email address
- API key with mail send permissions

### Environment Variables
```
SENDGRID_API_KEY=your_sendgrid_api_key
MAIL_USERNAME=your_verified_email@domain.com
```

### Email Templates
- Customer confirmation with PDF attachment
- Admin notification with form responses
- Payment confirmation details

### Customization Points
```python
def get_email_body(form_type, customer_name, responses):
    # Customize based on form type
    if form_type == 'medical':
        return medical_email_template(customer_name, responses)
    elif form_type == 'service':
        return service_email_template(customer_name, responses)
    # Add more form types as needed
```

## ShipStation Integration

### Setup Requirements
- ShipStation Account
- API Key and API Secret
- Store configuration

### Environment Variables
```
SHIPSTATION_API_KEY=your_api_key
SHIPSTATION_API_SECRET=your_api_secret
```

### Order Processing
- Automatic order creation on payment success
- Customer shipping information capture
- Tracking number generation and notification

### Webhook Configuration
```python
@app.route('/shipstation_webhook', methods=['POST'])
def shipstation_webhook():
    # Handle shipping status updates
    # Send tracking notifications
    # Update order status
```

## PDF Generation

### Features
- Automatic form response compilation
- Professional formatting
- Email attachment capability
- Customizable templates

### Customization
```python
def generate_custom_pdf(form_data, form_type):
    pdf = FPDF()
    pdf.add_page()
    
    # Add form-specific headers
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(200, 10, f'{form_type.title()} Form Responses', ln=True, align='C')
    
    # Add form fields dynamically
    for field, value in form_data.items():
        add_field(field, value)
    
    return pdf.output(dest='S').encode('latin-1')
```

## Form Validation System

### Client-Side Validation
- Real-time field validation
- Required field enforcement
- Custom validation rules
- Progress tracking

### Server-Side Validation
- Data sanitization
- Business logic validation
- Security checks
- Error handling

### Custom Validators
```typescript
const customValidators = {
  businessEmail: (value: string) => {
    if (!value.includes('@')) return 'Invalid email format';
    if (value.includes('personal-domains.com')) return 'Business email required';
    return null;
  },
  
  phoneNumber: (value: string) => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    return phoneRegex.test(value) ? null : 'Invalid phone format';
  }
};
```

## Database Integration (Optional)

### PostgreSQL Setup
```sql
CREATE TABLE form_submissions (
    id SERIAL PRIMARY KEY,
    form_type VARCHAR(50),
    customer_email VARCHAR(255),
    responses JSONB,
    payment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Storage Interface
```typescript
interface FormStorage {
  saveSubmission(formData: FormSubmission): Promise<void>;
  getSubmission(id: string): Promise<FormSubmission>;
  updatePaymentStatus(id: string, status: string): Promise<void>;
}
```

## Security Considerations

### API Key Protection
- Environment variable storage
- Server-side processing only
- Webhook signature verification

### Data Validation
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF tokens

### Payment Security
- PCI DSS compliance via PayPal
- No sensitive data storage
- Secure transmission
- Audit logging

## Error Handling

### Payment Errors
```typescript
const handlePaymentError = (error: any) => {
  console.error('Payment failed:', error);
  
  // Log for debugging
  logPaymentError(error);
  
  // Show user-friendly message
  showErrorMessage('Payment could not be processed. Please try again.');
  
  // Optionally retry or redirect
  if (error.code === 'PAYMENT_DECLINED') {
    redirectToPaymentOptions();
  }
};
```

### API Failures
```python
def handle_api_failure(service_name, error):
    # Log the error
    logger.error(f"{service_name} API failed: {error}")
    
    # Implement fallback logic
    if service_name == 'sendgrid':
        return send_fallback_email(error)
    elif service_name == 'shipstation':
        return queue_order_for_retry(error)
    
    # Notify administrators
    notify_admin_of_failure(service_name, error)
```

## Testing Guidelines

### Payment Testing
- Use PayPal sandbox environment
- Test various payment scenarios
- Verify webhook handling
- Check refund processing

### Email Testing
- Verify SendGrid configuration
- Test email delivery
- Check PDF attachments
- Validate formatting

### Integration Testing
```javascript
// Test complete form flow
const testFormFlow = async () => {
  // Fill form with test data
  await fillFormData(testData);
  
  // Process payment
  const paymentResult = await processPayment(testAmount);
  
  // Verify email sent
  const emailSent = await verifyEmailDelivery();
  
  // Check order creation
  const orderCreated = await verifyOrderCreation();
  
  return { paymentResult, emailSent, orderCreated };
};
```

## Performance Optimization

### Caching Strategies
- PayPal token caching
- Form state persistence
- Image optimization
- Bundle optimization

### Monitoring
- Payment success rates
- Email delivery rates
- Form completion rates
- API response times

This documentation provides the foundation for understanding and customizing all integrations in your form template.