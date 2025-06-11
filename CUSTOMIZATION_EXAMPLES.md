# Form Customization Examples

This document provides practical examples of how to adapt this template for different types of forms and business needs.

## Example 1: Service Booking Form

### Question Configuration
```typescript
const questions: Question[] = [
  {
    id: 'serviceType',
    title: 'What service are you interested in?',
    type: 'radio',
    options: [
      { value: 'consultation', label: 'Initial Consultation - $150' },
      { value: 'premium', label: 'Premium Package - $299' },
      { value: 'enterprise', label: 'Enterprise Solution - $599' }
    ],
    isRequired: true
  },
  {
    id: 'preferredDate',
    title: 'When would you like to schedule?',
    type: 'dateFields',
    isRequired: true
  }
];
```

### Pricing Updates
```typescript
const SERVICE_PRICES = {
  consultation: 150,
  premium: 299,
  enterprise: 599
};
```

## Example 2: Product Order Form

### Dynamic Pricing Example
```typescript
{
  id: 'productQuantity',
  title: 'How many units would you like?',
  type: 'radio',
  options: [
    { value: '1', label: '1 Unit - $49' },
    { value: '3', label: '3 Units - $129 (Save $18)' },
    { value: '5', label: '5 Units - $199 (Save $46)' }
  ]
}
```

## Example 3: Event Registration Form

### Multi-Step Configuration
```typescript
const eventQuestions: Question[] = [
  {
    id: 'eventType',
    title: 'Which event are you registering for?',
    type: 'radio',
    options: [
      { value: 'workshop', label: 'Weekend Workshop - $89' },
      { value: 'conference', label: 'Annual Conference - $299' },
      { value: 'vip', label: 'VIP Experience - $599' }
    ]
  },
  {
    id: 'dietaryRestrictions',
    title: 'Do you have any dietary restrictions?',
    type: 'multiCheckbox',
    checkboxOptions: [
      { id: 'vegetarian', label: 'Vegetarian' },
      { id: 'vegan', label: 'Vegan' },
      { id: 'glutenFree', label: 'Gluten-Free' },
      { id: 'none', label: 'No restrictions' }
    ]
  }
];
```

## Email Template Customization

### Service Confirmation Email
```python
def get_service_email_body(service_type, customer_name):
    if service_type == 'consultation':
        return f"""
        Dear {customer_name},
        
        Thank you for booking your Initial Consultation!
        
        Your session details:
        - Service: Initial Consultation
        - Duration: 60 minutes
        - Investment: $150
        
        You'll receive a calendar invite shortly with your consultation link.
        
        Best regards,
        Your Service Team
        """
```

### Product Order Email
```python
def get_order_email_body(product, quantity, customer_name):
    return f"""
    Dear {customer_name},
    
    Your order has been confirmed!
    
    Order Details:
    - Product: {product}
    - Quantity: {quantity}
    - Total: ${calculate_total(product, quantity)}
    
    Tracking information will be sent once your order ships.
    
    Thank you for your business!
    """
```

## Question Type Examples

### File Upload Question
```typescript
{
  id: 'supportingDocuments',
  title: 'Please upload any supporting documents',
  description: 'Accepted formats: PDF, DOC, JPG (Max 5MB)',
  type: 'fileUpload',
  isRequired: false
}
```

### Address Collection
```typescript
{
  id: 'businessAddress',
  title: 'What is your business address?',
  type: 'addressFields',
  isRequired: true
}
```

### Multi-Selection with Conditional Logic
```typescript
{
  id: 'addOnServices',
  title: 'Select additional services',
  type: 'multiCheckbox',
  checkboxOptions: [
    { id: 'rush', label: 'Rush Delivery (+$25)' },
    { id: 'insurance', label: 'Insurance Coverage (+$15)' },
    { id: 'setup', label: 'Professional Setup (+$99)' }
  ],
  showIf: (answers) => answers.serviceType === 'premium'
}
```

## Conditional Pricing Logic

### Dynamic Price Calculation
```typescript
const calculateTotalPrice = (answers: Record<string, any>) => {
  let basePrice = SERVICE_PRICES[answers.serviceType] || 0;
  
  // Add rush delivery
  if (answers.addOnServices?.includes('rush')) {
    basePrice += 25;
  }
  
  // Volume discount
  if (answers.quantity >= 5) {
    basePrice *= 0.9; // 10% discount
  }
  
  return basePrice;
};
```

## Validation Examples

### Custom Email Validation
```typescript
{
  id: 'businessEmail',
  title: 'Business email address',
  type: 'email',
  isRequired: true,
  validation: (value) => {
    if (!value.includes('@')) return 'Please enter a valid email';
    if (value.includes('gmail.com')) return 'Please use your business email';
    return null;
  }
}
```

### Phone Number Formatting
```typescript
{
  id: 'businessPhone',
  title: 'Business phone number',
  type: 'phone',
  placeholder: '(555) 123-4567',
  format: 'US'
}
```

## Integration Customization

### Different Payment Amounts
```typescript
// In PaymentSection component
const getPaymentAmount = (selectedService: string, addOns: string[]) => {
  let amount = SERVICE_PRICES[selectedService] || 0;
  
  addOns.forEach(addon => {
    if (addon === 'rush') amount += 25;
    if (addon === 'insurance') amount += 15;
    if (addon === 'setup') amount += 99;
  });
  
  return amount.toString();
};
```

### Custom Success Actions
```typescript
const handlePaymentSuccess = async (orderData: any) => {
  // Send confirmation email
  await sendConfirmationEmail(orderData);
  
  // Create calendar event
  if (answers.serviceType === 'consultation') {
    await createCalendarEvent(answers);
  }
  
  // Update CRM
  await updateCRM(answers, orderData);
  
  // Redirect to success page
  navigate('/success');
};
```

## Quick Start Templates

Choose the template that best matches your needs and modify the questions array accordingly:

1. **Service Booking** - Consultations, appointments, professional services
2. **Product Sales** - Physical products, digital downloads, subscriptions
3. **Event Registration** - Workshops, conferences, webinars
4. **Application Forms** - Job applications, program enrollment
5. **Survey with Payment** - Premium surveys, research participation

Each template maintains the same robust infrastructure while adapting the questions and pricing to your specific business model.