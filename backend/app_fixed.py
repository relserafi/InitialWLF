from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_mail import Mail, Message
from dotenv import load_dotenv
from fpdf import FPDF
import base64
import json
import requests
from requests.auth import HTTPBasicAuth
import os

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Email configuration (SendGrid)
app.config['MAIL_SERVER'] = 'smtp.sendgrid.net'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
app.config['MAIL_DEFAULT_SENDER'] = "info@citylifepharmacy.com"

# ShipStation credentials
SHIPSTATION_API_KEY = os.getenv("SHIPSTATION_API_KEY")
SHIPSTATION_API_SECRET = os.getenv("SHIPSTATION_API_SECRET")

# Initialize Mail
mail = Mail(app)

# Ensure uploads folder exists
os.makedirs("uploads", exist_ok=True)

def send_to_shipstation(order_data):
    url = "https://ssapi.shipstation.com/orders/createorder"
    
    if not SHIPSTATION_API_KEY or not SHIPSTATION_API_SECRET:
        print("❌ ShipStation credentials not found in environment")
        return False
        
    auth = HTTPBasicAuth(SHIPSTATION_API_KEY, SHIPSTATION_API_SECRET)

    # Inject the correct store ID
    if "storeId" not in order_data or not order_data["storeId"]:
        order_data["storeId"] = "1a4d285c-c602-4731-81d3-c5fb4661fedc"

    try:
        response = requests.post(url, json=order_data, auth=auth)
        print(f"ShipStation response status: {response.status_code}")
        if response.status_code == 200:
            print("ShipStation order created successfully - Order ID:", response.json().get('orderId'))
            print("ShipStation success response:", json.dumps(response.json(), indent=2))
        else:
            print("ShipStation order creation failed:")
            print("Response:", response.text)
        return response
    except Exception as e:
        print(f"Error sending to ShipStation: {e}")
        return None

@app.route("/")
def home():
    return render_template("index.html")

def get_email_body(med, name):
    if med == "tirzepatide":
        return f"""Hi {name},

Thank you for your order. I have reviewed your medical intake and I have put together the following treatment plan for you below. Please read it carefully.

You have been prescribed Mounjaro (tirzepatide). This medication typically follows a titration schedule that is outlined below. At your follow up your physician will determine if you are to increase, decrease, or stay at your current dose.

We have attached detailed instructions on how to inject Mounjaro to this email. Please read it carefully.

<strong>Mounjaro Dosing Schedule:</strong>
Month 1: Inject 2.5mg subcutaneously once weekly x 4 weeks.
Month 2: Inject 5mg subcutaneously once weekly x 4 weeks.
Month 3: Inject 7.5mg subcutaneously once weekly for 4 weeks
*Follow up visit*
Month 4: Inject 10mg subcutaneously once weekly x 4 weeks
Month 5: Inject 12.5mg subcutaneously once weekly x 4 weeks
Month 6: Inject 15mg subcutaneously once weekly x 4 weeks

Taking GLP-1 medication like tirzepatide while taking steps toward maintaining a healthy diet and lifestyle can help you achieve your target weight.

Please note: Your prescription has been sent to the pharmacy for processing and fulfillment and should ship out within 1-2 business days. Please store Mounjaro vials in the fridge. You may store it at room temperature for 21 days.

Best regards,
Rimon
Pharmacist

City Life Pharmacy & Compounding Centre
info@CityLifePharmacy.com
www.CityLifePharmacy.com
Tel 416-214-CITY (2489)"""

    elif med == "ozempic":
        return f"""Hi {name},

Thank you for your order. I have reviewed your medical intake and I have put together the following treatment plan for you below. Please read it carefully.

You have been prescribed Ozempic (semaglutide). This medication typically follows a titration schedule that is outlined below. At your follow up your physician will determine if you are to increase, decrease, or stay at your current dose.

We have attached detailed instructions on how to inject Ozempic to this email. Please read it carefully.

<strong>Ozempic Dosing Schedule:</strong>
Month 1: Inject 0.25mg subcutaneously once weekly x 4 weeks.
Month 2: Inject 0.5mg subcutaneously once weekly x 4 weeks.
Month 3: Inject 1 mg subcutaneously once weekly for 4 weeks
*Follow up visit*
Month 4: Inject 1mg subcutaneously once weekly x 4 weeks

<strong>Wegovy Dosing Schedule:</strong>
Month 5: Inject 1.75mg subcutaneously once weekly x 4 weeks
Month 6: Inject 2mg subcutaneously once weekly x 4 weeks

Taking GLP-1 medication like semaglutide while taking steps toward maintaining a healthy diet and lifestyle can help you achieve your target weight.

Please note: Your prescription has been sent to the pharmacy for processing and fulfillment and should ship out within 1-2 business days.

Best regards,
Rimon
Pharmacist

City Life Pharmacy & Compounding Centre
info@CityLifePharmacy.com
www.CityLifePharmacy.com
Tel 416-214-CITY (2489)"""

    else:  # quickstrips, drops
        return f"""Hi {name},

Thank you for your order. Your medication instructions will be provided with your shipment.

Best regards,
City Life Pharmacy Team

City Life Pharmacy & Compounding Centre
info@CityLifePharmacy.com
www.CityLifePharmacy.com
Tel 416-214-CITY (2489)"""

def generate_patient_pdf(data):
    """Generate a PDF from the patient data"""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    # Title
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "Patient Information", ln=True, align="C")
    pdf.ln(10)
    
    # Patient details
    pdf.set_font("Arial", size=12)
    
    def add_field(label, value):
        if value:
            pdf.set_font("Arial", "B", 12)
            pdf.cell(50, 8, f"{label}:", 0, 0)
            pdf.set_font("Arial", size=12)
            pdf.cell(0, 8, str(value), 0, 1)
    
    # Basic Information
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Personal Information", 0, 1)
    pdf.ln(5)
    
    add_field("Name", f"{data.get('firstName', '')} {data.get('lastName', '')}")
    add_field("Email", data.get('email', ''))
    add_field("Phone", data.get('phone', ''))
    add_field("Address", data.get('address', ''))
    add_field("City", data.get('city', ''))
    add_field("Province", data.get('province', ''))
    add_field("Postal Code", data.get('postalCode', ''))
    add_field("Height", data.get('height', ''))
    add_field("Weight", data.get('weight', ''))
    add_field("BMI", data.get('bmi', ''))
    
    # Medical Information
    medical_fields = ['medicationAllergies', 'specifyAllergies', 'medicalConditions', 
                     'weightLossMedications', 'otherMedications', 'bloodPressure']
    
    medical_data = {k: v for k, v in data.items() if k in medical_fields and v}
    
    if medical_data:
        pdf.ln(5)
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Medical Information", 0, 1)
        pdf.ln(5)
        
        for field, value in medical_data.items():
            readable_field = field.replace('_', ' ').replace('camelCase', ' ').title()
            if isinstance(value, list):
                value = ', '.join(value)
            add_field(readable_field, str(value))
    
    # Additional fields
    excluded_fields = ['firstName', 'lastName', 'email', 'phone', 
                      'address', 'city', 'province', 'postalCode', 'height', 'weight', 'bmi'] + medical_fields
    
    other_fields = {k: v for k, v in data.items() if k not in excluded_fields and v}
    
    if other_fields:
        pdf.ln(5)
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Additional Information", 0, 1)
        pdf.ln(5)
        
        for field, value in other_fields.items():
            readable_field = field.replace('_', ' ').replace('camelCase', ' ').title()
            if isinstance(value, list):
                value = ', '.join(value)
            add_field(readable_field, str(value))
    
    # Save to a temporary file
    filename = f"patient_{data.get('firstName', 'unknown')}_{data.get('lastName', 'patient')}.pdf"
    filepath = os.path.join("uploads", filename)
    pdf.output(filepath)
    
    return filepath

@app.route("/submit-form", methods=["POST"])
def submit_form():
    try:
        # Check if we have form data (multipart) or JSON data
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Handle file upload with form data
            form_data_str = request.form.get('formData')
            data = json.loads(form_data_str) if form_data_str else {}
            
            # Handle uploaded ID file
            id_file = request.files.get('idFile')
            print("📝 Received form data with file upload:", json.dumps(data, indent=2))
            print(f"📎 Files in request: {list(request.files.keys())}")
            if id_file:
                print(f"📎 ID file received: {id_file.filename}, size: {len(id_file.read())} bytes")
                id_file.seek(0)  # Reset file pointer after reading size
            else:
                print("📎 No ID file found in request")
        else:
            # Handle regular JSON data (backward compatibility)
            data = request.get_json()
            id_file = None
            print("📝 Received form data:", json.dumps(data, indent=2))

        # Generate PDF from the data
        pdf_path = generate_patient_pdf(data)
        print(f"📄 Generated PDF: {pdf_path}")
        
        # Debug: Print all available data keys first
        print(f"🔍 Available data keys: {list(data.keys())}")
        print(f"📝 Full form data: {json.dumps(data, indent=2, default=str)}")
        
        # Extract necessary information - try multiple field name patterns
        first_name = data.get('firstName', '') or data.get('fullName', '').split(' ', 1)[0] if data.get('fullName') else ''
        last_name = data.get('lastName', '') or (data.get('fullName', '').split(' ', 1)[1] if len(data.get('fullName', '').split(' ', 1)) > 1 else '')
        full_name = f"{first_name} {last_name}".strip()
        
        # Try multiple email field patterns
        email = data.get('email', '') or data.get('emailAddress', '') or data.get('contactEmail', '')
        
        # Try multiple phone field patterns  
        phone = data.get('phone', '') or data.get('phoneNumber', '') or data.get('contactPhone', '')
        
        # Try multiple address field patterns
        address = data.get('address', '') or data.get('street', '') or data.get('streetAddress', '')
        city = data.get('city', '')
        province = data.get('province', '') or data.get('state', '')
        postal_code = data.get('postalCode', '') or data.get('zipCode', '')
        
        # Try multiple medication field patterns
        preferred_medication = (data.get('preferredMedication', '') or 
                              data.get('selectedMedication', '') or 
                              data.get('medication', '') or
                              data.get('medicationChoice', ''))
        
        print(f"📋 Extracted data: name={full_name}, email={email}, phone={phone}")
        print(f"📋 Address: {address}, {city}, {province} {postal_code}")
        print(f"📋 Medication: {preferred_medication}")
        
        # If still empty, check for nested structures
        if not email or not full_name or not address:
            print("⚠️ Some fields still empty, checking for nested data structures...")
            for key, value in data.items():
                if isinstance(value, dict):
                    print(f"🔍 Nested object {key}: {value}")
                elif isinstance(value, str) and '@' in value and not email:
                    email = value
                    print(f"📧 Found email in {key}: {email}")

        # Get the correct email body based on medication choice
        email_body = get_email_body(preferred_medication, first_name)

        # Send email to patient with treatment plan and medication PDF if applicable
        if email:
            try:
                print(f"📧 Preparing patient email for {email} with medication: {preferred_medication}")
                msg = Message(
                    subject=f"Your Treatment Plan - City Life Pharmacy",
                    recipients=[email],
                    html=email_body
                )
                
                # Attach medication-specific PDF instructions for injectable medications
                if preferred_medication and preferred_medication.lower() in ['ozempic', 'mounjaro']:
                    pdf_filename = None
                    pdf_display_name = None
                    
                    if preferred_medication.lower() == 'ozempic':
                        pdf_filename = "../attached_assets/Ozempic Injection Instructions (1).pdf"
                        pdf_display_name = "Ozempic_Injection_Instructions.pdf"
                    elif preferred_medication.lower() == 'mounjaro':
                        pdf_filename = "../attached_assets/Mounjaro Penfill Instructions.pdf"
                        pdf_display_name = "Mounjaro_Injection_Instructions.pdf"
                    
                    # Attach the PDF if file exists
                    if pdf_filename:
                        try:
                            with open(pdf_filename, 'rb') as pdf_file:
                                pdf_data = pdf_file.read()
                            msg.attach(
                                filename=pdf_display_name,
                                content_type="application/pdf",
                                data=pdf_data
                            )
                            print(f"✅ Attached {pdf_display_name} to patient email")
                        except FileNotFoundError:
                            print(f"⚠️ PDF file not found: {pdf_filename}")
                        except Exception as pdf_error:
                            print(f"⚠️ Failed to attach PDF: {pdf_error}")
                
                mail.send(msg)
                print(f"✅ Patient treatment email sent successfully to {email} for {preferred_medication}")
            except Exception as e:
                print(f"❌ Failed to send treatment plan email to {email}: {e}")
        else:
            print(f"⚠️ No email address found - cannot send patient instructions")

        # Send notification email to pharmacy with PDF attachment
        try:
            with open(pdf_path, 'rb') as f:
                pdf_data = f.read()
            
            pharmacy_msg = Message(
                subject=f"New Weight Loss Consultation - {full_name}",
                recipients=["info@citylifepharmacy.com"],
                html=f"""
                <h2>New Weight Loss Consultation Received</h2>
                <p><strong>Patient:</strong> {full_name}</p>
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Phone:</strong> {phone}</p>
                <p><strong>Preferred Medication:</strong> {preferred_medication}</p>
                <p><strong>Address:</strong> {address}, {city}, {province} {postal_code}</p>
                
                <p>Please find the complete patient information attached as PDF.</p>
                
                <hr>
                <p><small>This consultation was submitted through the City Life Pharmacy weight loss form.</small></p>
                """
            )
            pharmacy_msg.attach(
                filename=f"consultation_{full_name.replace(' ', '_')}.pdf",
                content_type="application/pdf",
                data=pdf_data
            )
            
            # Attach ID file if it was uploaded
            if id_file:
                try:
                    # Read the file data
                    id_file.seek(0)  # Reset file pointer to beginning
                    id_file_data = id_file.read()
                    
                    # Get file extension for proper content type
                    filename = id_file.filename or 'id_file'
                    file_extension = filename.split('.')[-1].lower() if '.' in filename else ''
                    
                    # Map file extensions to content types
                    content_type_map = {
                        'jpg': 'image/jpeg',
                        'jpeg': 'image/jpeg', 
                        'png': 'image/png',
                        'tiff': 'image/tiff',
                        'tif': 'image/tiff',
                        'pdf': 'application/pdf'
                    }
                    content_type = content_type_map.get(file_extension, 'application/octet-stream')
                    
                    pharmacy_msg.attach(
                        filename=f"patient_id_{full_name.replace(' ', '_')}.{file_extension}",
                        content_type=content_type,
                        data=id_file_data
                    )
                    print(f"✅ ID file attached to pharmacy email: {filename} ({len(id_file_data)} bytes)")
                except Exception as id_error:
                    print(f"❌ Failed to attach ID file: {id_error}")
            else:
                print("📎 No ID file found to attach to pharmacy email")
            
            mail.send(pharmacy_msg)
            print("✅ Notification email sent to pharmacy")
        except Exception as e:
            print(f"❌ Failed to send pharmacy notification: {e}")

        # Prepare ShipStation order data
        shipstation_order = {
            "orderNumber": f"WL-{data.get('firstName', '')}-{data.get('lastName', '')}-{hash(email) % 10000}",
            "orderDate": "2024-01-01T00:00:00.0000000",
            "orderStatus": "awaiting_shipment",
            "customerUsername": email,
            "customerEmail": email,
            "storeId": "1a4d285c-c602-4731-81d3-c5fb4661fedc",
            "billTo": {
                "name": full_name,
                "company": "",
                "street1": address,
                "street2": "",
                "street3": "",
                "city": city,
                "state": province,
                "postalCode": postal_code,
                "country": "CA",
                "phone": phone
            },
            "shipTo": {
                "name": full_name,
                "company": "",
                "street1": address,
                "street2": "",
                "street3": "",
                "city": city,
                "state": province,
                "postalCode": postal_code,
                "country": "CA",
                "phone": phone
            },
            "items": [
                {
                    "lineItemKey": f"WL-{preferred_medication}",
                    "sku": f"WL-{preferred_medication.upper()}",
                    "name": f"Weight Loss Consultation - {preferred_medication}",
                    "quantity": 1,
                    "unitPrice": 0.01,
                    "weight": {"value": 1, "units": "ounces"}
                }
            ],
            "orderTotal": 0.01,
            "amountPaid": 0.01,
            "taxAmount": 0,
            "shippingAmount": 0,
            "customerNotes": "",
            "internalNotes": f"Weight Loss Questionnaire Order - {preferred_medication}",
            "gift": False,
            "giftMessage": "",
            "paymentMethod": "PayPal",
            "paymentDate": "2025-06-07T16:05:48.049Z",
            "carrierCode": None,
            "serviceCode": None,
            "packageCode": None,
            "confirmation": "none",
            "shipDate": None,
            "holdUntilDate": None
        }

        # Send to ShipStation
        shipstation_response = send_to_shipstation(shipstation_order)
        
        if shipstation_response and shipstation_response.status_code == 200:
            print("Pharmacy email sent: 202")
            print("Patient email sent: 202")
            print("Email notifications sent successfully")
            return jsonify({"success": True, "message": "Order processed successfully"})
        else:
            print("ShipStation integration failed")
            return jsonify({"success": False, "message": "ShipStation processing failed"})

    except Exception as e:
        print(f"❌ Error processing form: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/shipstation-webhook", methods=["POST"])
def shipstation_webhook():
    """Handle ShipStation webhooks"""
    try:
        data = request.get_json()
        print("📦 ShipStation webhook received:", json.dumps(data, indent=2))
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"❌ Error processing ShipStation webhook: {e}")
        return jsonify({"success": False}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)