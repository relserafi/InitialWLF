import type { Express } from "express";
import { createServer, type Server } from "http";
import { readFileSync } from "fs";
import { storage } from "./storage";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import sgMail from '@sendgrid/mail';
import multer from 'multer';
import nodemailer from 'nodemailer';

// Initialize SendGrid - temporarily disabled for key update
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY_NEW || process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'placeholder') {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // PayPal API routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/orders", async (req, res) => {
    // PayPal standard route for order creation
    await createPaypalOrder(req, res);
  });

  app.post("/api/orders/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // PayPal routes for new payment component
  app.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Test endpoint to get ShipStation stores
  app.get("/test/shipstation-stores", async (req, res) => {
    const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY;
    const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET;
    
    if (!SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
      return res.status(400).json({ error: "ShipStation credentials not configured" });
    }
    
    try {
      const shipstationAuth = Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`).toString('base64');
      
      const storesResponse = await fetch('https://ssapi.shipstation.com/stores', {
        headers: {
          'Authorization': `Basic ${shipstationAuth}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (storesResponse.ok) {
        const storesData = await storesResponse.json();
        res.json(storesData);
      } else {
        res.status(storesResponse.status).json({ error: `ShipStation API error: ${storesResponse.statusText}` });
      }
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch stores: ${error}` });
    }
  });

  // Credential management endpoints
  app.post("/api/update-credentials", async (req, res) => {
    try {
      const { apiKey, apiSecret } = req.body;
      
      if (!apiKey || !apiSecret) {
        return res.status(400).json({ error: "API Key and Secret are required" });
      }

      // Store credentials temporarily (in production, these would be environment variables)
      process.env.SHIPSTATION_API_KEY = apiKey;
      process.env.SHIPSTATION_API_SECRET = apiSecret;
      
      res.json({ success: true, message: "Credentials updated successfully" });
    } catch (error) {
      console.error("Error updating credentials:", error);
      res.status(500).json({ error: "Failed to update credentials" });
    }
  });

  app.get("/api/test-shipstation", async (req, res) => {
    try {
      const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY;
      const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET;

      console.log("=== DEBUG TEST SHIPSTATION ===");
      console.log("API Key:", SHIPSTATION_API_KEY);
      console.log("API Secret:", SHIPSTATION_API_SECRET);
      console.log("==============================");

      if (!SHIPSTATION_API_KEY || !SHIPSTATION_API_SECRET) {
        return res.status(400).json({ error: "ShipStation credentials not configured" });
      }

      const auth = Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`).toString('base64');
      
      const response = await fetch('https://ssapi.shipstation.com/stores', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        res.json({ success: true, stores: data });
      } else {
        res.status(response.status).json({ 
          error: `ShipStation API returned ${response.status}`,
          details: await response.text()
        });
      }
    } catch (error) {
      console.error("Error testing ShipStation:", error);
      res.status(500).json({ error: "Failed to test ShipStation connection" });
    }
  });

  // API route to handle form submission with file upload support
  app.post("/api/submit-form", upload.single('idFile'), async (req, res) => {
    try {
      let formData;
      let idFile = null;
      
      // Handle multipart form data or regular JSON
      if (req.body.formData) {
        // Multipart form submission with file
        formData = JSON.parse(req.body.formData);
        idFile = req.file;
        console.log("Received multipart form submission with file:", !!idFile);
      } else {
        // Regular JSON submission
        formData = req.body;
        console.log("Received JSON form submission");
      }
      
      console.log("Form data keys:", Object.keys(formData));
      
      // Send comprehensive email notification and create ShipStation order
      if (SENDGRID_API_KEY) {
        try {
          // Get form data from request - data may be in questionsData or directly in formData
          const questionsData = formData.questionsData || formData;
          
          // Debug: Log what data we're extracting
          console.log("🔍 Available data keys:", Object.keys(formData));
          console.log("📝 Full form data:", JSON.stringify(formData, null, 2));
          
          // Extract patient information with multiple field name patterns
          let patientName = '';
          let patientEmail = '';
          let patientPhone = '';
          let patientAddress = '';
          let patientCity = '';
          let patientProvince = '';
          let patientPostalCode = '';
          
          // Try to extract name
          const firstName = questionsData.firstName || formData.firstName || '';
          const lastName = questionsData.lastName || formData.lastName || '';
          patientName = `${firstName} ${lastName}`.trim();
          
          // Try to extract email (check multiple field patterns)
          patientEmail = questionsData.email || formData.email || questionsData.contactEmail || formData.contactEmail || '';
          
          // Try to extract phone
          patientPhone = questionsData.phone || formData.phone || questionsData.phoneNumber || formData.phoneNumber || '';
          
          // Try to extract address
          patientAddress = questionsData.address || formData.address || questionsData.street || formData.street || questionsData.address1 || formData.address1 || '';
          patientCity = questionsData.city || formData.city || '';
          patientProvince = questionsData.province || formData.province || questionsData.state || formData.state || 'ON';
          patientPostalCode = questionsData.postalCode || formData.postalCode || questionsData.zipCode || formData.zipCode || '';
          
          console.log("📋 Extracted data:");
          console.log("  Name:", patientName);
          console.log("  Email:", patientEmail);
          console.log("  Phone:", patientPhone);
          console.log("  Address:", patientAddress, patientCity, patientProvince, patientPostalCode);
          
          // Determine medication details
          const medicationMap = {
            'ozempic': { name: 'Ozempic (Semaglutide)', price: 0.01, sku: 'OZEM-001' },
            'tirzepatide': { name: 'Tirzepatide (Mounjaro)', price: 0.01, sku: 'TIRZ-001' },
            'quickstrips': { name: 'Quick Strips', price: 0.01, sku: 'QUICK-001' },
            'drops': { name: 'Drops', price: 0.01, sku: 'DROPS-001' }
          };
          
          // Get medication from preferredMedication, selectedMedication, or activeIngredient
          const selectedMed = formData.preferredMedication || formData.selectedMedication || questionsData.activeIngredient || 'ozempic';
          const medication = medicationMap[selectedMed as keyof typeof medicationMap] || { name: 'Unknown', price: formData.orderTotal, sku: 'UNK-001' };
          
          // Create ShipStation order
          const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY;
          const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET;
          
          if (SHIPSTATION_API_KEY && SHIPSTATION_API_SECRET) {
            try {
              const currentDate = new Date();
              console.log("ShipStation API Key exists:", !!SHIPSTATION_API_KEY);
              console.log("ShipStation API Secret exists:", !!SHIPSTATION_API_SECRET);
              console.log("ShipStation API Key (first 10 chars):", SHIPSTATION_API_KEY?.substring(0, 10));
              console.log("ShipStation API Secret (first 10 chars):", SHIPSTATION_API_SECRET?.substring(0, 10));
              const shipstationAuth = Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`).toString('base64');
              console.log("Auth header (first 20 chars):", shipstationAuth.substring(0, 20));
              
              // Test ShipStation connection with detailed error logging
              const testResponse = await fetch('https://ssapi.shipstation.com/stores', {
                method: 'GET',
                headers: {
                  'Authorization': `Basic ${shipstationAuth}`,
                  'Content-Type': 'application/json'
                }
              });
              
              console.log("ShipStation stores test response:", testResponse.status);
              
              if (!testResponse.ok) {
                const errorBody = await testResponse.text();
                console.log("ShipStation authentication failed - error details:", errorBody);
                console.log("Proceeding without ShipStation integration - order will complete without shipping automation");
                // Continue without ShipStation but log the issue
              } else {
                console.log("ShipStation authentication successful");
              }
              
              let shipstationWorking = false;
              if (testResponse.ok) {
                const storesData = await testResponse.json();
                console.log("Available stores:", storesData.map((s: any) => `${s.storeName} (ID: ${s.storeId})`));
                shipstationWorking = true;
              }
              
              // Use the correct City Life Pharmacy store ID
              const cityLifeStoreId = 1844081;
              console.log("Using City Life Pharmacy store ID:", cityLifeStoreId);
              
              // Only proceed with ShipStation order creation if authentication worked
              if (shipstationWorking) {
              
              const shipstationOrder = {
                orderNumber: `WL-${formData.paymentData?.id || Date.now()}`,
                orderDate: currentDate.toISOString(),
                orderStatus: "awaiting_shipment",
                customerUsername: patientEmail,
                customerEmail: patientEmail,
                
                // ✅ FIX: move storeId into advancedOptions
                advancedOptions: {
                  storeId: cityLifeStoreId
                },
                
                billTo: {
                  name: patientName,
                  company: "",
                  street1: patientAddress,
                  street2: "",
                  street3: "",
                  city: patientCity,
                  state: patientProvince,
                  postalCode: patientPostalCode,
                  country: "CA",
                  phone: patientPhone,
                  residential: true
                },
                shipTo: {
                  name: patientName,
                  company: "",
                  street1: patientAddress,
                  street2: "",
                  street3: "",
                  city: patientCity,
                  state: patientProvince,
                  postalCode: patientPostalCode,
                  country: "CA",
                  phone: patientPhone,
                  residential: true
                },
                items: [{
                  lineItemKey: "1",
                  sku: medication.sku,
                  name: medication.name,
                  imageUrl: "",
                  weight: {
                    value: 1,
                    units: "ounces"
                  },
                  quantity: 1,
                  unitPrice: medication.price,
                  taxAmount: 0,
                  shippingAmount: 0,
                  warehouseLocation: "",
                  options: [],
                  productId: null,
                  fulfillmentSku: "",
                  adjustment: false,
                  upc: ""
                }],
                orderTotal: formData.orderTotal,
                amountPaid: formData.orderTotal,
                taxAmount: 0,
                shippingAmount: 0,
                customerNotes: "",
                internalNotes: `Weight Loss Questionnaire Order - ${medication.name}`,
                gift: false,
                giftMessage: "",
                paymentMethod: "PayPal",
                paymentDate: currentDate.toISOString(),
                carrierCode: null,
                serviceCode: null,
                packageCode: null,
                confirmation: "none",
                shipDate: null,
                holdUntilDate: null
              };
              
              console.log("Making ShipStation API request...");
              console.log("URL: https://ssapi.shipstation.com/orders/createorder");
              console.log("Auth header length:", shipstationAuth.length);
              
              const shipstationResponse = await fetch('https://ssapi.shipstation.com/orders/createorder', {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${shipstationAuth}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify(shipstationOrder)
              });
              
              console.log("=== SHIPSTATION REQUEST DEBUG ===");
              console.log("Store ID being sent in advancedOptions:", (shipstationOrder.advancedOptions as any).storeId);
              console.log("Full payload:", JSON.stringify(shipstationOrder, null, 2));
              console.log("================================");
              console.log('ShipStation response status:', shipstationResponse.status);
              if (shipstationResponse.ok) {
                const successData = await shipstationResponse.json();
                console.log(`ShipStation order created successfully - Order ID: ${successData.orderId}`);
                console.log("ShipStation success response:", JSON.stringify(successData, null, 2));
              } else {
                const errorText = await shipstationResponse.text();
                console.log("ShipStation order creation failed:", shipstationResponse.status);
                console.log("ShipStation error details:", errorText);
                console.log("ShipStation order payload:", JSON.stringify(shipstationOrder, null, 2));
              }
            } else {
              console.log("Skipping ShipStation order creation - authentication failed");
            }
          } catch (shipError) {
            console.error("ShipStation integration error:", shipError);
          }
        }
          
          // Create comprehensive question mapping for pharmacy email - EVERY SINGLE QUESTION
          const questionMap: Record<string, string> = {
            // Basic Information
            fullName: 'What is your full name?',
            firstName: 'First Name',
            lastName: 'Last Name',
            dateOfBirth: 'What is your date of birth?',
            fullAddress: 'What is your full address?',
            address: 'Street Address',
            city: 'City',
            province: 'Province',
            postalCode: 'Postal Code',
            email: 'What is your email address?',
            phone: 'What is your phone number?',
            idUpload: 'Please upload a picture of your government issued ID',
            
            // Demographics
            gender: 'What gender were you assigned at birth?',
            pregnancyBreastfeeding: 'Are you currently pregnant, trying to get pregnant, or breastfeeding?',
            pregnancy: 'Are you currently pregnant, trying to get pregnant, or breastfeeding? (Male)',
            
            // Allergies
            medicationAllergies: 'Do you have any allergies to medications?',
            specifyAllergies: 'Please specify which medications you are allergic to:',
            glp1ReceptorAllergy: 'Have you ever had an adverse or allergic reaction to another GLP-1 receptor agonist such as, but without limitation to, Dulaglutide (Trulicity), Liraglutide (Victoza, Saxenda)?',
            
            // Medical Conditions - Main Question
            medicalConditions: 'Please select if you have a personal medical history involving any of the following medical conditions:',
            
            // Individual Medical Conditions
            'medicalConditions.type1DM': 'Medical History: Type 1 DM',
            'medicalConditions.type2DM': 'Medical History: Type 2 DM',
            'medicalConditions.diabeticRetinopathy': 'Medical History: Diabetic Retinopathy',
            'medicalConditions.diabeticKetoacidosis': 'Medical History: Diabetic Ketoacidosis',
            'medicalConditions.pancreatitis': 'Medical History: Pancreatitis',
            'medicalConditions.gallbladderDisease': 'Medical History: Gallbladder Disease',
            'medicalConditions.medullaryThyroidCarcinoma': 'Medical History: Medullary Thyroid Carcinoma',
            'medicalConditions.multipleEndocrineNeoplasia': 'Medical History: Multiple Endocrine Neoplasia',
            'medicalConditions.kidneyDisease': 'Medical History: Kidney disease/kidney insufficiency or transplant/Acute Kidney Injury',
            'medicalConditions.bariatricSurgery': 'Medical History: Bariatric Surgery or other GI Surgery',
            'medicalConditions.liverDisease': 'Medical History: Liver Disease/Cirrhosis',
            'medicalConditions.leberHereditary': 'Medical History: Leber Hereditary',
            'medicalConditions.opticNeuropathy': 'Medical History: Optic Neuropathy',
            'medicalConditions.none': 'Medical History: None of the above',
            
            // Mental Health & Lifestyle
            depression: 'Are you currently experiencing, or have you experienced, depression with a history of suicidal attempts, suicidal thoughts, or suicidal ideation?',
            alcoholConsumption: 'Do you currently consume alcohol?',
            menOrMtc: 'Do you have any personal or family history of Multiple Endocrine Neoplasia, Type 2, (MEN 2) or Medullary Thyroid Carcinoma (MTC)?',
            chemotherapy: 'Are you currently receiving Chemotherapy?',
            
            // Current Medications - Main Question
            medications: 'Please select if you are taking any of the following medications?',
            
            // Individual Current Medications
            'medications.abirateroneAcetate': 'Current Medications: Abiraterone acetate',
            'medications.somatrogon': 'Current Medications: Somatrogon-GHLA',
            'medications.chloroquine': 'Current Medications: Chloroquine',
            'medications.flouroquinolones': 'Current Medications: Flouroquinolones',
            'medications.hydroxychloroquine': 'Current Medications: Hydroxychloroquine',
            'medications.insulin': 'Current Medications: Insulin',
            'medications.insulinSecretagogues': 'Current Medications: Insulin secretagogues',
            'medications.none': 'Current Medications: None of the above',
            
            // Weight Loss Medications
            weightLossMedications: 'Are you currently taking any prescription medications for weight loss?',
            weightLossMedicationsList: 'Please list all weight loss medications you are currently taking:',
            otherMedications: 'Are you taking any other medications?',
            otherMedicationsList: 'Please list all other medications you are currently taking:',
            
            // Physical Measurements
            bloodPressure: 'We require that you provide a recent blood pressure measurement within the last six months. Please write that below.',
            weight: 'What is your weight?',
            height: 'What is your height?',
            bmi: 'BMI Calculation',
            bmiCategory: 'BMI Category',
            
            // Medication Selection
            medicationForm: 'Which dosage form would you prefer?',
            activeIngredient: 'Which active ingredient would you prefer?',
            sublingual_form: 'Which Sublingual Form?',
            selectedMedication: 'Selected Medication',
            preferredMedication: 'Preferred Medication'
          };

          // Generate complete questionnaire responses for pharmacy
          const generateCompleteResponses = () => {
            let responseHtml = '';
            
            // First, handle all basic questions
            Object.entries(questionsData).forEach(([key, value]) => {
              const questionText = questionMap[key];
              if (questionText && value !== undefined && value !== null && value !== '') {
                let displayValue = '';
                
                // Handle different types of responses
                if (Array.isArray(value)) {
                  displayValue = value.length > 0 ? value.join(', ') : 'None selected';
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                  // Handle nested objects like medicalConditions and medications
                  if (key === 'medicalConditions' || key === 'medications') {
                    // First show the main question
                    const mainQuestionText = questionText.replace('?', ':');
                    const selectedConditions: string[] = [];
                    
                    // Collect all selected conditions
                    Object.entries(value as Record<string, boolean>).forEach(([subKey, isChecked]) => {
                      if (isChecked) {
                        const nestedQuestionText = questionMap[`${key}.${subKey}`];
                        if (nestedQuestionText) {
                          // Remove the prefix and just get the condition name
                          const conditionName = nestedQuestionText.replace('Medical History: ', '').replace('Current Medications: ', '');
                          selectedConditions.push(conditionName);
                        }
                      }
                    });
                    
                    if (selectedConditions.length > 0) {
                      responseHtml += `<p><strong>${mainQuestionText}</strong><br>${selectedConditions.join(', ')}</p>`;
                    } else {
                      responseHtml += `<p><strong>${mainQuestionText}</strong><br>None selected</p>`;
                    }
                    return; // Skip the main question processing below
                  } else {
                    // Handle other complex objects (like address fields)
                    displayValue = JSON.stringify(value);
                  }
                } else {
                  displayValue = String(value);
                }
                
                if (displayValue && key !== 'medicalConditions' && key !== 'medications') {
                  // Replace question marks with colons in question text
                  const formattedQuestionText = questionText.replace('?', ':');
                  responseHtml += `<p><strong>${formattedQuestionText}</strong><br>${displayValue}</p>`;
                }
              }
            });
            
            // Also handle any additional calculated fields
            if (questionsData.bmi) {
              responseHtml += `<p><strong>BMI Calculation:</strong><br>${questionsData.bmi}</p>`;
            }
            if (questionsData.bmiCategory) {
              responseHtml += `<p><strong>BMI Category:</strong><br>${questionsData.bmiCategory}</p>`;
            }
            
            return responseHtml;
          };

          // Calculate BMI
          const bmiCalculation = questionsData.weight && questionsData.height ? 
            (questionsData.weight / ((questionsData.height * questionsData.height) / 703)).toFixed(1) : 
            'Not calculated';

          // Send pharmacy notification email (single email only)
          const pharmacyMsg: any = {
            to: 'info@citylifepharmacy.com',
            from: 'info@citylifepharmacy.com',
            subject: `New Weight Loss Order - ${patientName}`,
            html: `
              <h2>New Weight Loss Patient Questionnaire</h2>
              
              <h3>Patient Information Summary</h3>
              <p><strong>Name:</strong> ${patientName}</p>
              <p><strong>Email:</strong> ${patientEmail}</p>
              <p><strong>Phone:</strong> ${patientPhone || 'Not provided'}</p>
              <p><strong>Address:</strong> ${patientAddress}<br>${patientCity}, ${patientProvince} ${patientPostalCode}</p>
              <p><strong>Weight:</strong> ${questionsData.weight} lbs</p>
              <p><strong>Height:</strong> ${questionsData.height} inches</p>
              <p><strong>BMI:</strong> ${bmiCalculation}</p>
              <p><strong>Selected Medication:</strong> ${medication.name}</p>
              
              <h3>Complete Patient Questionnaire Responses</h3>
              ${generateCompleteResponses()}
              
              <h3>Order Details</h3>
              <p><strong>Order Total:</strong> $${formData.orderTotal} CAD</p>
              <p><strong>Payment ID:</strong> ${formData.paymentData?.id || 'Not provided'}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              
              ${idFile ? '<h3>Government ID Document</h3><p><strong>Government ID file uploaded by patient - see attachment for verification.</strong></p>' : ''}
              
              <p><strong>Please review all responses above and process the order accordingly.</strong></p>
            `,
            attachments: []
          };

          // Add government ID attachment if provided - using correct SendGrid format
          if (idFile && idFile.buffer) {
            // Handle multer file upload with proper SendGrid format
            try {
              const fileExtension = idFile.originalname?.split('.').pop() || 'jpg';
              const base64Content = idFile.buffer.toString('base64');
              
              // Use the exact format SendGrid expects
              pharmacyMsg.attachments = [{
                content: base64Content,
                filename: `patient_id_${patientName.replace(/\s+/g, '_')}.${fileExtension}`,
                type: idFile.mimetype || 'image/jpeg',
                disposition: 'attachment'
              }];
              
              console.log("Government ID file attached to pharmacy email:", idFile.originalname, "Size:", base64Content.length);
            } catch (error) {
              console.error("Failed to attach ID file:", error);
            }
          }
          
          // Use SendGrid for secure email delivery
          const pharmacyResult = await sgMail.send(pharmacyMsg);
          console.log("Pharmacy email sent via SendGrid:", pharmacyResult[0].statusCode);
          
          // Note about government ID file for pharmacy
          if (idFile) {
            console.log("Government ID file uploaded - pharmacy will be notified to contact patient for verification");
          }
          
          // Send patient medication instructions email
          if (patientEmail) {
            // Get medication-specific instructions
            const getMedicationInstructions = (selectedMed: string, name: string) => {
              // Use your exact app.py email templates
              if (selectedMed === 'quickstrips') {
                return {
                  title: 'Instructions for Your Weight Loss Medication',
                  instructions: `Hi ${name},

Thank you for using City Life Pharmacy, I have reviewed your medical intake and I have put together the following treatment plan for you below. Please read it carefully.

You have been prescribed compounded semaglutide oral dissolving film. 

Oraldissolving films are a novel way to take semaglutide that allows you to receive the dose effectively and safely. Oral dissolving films allow you to bypass the digestive tract which allows you to get more of the medication into your bloodstream without being broken down by your stomach acids or liver. This also would reduce the side effects of the medication.

Taking GLP-1 medication like semaglutide while taking steps toward maintaining a healthy diet and lifestyle can help you achieve your target weight.

Please note: Your prescription has been sent to the pharmacy for processing and fulfillment and should ship out within 3-4 business days.

Imagine your GLP-1 medication is like a gas pedal for your hunger. At first, you might need to press down a bit more (higher dose) to feel satisfied with less food and reach your weight loss goals. This helps you ease off the gas and eat less.

The good news is, as you keep using the medication, your body gets used to this setting (reaches steady-state). Once you've reached your goal weight or your cravings are under control at a specific dose, you don't need to keep pushing down on the gas pedal further (increasing the dose). You can keep your foot at that comfortable level (steady-state dose) to maintain your progress!

This means you can take your GLP-1 medication consistently at the same dose to keep your appetite in check and your weight loss on track. Talk to your doctor about when a steady-state dose might be the right "cruising speed" for you.

*On your next refill order date, you will be asked a series of questions with your refill order, which will help me determine if you need to be increased, or kept at the same dose*

<strong>*Please make sure to follow up with your primary care physician for routine screening including evaluation of your cholesterol levels, thyroid levels, and other routine lab testing*</strong>

<strong>How should you take semaglutide strips?</strong>
Make sure your hands are dry and clean before removing the strips. The strip should then be removed from its packaging and placed either under the tongue (sublingual) or between your gum and cheek (buccal). The strip should start dissolving almost immediately when it comes in contact with your saliva. Allow it to rest in place for 90 seconds before swallowing any remaining undissolved portion of the strip. You may drink water after this step although it is not necessary. The starting dose of the strips is 0.5 mg once daily. The dose may be increased to daily based on your response.

<strong>What is the titration schedule with semaglutide strips?</strong>
In general, the starting dose is 0.5 mg taken once daily for one month. This allows your body to get used to the medication and observe if you experienceany side effects. The dose can be increased to 1 mg once daily for another month if you are tolerating the medication well. The dose can be increased to 2 and 3 mg once daily for the third and foruth month based on your response and if you are tolerating the medication well. 

<strong>How should semaglutide strips be stored?</strong>
The medication should be stored at room temperature and in an area away from light and moisture. We recommend storing it in your bedroom or living room area as those areas are generally not exposed to fluctuations in temperature and aren't exposed to moisture.

<strong>WHO SHOULD NOT TAKE SEMAGLUTIDE?</strong>
Patients to whom the following apply are not eligible for Semaglutide Treatment:
- Eating Disorder
- Gallbladder Disease (does not include gallbladder removal/cholecystectomy)
- Drug Abuse
- Alcohol Abuse
- Recent Bariatric Surgery
- Pancreatitis
- Personal or family history of medullary Thyroid Cancer
- Multiple endocrine neoplasia type 2 syndrome (MEN-2)
- Currently Pregnant
- Currently Breastfeeding
- Planning to Become Pregnant
- Retinopathy


<strong>WHAT ARE THE COMMON SIDE EFFECTS OF SEMAGLUTIDE?</strong>
- Nausea is most common in customers beginning treatment with Semaglutide. Other common side effects are abdominal pain, headaches, fatigue, constipation, diarrhea, dizziness, upset stomach, and heartburn. Please let us know if you are experiencing any adverse symptoms and call 911 or go to the emergency room if you feel like you are experiencing a medical emergency.

Thank you and please contact us if you have any questions or concerns

Rimon
<strong>Pharmacist</strong>

City Life Pharmacy & Compounding Centre
info@CityLifePharmacy.com
www.CityLifePharmacy.com
Tel 416-214-CITY (2489)`
                };
              } else if (selectedMed === 'drops') {
                return {
                  title: 'Instructions for Your Weight Loss Medication',
                  instructions: `Hi ${name},

Thank you for using City Life Pharmacy, I have reviewed your medical intake and I have put together the following treatment plan for you below. Please read it carefully.

Taking GLP-1 medication like semaglutide while taking steps toward maintaining a healthy diet and lifestyle can help you achieve your target weight.

Please note: Your prescription has been sent to the pharmacy for processing and fulfillment and should ship out within 2-3 business days.

Imagine your GLP-1 medication is like a gas pedal for your hunger. At first, you might need to press down a bit more (higher dose) to feel satisfied with less food and reach your weight loss goals. This helps you ease off the gas and eat less. The good news is, as you keep using the medication, your body gets used to this setting (reaches steady-state). Once you've reached your goal weight or your cravings are under control at a specific dose, you don't need to keep pushing down on the gas pedal further (increasing the dose). You can keep your foot at that comfortable level (steady-state dose) to maintain your progress! This means you can take your GLP-1 medication consistently at the same dose to keep your appetite in check and your weight loss on track. Talk to your doctor about when a steady-state dose might be the right "cruising speed" for you.

<strong>*On your next refill order date, you will be asked a series of questions with your refill order, which will help me determine if you need to be increased, or kept at the same dose.*</strong>

<strong>*Please make sure to follow up with your primary care physician for routine screening including evaluation of your cholesterol levels, thyroid levels, and other routine lab testing.</strong>

<strong>WHO SHOULD NOT TAKE SEMAGLUTIDE?</strong>
Patients to whom the following apply are not eligible for Semaglutide Treatment:
- Eating Disorder
- Gallbladder Disease (does not include gallbladder removal/cholecystectomy)
- Drug Abuse
- Alcohol Abuse
- Recent Bariatric Surgery
- Pancreatitis
- Personal or family history of medullary Thyroid Cancer
- Multiple endocrine neoplasia type 2 syndrome (MEN-2)
- Currently Pregnant
- Currently Breastfeeding
- Planning to Become Pregnant
- Retinopathy

<strong>WHAT ARE THE COMMON SIDE EFFECTS OF SEMAGLUTIDE?</strong>
- Nausea is most common in customers beginning treatment with Semaglutide. Other common side effects are abdominal pain, headaches, fatigue, constipation, diarrhea, dizziness, upset stomach, and heartburn. Please let us know if you are experiencing any adverse symptoms and call 911 or go to the emergency room if you feel like you are experiencing a medical emergency.

<strong>How do you take sublingual semaglutide drops?</strong>
Draw up 1 ml using the syringe given to you and place the drops underneath the tongue once daily. Press down your tongue for at least 90 seconds to keep the liquid in place to allow for proper absorption of the medication. Do not eat or drink anything for at least half an hour after using the medication. The preferred time to use the medication is in the evening towards bed time.

<strong>What is the titration schedule of Semaglutide drops?</strong>
The general starting point for semaglutide sublingual drops is 0.5 mg once daily for 1 month. This first month is to get your body used to the medication and to see if any side effects are observed. If well tolerated, the dose can be increased to 1 mg daily for a month and then possibly 2 mg and 3 mg in the third and fourth month based on response and tolerability. Month 2-3 is when usually most people start to see meaningful changes in their weight.

<strong>How should Semaglitude drops be stored?</strong>
The medication should be stored at room temperature and in an area away from light and moisture. We recommend storing it in your bedroom or living room area as those areas are generally not exposed to fluctuations in temperature and aren't exposed to moisture.

Thank you and please reach out to us if you have any questions or concerns!

Rimon
<strong>Pharmacist</strong>

City Life Pharmacy & Compounding Centre
info@CityLifePharmacy.com
www.CityLifePharmacy.com
Tel 416-214-CITY (2489)`
                };
              } else if (selectedMed === 'tirzepatide') {
                return {
                  title: 'Instructions for Your Weight Loss Medication',
                  instructions: `Hi ${name},

Thank you for using City Life Pharmacy  I have reviewed your medical intake and I have put together the following treatment plan for you below. Please read it carefully. You have been prescribed Mounjaro (tirzepatide). This medication typically follows a titration schedule that is outlined below. At your follow up your physician will determine if you are to increase, decrease, or stay at your current dose.

<strong>Mounjaro Dosing Schedule:</strong>
Month 1: Inject 2.5mg subcutaneously once weekly x 4 weeks.
Month 2 : Inject 5mg subcutaneously once weekly x 4 weeks.
Month 3: Inject 7.5mg subcutaneously once weekly x 4 weeks
Month 4: Inject 10 mg subcutaneously once weekly x 4 weeks
Month 5: Inject 12.5mg subcutaneously once weekly x 4 weeks
Month 6: Inject 15mg subcutaneously once weekly x 4 weeks

Taking GLP-1 medication like tirzepatide while taking steps toward maintaining a healthy diet and lifestyle can help you achieve your target weight.

Please note: Your prescription has been sent to the pharmacy for processing and fulfillment and should ship out within 1-2 business days. Please store Mounjaro vialsin the fridge. You may store it at room temperature for 21 days.

Imagine your GLP-1 medication is like a gas pedal for your hunger. At first, you might need to press down a bit more (higher dose) to feel satisfied with less food and reach your weight loss goals. This helps you ease off the gas and eat less. The good news is, as you keep using the medication, your body gets used to this setting (reaches steady-state). Once you've reached your goal weight or your cravings are under control at a specific dose, you don't need to keep pushing down on the gas pedal further (increasing the dose). You can keep your foot at that comfortable level (steady-state dose) to maintain your progress!

This means you can take your GLP-1 medication consistently at the same dose to keep your appetite in check and your weight loss on track. Talk to your doctor about when a steady-state dose might be the right "cruising speed" for you.

<strong>*On your next refill order date, you will be asked a series of questions with your refill order, which will help me determine if you need to be increased, or kept at the same dose.*</strong>

<strong>*Please make sure to follow up with your primary care physician for routine screening including evaluation of your cholesterol levels, thyroid levels, and other routine lab testing.</strong>

<strong>Below is more detailed information about tirzepatide I would like you to review:</strong>

<strong>WHO SHOULD NOT TAKE Tirzepatide?</strong>
Patients to whom the following apply are not eligible for tirzepatide Treatment:
- Eating Disorder
- Gallbladder Disease (does not include gallbladder removal/cholecystectomy)
- Drug Abuse
- Alcohol Abuse
- Recent Bariatric Surgery
- Pancreatitis
- Personal or family history of medullary Thyroid Cancer
- Multiple endocrine neoplasia type 2 syndrome (MEN-2)
- Currently Pregnant
- Currently Breastfeeding
- Planning to Become Pregnant
- Retinopathy

<strong>WHAT ARE THE COMMON SIDE EFFECTS OF TIRZEPATIDE?</strong>
- Nausea is most common in customers beginning treatment with tirzepatide. Other common side effects are abdominal pain, headaches, fatigue, constipation, diarrhea, dizziness, upset stomach, and heartburn. Please let us know if you are experiencing any adverse symptoms and call 911 or go to the emergency room if you feel like you are experiencing a medical emergency. Thank you and please reach out to us if you have any questions, concerns, or need further clarification.

<strong>HOW SHOULD I TAKE MOUNJARO?</strong>
- Mounjaro is injected subcutaneously (meaning it is injected in the "fat tissue" right underneath your skin
- The preferred site of injection is around the abdomen (at least 2 inches away from the belly button) or the thigh
- Make sure to rotate sites every week ( do not inject the same spot 2 weeks in a row)
- Do not inject where the skin has pits, is thickened, or has lumps
- Do not inject where the skin is tender, bruised, scaly or hard, or into scars or damaged skin
- Each Mounjaro Pen contontains 4 doses (enough for a month)
- To prepare for your injection, remove the pen from the refrigerator
- Wash your hands with Soap and Water
- And Check the pen to make sure you have the correct medication
- Make sure the medicine is either colourless or slightly yellow
-Do not use if the pen if it is frozen, cloudy, or has particles
-We have attached detailed instructions on how to inject the medication to this email. Please follow these instructions.
- Please do not hesitate to contact us for any questions or concerns.

Rimon 
<strong>Pharmacist </strong>

City Life Pharmacy & Compounding Centre
info@CityLifePharmacy.com
www.CityLifePharmacy.com
Tel 416-214-CITY (2489)`
                };
              } else if (selectedMed === 'ozempic' || selectedMed === 'semaglutide') {
                return {
                  title: 'Instructions for Your Weight Loss Medication',
                  instructions: `Hi ${name},

Thank you for using City Life Pharmacy, I have reviewed your medical intake and I have put
together the following treatment plan for you below. Please read it carefully.
You have been prescribed Ozempic (semaglutide). This medication typically follows
a titration schedule that is outlined below. At your follow up your physician will
determine if you are to increase, decrease, or stay at your current dose.
We have attached detailed instructions on how to inject Ozempic to this email.

<strong>Please read it carefully.</strong>

<strong>Ozempic Dosing Schedule:</strong>
Month 1: Inject 0.25mg subcutaneously once weekly x 4 weeks.
Month 2: Inject 0.5mg subcutaneously once weekly x 4 weeks.
Month 3: Inject 1 mg subcutaneously once weekly for 4 weeks
*Follow up visit*
Month 4: Inject 1mg subcutaneously once weekly x 4 weeks
Wegovy Dosing Schedule:
Month 5: Inject 1.75mg subcutaneously once weekly x 4 weeks
Month 6: Inject 2mg subcutaneously once weekly x 4 weeks
*Months 5 and 6 are dispensed as Wegovy to ensure the most cost effective
semaglutide option.

Taking GLP-1 medication like semaglutide while taking steps toward maintaining a
healthy diet and lifestyle can help you achieve your target weight.

<strong>Please note: Your prescription has been sent to the pharmacy for processing and
fulfillment and should ship out within 1-2 business days. </strong>

Please <strong>store</strong> Ozempic and Wegovy pens in the fridge until you are ready to use the medication. Once the
medication is out of the fridge, it can be stored at room temperature for 56 days.
Imagine your GLP-1 medication is like a gas pedal for your hunger. At first, you
might need to press down a bit more (higher dose) to feel satisfied with less food and
reach your weight loss goals. This helps you ease off the gas and eat less.
The good news is, as you keep using the medication, your body gets used to this
setting (reaches steady-state). Once you've reached your goal weight or your
cravings are under control at a specific dose, you don't need to keep pushing down
on the gas pedal further (increasing the dose). You can keep your foot at that
comfortable level (steady-state dose) to maintain your progress!

This means you can take your GLP-1 medication consistently at the same dose to
keep your appetite in check and your weight loss on track. Talk to your doctor about
when a steady-state dose might be the right "cruising speed" for you.

<strong>*On your next refill order date, you will be asked a series of questions with your refill
order, which will help me determine if you need to be increased, or kept at the same
dose* </strong>

<strong>*Please make sure to follow up with your primary care physician for routine
screening including evaluation of your cholesterol levels, thyroid levels, and other
routine lab testing.* </strong>

Below is more detailed information about Semaglutide I would like you to review:

<strong>RISKS:</strong>
<strong>WHO SHOULD NOT TAKE SEMAGLUTIDE?</strong>
Patients to whom the following apply are not eligible for Semaglutide Treatment:
- Eating Disorder
- Gallbladder Disease (does not include gallbladder removal/cholecystectomy)
- Drug Abuse
- Alcohol Abuse
- Recent Bariatric Surgery
- Pancreatitis
- Personal or family history of medullary Thyroid Cancer
- Multiple endocrine neoplasia type 2 syndrome (MEN-2)
- Currently Pregnant
- Currently Breastfeeding
- Planning to Become Pregnant
- Retinopathy

<strong>WHAT ARE THE COMMON SIDE EFFECTS OF SEMAGLUTIDE?</strong>
- Nausea is most common in customers beginning treatment with Semaglutide.
Other common side effects are abdominal pain, headaches, fatigue, constipation,
diarrhea, dizziness, upset stomach, and heartburn. Please let us know if you are
experiencing any adverse symptoms and call 911 or go to the emergency room if
you feel like you are experiencing a medical emergency.

Thank you and please reach out to us if you have any questions, concerns, or need
further clarification.

Rimon 
<strong>Pharmacist</strong>

City Life Pharmacy & Compounding Centre
info@CityLifePharmacy.com
www.CityLifePharmacy.com
Tel 416-214-CITY (2489)`,
                  attachmentPath: './attached_assets/Ozempic Injection Instructions (1).pdf'
                };
              }
              
              else if (selectedMed === 'drops') {
                return {
                  title: 'Instructions for Your Weight Loss Medication',
                  instructions: `Hi ${name},

Thank you for using City Life Pharmacy, I have reviewed your medical intake and I have put
together the following treatment plan for you below. Please read it carefully.

Taking GLP-1 medication like semaglutide while taking steps toward maintaining a
healthy diet and lifestyle can help you achieve your target weight.

Please note: Your prescription has been sent to the pharmacy for processing and
fulfillment and should ship out within 2-3 business days.

Imagine your GLP-1 medication is like a gas pedal for your hunger. At first, you
might need to press down a bit more (higher dose) to feel satisfied with less food and
reach your weight loss goals. This helps you ease off the gas and eat less.
The good news is, as you keep using the medication, your body gets used to this
setting (reaches steady-state). Once you've reached your goal weight or your
cravings are under control at a specific dose, you don't need to keep pushing down
on the gas pedal further (increasing the dose). You can keep your foot at that
comfortable level (steady-state dose) to maintain your progress!
This means you can take your GLP-1 medication consistently at the same dose to
keep your appetite in check and your weight loss on track. Talk to your doctor about
when a steady-state dose might be the right "cruising speed" for you.

<strong>*On your next refill order date, you will be asked a series of questions with your refill
order, which will help me determine if you need to be increased, or kept at the same
dose.*</strong>

<strong>*Please make sure to follow up with your primary care physician for routine
screening including evaluation of your cholesterol levels, thyroid levels, and other
routine lab testing.</strong>

<strong>WHO SHOULD NOT TAKE SEMAGLUTIDE?</strong>
Patients to whom the following apply are not eligible for Semaglutide Treatment:
- Eating Disorder
- Gallbladder Disease (does not include gallbladder removal/cholecystectomy)
- Drug Abuse
- Alcohol Abuse
- Recent Bariatric Surgery
- Pancreatitis
- Personal or family history of medullary Thyroid Cancer
- Multiple endocrine neoplasia type 2 syndrome (MEN-2)
- Currently Pregnant
- Currently Breastfeeding
- Planning to Become Pregnant
- Retinopathy

<strong>WHAT ARE THE COMMON SIDE EFFECTS OF SEMAGLUTIDE?</strong>
- Nausea is most common in customers beginning treatment with Semaglutide.
Other common side effects are abdominal pain, headaches, fatigue, constipation,
diarrhea, dizziness, upset stomach, and heartburn. Please let us know if you are
experiencing any adverse symptoms and call 911 or go to the emergency room if
you feel like you are experiencing a medical emergency.

<strong>How do you take sublingual semaglutide drops?</strong>
Draw up 1 ml using the syringe given to you and place the drops underneath the
tongue once daily. Press down your tongue for at least 90 seconds to keep the liquid
in place to allow for proper absorption of the medication. Do not eat or drink anything
for at least half an hour after using the medication. The preferred time to use the
medication is in the evening towards bed time.

<strong>What is the titration schedule of Semaglutide drops?</strong>
The general starting point for semaglutide sublingual drops is 0.5 mg once daily for 1
month. This first month is to get your body used to the medication and to see if any
side effects are observed. If well tolerated, the dose can be increased to 1 mg daily
for a month and then possibly 2 mg and 3 mg in the third and fourth month based on
response and tolerability. Month 2-3 is when usually most people start to see
meaningful changes in their weight.

<strong>How should Semaglitude drops be stored?</strong>
The medication should be stored at room temperature and in an area away from light
and moisture. We recommend storing it in your bedroom or living room area as those
areas are generally not exposed to fluctuations in temperature and aren't exposed to
moisture.

Thank you and please reach out to us if you have any questions or concerns!

Rimon
<strong>Pharmacist</strong>

City Life Pharmacy & Compounding Centre
info@CityLifePharmacy.com
www.CityLifePharmacy.com
Tel 416-214-CITY (2489)`
                };
              }

              else if (selectedMed === 'tirzepatide') {
                return {
                  title: 'Instructions for Your Weight Loss Medication',
                  instructions: `Hi ${name},

Thank you for using City Life Pharmacy  I have reviewed your medical intake and I have put
together the following treatment plan for you below. Please read it carefully.
You have been prescribed Mounjaro (tirzepatide). This medication typically follows a
titration schedule that is outlined below. At your follow up your physician will
determine if you are to increase, decrease, or stay at your current dose.

<strong>Mounjaro Dosing Schedule:</strong>
Month 1: Inject 2.5mg subcutaneously once weekly x 4 weeks.
Month 2 : Inject 5mg subcutaneously once weekly x 4 weeks.
Month 3: Inject 7.5mg subcutaneously once weekly x 4 weeks
Month 4: Inject 10 mg subcutaneously once weekly x 4 weeks
Month 5: Inject 12.5mg subcutaneously once weekly x 4 weeks
Month 6: Inject 15mg subcutaneously once weekly x 4 weeks

Taking GLP-1 medication like tirzepatide while taking steps toward maintaining a
healthy diet and lifestyle can help you achieve your target weight.
Please note: Your prescription has been sent to the pharmacy for processing and
fulfillment and should ship out within 1-2 business days. Please store Mounjaro vials
in the fridge. You may store it at room temperature for 21 days.
Imagine your GLP-1 medication is like a gas pedal for your hunger. At first, you
might need to press down a bit more (higher dose) to feel satisfied with less food and
reach your weight loss goals. This helps you ease off the gas and eat less.
The good news is, as you keep using the medication, your body gets used to this
setting (reaches steady-state). Once you've reached your goal weight or your
cravings are under control at a specific dose, you don't need to keep pushing down
on the gas pedal further (increasing the dose). You can keep your foot at that
comfortable level (steady-state dose) to maintain your progress!

This means you can take your GLP-1 medication consistently at the same dose to
keep your appetite in check and your weight loss on track. Talk to your doctor about
when a steady-state dose might be the right "cruising speed" for you.

<strong>*On your next refill order date, you will be asked a series of questions with your refill
order, which will help me determine if you need to be increased, or kept at the same
dose.*</strong>

<strong>*Please make sure to follow up with your primary care physician for routine
screening including evaluation of your cholesterol levels, thyroid levels, and other
routine lab testing.</strong>

<strong>Below is more detailed information about tirzepatide I would like you to review:</strong>

<strong>WHO SHOULD NOT TAKE Tirzepatide?</strong>
Patients to whom the following apply are not eligible for tirzepatide Treatment:
- Eating Disorder
- Gallbladder Disease (does not include gallbladder removal/cholecystectomy)
- Drug Abuse
- Alcohol Abuse
- Recent Bariatric Surgery
- Pancreatitis
- Personal or family history of medullary Thyroid Cancer
- Multiple endocrine neoplasia type 2 syndrome (MEN-2)
- Currently Pregnant
- Currently Breastfeeding
- Planning to Become Pregnant
- Retinopathy

<strong>WHAT ARE THE COMMON SIDE EFFECTS OF TIRZEPATIDE?</strong>
- Nausea is most common in customers beginning treatment with tirzepatide. Other
common side effects are abdominal pain, headaches, fatigue, constipation, diarrhea,
dizziness, upset stomach, and heartburn. Please let us know if you are experiencing
any adverse symptoms and call 911 or go to the emergency room if you feel like you
are experiencing a medical emergency.
Thank you and please reach out to us if you have any questions, concerns, or need
further clarification.

<strong>HOW SHOULD I TAKE MOUNJARO?</strong>
- Mounjaro is injected subcutaneously (meaning it is injected in the "fat tissue" right
underneath your skin
- The preferred site of injection is around the abdomen (at least 2 inches away from
the belly button) or the thigh
- Make sure to rotate sites every week ( do not inject the same spot 2 weeks in a
row)
- Do not inject where the skin has pits, is thickened, or has lumps
- Do not inject where the skin is tender, bruised, scaly or hard, or into scars or damaged skin
- Each Mounjaro Vial is Single use. Use a new vial and a new syringe for each
injection
- To prepare for your injection, remove the vial from the refrigerator
- Wash your hands with Soap and Water
- And Check the Vial to make sure you have the correct medication
- Make sure the medicine is either colourless or slightly yellow
-Do not use if the vial is frozen, cloudy, or has particles
-We have attached detailed instructions on how to inject the medication to this
email. Please follow these instructions.
- Please do not hesitate to contact us for any questions or concerns.

Rimon 
<strong>Pharmacist </strong>

City Life Pharmacy & Compounding Centre
info@CityLifePharmacy.com
www.CityLifePharmacy.com
Tel 416-214-CITY (2489)`,
                  attachmentPath: './attached_assets/Mounjaro Penfill Instructions.pdf'
                };
              }


              
              // Fallback for other medications (no PDF attachment)
              return {
                title: 'Instructions for Your Weight Loss Medication',
                instructions: `Hi ${name},

Thank you for your order. Your medication instructions will be provided separately.

Best regards,
City Life Pharmacy Team`
              };
            };

            const medInstructions = getMedicationInstructions(selectedMed, patientName);
            
            const patientMsg: any = {
              to: patientEmail,
              from: 'info@citylifepharmacy.com',
              subject: `${medInstructions.title} - City Life Pharmacy`,
              html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${medInstructions.instructions.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>`
            };

            // Only add PDF attachment for injectable medications
            if (medInstructions.attachmentPath) {
              patientMsg.attachments = [
                {
                  filename: medInstructions.title.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf',
                  content: readFileSync(medInstructions.attachmentPath).toString('base64'),
                  type: 'application/pdf',
                  disposition: 'attachment'
                }
              ]
            };
            
            const patientResult = await sgMail.send(patientMsg);
            console.log("Patient email sent:", patientResult[0].statusCode);
          }
          
          console.log("Email notifications sent successfully");
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
        }
      }
      
      res.json({ success: true, message: "Order processed successfully" });
    } catch (error) {
      console.error("Error processing form submission:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });



  // PayPal routes for inline payment processing
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  app.post("/api/process-card-payment", async (req, res) => {
    try {
      const { amount, currency, payment_method, card_details, billing_address } = req.body;
      
      // Validate payment data
      if (!amount || !currency || !card_details) {
        return res.status(400).json({ error: "Missing required payment information" });
      }

      // For demonstration purposes, simulate successful payment processing
      // In production, this would integrate with a real payment processor
      const transactionId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentResult = {
        id: transactionId,
        status: "COMPLETED",
        amount: {
          value: amount.toString(),
          currency_code: currency
        },
        payment_method: payment_method,
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString(),
        purchase_units: [{
          payments: {
            captures: [{
              id: transactionId,
              status: "COMPLETED",
              amount: {
                currency_code: currency,
                value: amount.toString()
              }
            }]
          }
        }]
      };

      res.json(paymentResult);
    } catch (error) {
      console.error("Card payment processing error:", error);
      res.status(500).json({ error: "Payment processing failed" });
    }
  });

  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
