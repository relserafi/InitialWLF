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

# ✅ Email configuration (SendGrid)
app.config['MAIL_SERVER'] = 'smtp.sendgrid.net'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")  # Should be 'apikey'
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")  # Your SendGrid API key
app.config['MAIL_DEFAULT_SENDER'] = "info@citylifepharmacy.com"  # Your verified sender

# ✅ ShipStation credentials
SHIPSTATION_API_KEY = os.getenv("SHIPSTATION_API_KEY")
SHIPSTATION_API_SECRET = os.getenv("SHIPSTATION_API_SECRET")

# Initialize Mail
mail = Mail(app)

# Ensure uploads folder exists
os.makedirs("uploads", exist_ok=True)

# ✅ ShipStation order sender function
def send_to_shipstation(order_data):
    url = "https://ssapi.shipstation.com/orders/createorder"
    auth = HTTPBasicAuth(SHIPSTATION_API_KEY, SHIPSTATION_API_SECRET)

    # Inject the correct store ID if it's not already set
    if "storeId" not in order_data or not order_data["storeId"]:
        order_data["storeId"] = "7d85cae5-49cd-419c-985a-d00c871321e5"

    try:
        response = requests.post(url, json=order_data, auth=auth)
        if response.status_code == 200:
            print("📦 Order successfully sent to ShipStation.")
        else:
            print(f"❌ ShipStation error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"⚠️ Exception sending to ShipStation: {e}")

@app.route("/")
def home():
    return render_template("index.html")

# ✅ Only ONE get_email_body() defined
def get_email_body(med, name):
    if med == "quickstrips":
        return f"""Hi {name},

Thank you for using City Life Pharmacy, I have reviewed your medical intake and I have put together the following treatment plan for you below. Please read it carefully.

You have been prescribed compounded semaglutide oral dissolving film. 

Oraldissolving films are a novel way to take semaglutide that allows you to receive the dose effectively and safely. Oral dissolving films allow you to bypass the digestive tract which allows you to get more of the medication into your bloodstream without being broken down by your stomach acids or liver. This also would reduce the side effects of the medication.

Taking GLP-1 medication like semaglutide while taking steps toward maintaining a healthy diet and lifestyle can help you achieve your target weight.

Please note: Your prescription has been sent to the pharmacy for processing and fulfillment and should ship out within 3-4 business days.

Imagine your GLP-1 medication is like a gas pedal for your hunger. At first, you might need to press down a bit more (higher dose) to feel satisfied with less food and reach your weight loss goals. This helps you ease off the gas and eat less.

The good news is, as you keep using the medication, your body gets used to this setting (reaches steady-state). Once you've reached your goal weight or your cravings are under control at a specific dose, you don't need to keep pushing down on the gas pedal further (increasing the dose). You can keep your foot at that comfortable level (steady-state dose) to maintain your progress!

This means you can take your GLP-1 medication consistently at the same dose to keep your appetite in check and your weight loss on track. Talk to your doctor about when a steady-state dose might be the right "cruising speed" for you.

*On your next refill order date, you will be asked a series of questions with your refill order, which will help me determine if you need to be increased, or kept at the same dose*

<strong>*Please make sure to follow up with your primary care physician for routine screening including evaluation of your cholesterol levels, thyroid levels, and other
routine lab testing*</strong>

<strong>How should you take semaglutide strips?</strong>
Make sure your hands are dry and clean before removing the strips. The strip should then be removed from its packaging and placed either under the tongue (sublingual) or between your gum and cheek (buccal). The strip should start dissolving almost immediately when it comes in contact with your saliva. Allow it to rest in place for 90 seconds before swallowing any remaining undissolved portion of the strip. You may drink water after this step although it is not necessary. The starting dose of the strips is 0.5 mg once daily. The dose may be increased to daily based on your response.

<strong>What is the titration schedule with semaglutide strips?</strong>
In general, the starting dose is 0.5 mg taken once daily for one month. This allows your body to get used to the medication and observe if you experienceany side effects. The dose can be increased to 1 mg once daily for another month if you are tolerating the medication well. The dose can be increased to 2 and 3 mg once daily for the third and foruth month based on your response and if you are tolerating the medication well. 

<strong>How should semaglutide strips be stored?</strong>
The medication should be stored at room temperature and in an area away from light and moisture. We recommend storing it in your bedroom or living room area as those areas are generally not exposed to fluctuations in temperature and aren't exposed to
moisture.

<strong>WHO SHOULD NOT TAKE SEMAGLUTIDE?</strong>
Patients to whom the following apply are not eligible for Semaglutide Treatment:
- Eating Disorder
- Gallbladder Disease (does not include gallbladder         removal/cholecystectomy)
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
Tel 416-214-CITY (2489)"""
    
    elif med == "drops":
        return f"""Hi {name},

Thank you for using City Life Pharmacy, I have reviewed your medical intake and I have put together the following treatment plan for you below. Please read it carefully.

Taking GLP-1 medication like semaglutide while taking steps toward maintaining a healthy diet and lifestyle can help you achieve your target weight.

Please note: Your prescription has been sent to the pharmacy for processing and fulfillment and should ship out within 2-3 business days.

Imagine your GLP-1 medication is like a gas pedal for your hunger. At first, you might need to press down a bit more (higher dose) to feel satisfied with less food and
reach your weight loss goals. This helps you ease off the gas and eat less. The good news is, as you keep using the medication, your body gets used to this setting (reaches steady-state). Once you've reached your goal weight or your cravings are under control at a specific dose, you don't need to keep pushing down on the gas pedal further (increasing the dose). You can keep your foot at that comfortable level (steady-state dose) to maintain your progress! This means you can take your GLP-1 medication consistently at the same dose to keep your appetite in check and your weight loss on track. Talk to your doctor about when a steady-state dose might be the right "cruising speed" for you.

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
                    Tel 416-214-CITY (2489)"""

    elif med == "tirzepatide":
        return f"""Hi {name},

Thank you for using City Life Pharmacy  I have reviewed your medical intake and I have put together the following treatment plan for you below. Please read it carefully. You have been prescribed Mounjaro (tirzepatide). This medication typically follows a
titration schedule that is outlined below. At your follow up your physician will determine if you are to increase, decrease, or stay at your current dose.

<strong>Mounjaro Dosing Schedule:</strong>
Month 1: Inject 2.5mg subcutaneously once weekly x 4 weeks.
Month 2 : Inject 5mg subcutaneously once weekly x 4 weeks.
Month 3: Inject 7.5mg subcutaneously once weekly x 4 weeks
Month 4: Inject 10 mg subcutaneously once weekly x 4 weeks
Month 5: Inject 12.5mg subcutaneously once weekly x 4 weeks
Month 6: Inject 15mg subcutaneously once weekly x 4 weeks

Taking GLP-1 medication like tirzepatide while taking steps toward maintaining a healthy diet and lifestyle can help you achieve your target weight.

Please note: Your prescription has been sent to the pharmacy for processing and fulfillment and should ship out within 1-2 business days. Please store Mounjaro vialsin the fridge. You may store it at room temperature for 21 days.

Imagine your GLP-1 medication is like a gas pedal for your hunger. At first, you might need to press down a bit more (higher dose) to feel satisfied with less food and
reach your weight loss goals. This helps you ease off the gas and eat less. The good news is, as you keep using the medication, your body gets used to this
setting (reaches steady-state). Once you've reached your goal weight or your cravings are under control at a specific dose, you don't need to keep pushing down on the gas pedal further (increasing the dose). You can keep your foot at that comfortable level (steady-state dose) to maintain your progress!

This means you can take your GLP-1 medication consistently at the same dose to keep your appetite in check and your weight loss on track. Talk to your doctor about when a steady-state dose might be the right "cruising speed" for you.

<strong>*On your next refill order date, you will be asked a series of questions with your refill order, which will help me determine if you need to be increased, or kept at the same
dose.*</strong>

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
- Nausea is most common in customers beginning treatment with tirzepatide. Other common side effects are abdominal pain, headaches, fatigue, constipation, diarrhea, dizziness, upset stomach, and heartburn. Please let us know if you are experiencing any adverse symptoms and call 911 or go to the emergency room if you feel like you
are experiencing a medical emergency. Thank you and please reach out to us if you have any questions, concerns, or need further clarification.

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
                    Tel 416-214-CITY (2489)"""

    elif med == "ozempic":
        return f"""Hi {name},


Thank you for your order.  I have reviewed your medical intake and I have put together the following treatment plan for you below.  Please read it carefully.

You have been prescribed Ozempic (semaglutide). This medication typically follows a titration schedule that is outlined below. At your follow up your physician will determine if you are to increase, decrease, or stay at your current dose.


 We have attached detailed instructions on how to inject Ozempic to this email. Please read it carefully.  
 
 Ozempic Dosing Schedule:

        Month 1:  Inject 0.25mg subcutaneously once weekly x 4 weeks.

        Month 2: Inject 0.5mg subcutaneously once weekly x 4 weeks.

        Month 3: Inject 1 mg subcutaneously once weekly for 4 weeks 

        *Follow up visit*

        Month 4: Inject 1mg subcutaneously once weekly x 4 weeks


 Wegovy Dosing Schedule:

        Month 5: Inject 1.75mg subcutaneously once weekly x 4 weeks

        Month 6: Inject 2mg subcutaneously once weekly x 4 weeks

        *Months 5 and 6 are dispensed as Wegovy to ensure the most cost effective semaglutide option.


Taking GLP-1 medication like semaglutide while taking steps toward maintaining a healthy diet and lifestyle can help you achieve your target weight.

Please note: Your prescription has been sent to the pharmacy for processing and fulfillment and should ship out within 1-2 business days. Please store Ozempic and Wegovy pens in the fridge until you are ready to use the medication. Once the medication is out of the fridge, it can be stored at room temperature for 56 days.

Imagine your GLP-1 medication is like a gas pedal for your hunger. At first, you might need to press down a bit more (higher dose) to feel satisfied with less food and reach your weight loss goals. This helps you ease off the gas and eat less.

The good news is, as you keep using the medication, your body gets used to this setting (reaches steady-state). Once you've reached your goal weight or your cravings are under control at a specific dose, you don't need to keep pushing down on the gas pedal further (increasing the dose). You can keep your foot at that comfortable level (steady-state dose) to maintain your progress!

This means you can take your GLP-1 medication consistently at the same dose to keep your appetite in check and your weight loss on track. Talk to your doctor about when a steady-state dose might be the right "cruising speed" for you.

*On your next refill order date, you will be asked a series of questions with your refill order, which will help me determine if you need to be increased, or kept at the same dose.

 *Please make sure to follow up with your primary care physician for routine screening including evaluation of your cholesterol levels, thyroid levels, and other routine lab testing.

Below is more detailed information about Semaglutide I would like you to review:

RISKS:

WHO SHOULD NOT TAKE SEMAGLUTIDE?

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

WHAT ARE THE COMMON SIDE EFFECTS OF SEMAGLUTIDE?

Nausea is most common in customers beginning treatment with Semaglutide. Other common side effects are abdominal pain, headaches, fatigue, constipation, diarrhea, dizziness, upset stomach, and heartburn. Please let us know if you are experiencing any adverse symptoms and call 911 or go to the emergency room if you feel like you are experiencing a medical emergency.


Thank you and please reach out to us if you have any questions, concerns, or need further clarification. 


                        Rimon
                Pharmacist 





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
    
    # Helper function to add a field to the PDF
    def add_field(label, value):
        pdf.set_font("Arial", "B", 12)
        pdf.cell(60, 8, f"{label}:", 0, 0)
        pdf.set_font("Arial", size=12)
        pdf.cell(0, 8, str(value), 0, 1)
    
    # Basic Information
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Basic Information", 0, 1)
    pdf.ln(5)
    
    if 'firstName' in data:
        add_field("First Name", data['firstName'])
    if 'lastName' in data:
        add_field("Last Name", data['lastName'])
    if 'email' in data:
        add_field("Email", data['email'])
    if 'phone' in data:
        add_field("Phone", data['phone'])
    if 'dateOfBirth' in data:
        add_field("Date of Birth", data['dateOfBirth'])
    if 'gender' in data:
        add_field("Gender", data['gender'])
    
    pdf.ln(5)
    
    # Address Information
    if any(key in data for key in ['address', 'city', 'province', 'postalCode']):
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Address Information", 0, 1)
        pdf.ln(5)
        
        if 'address' in data:
            add_field("Address", data['address'])
        if 'city' in data:
            add_field("City", data['city'])
        if 'province' in data:
            add_field("Province", data['province'])
        if 'postalCode' in data:
            add_field("Postal Code", data['postalCode'])
        
        pdf.ln(5)
    
    # Physical Information
    if any(key in data for key in ['height', 'weight', 'bmi']):
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Physical Information", 0, 1)
        pdf.ln(5)
        
        if 'height' in data:
            add_field("Height", f"{data['height']} inches")
        if 'weight' in data:
            add_field("Weight", f"{data['weight']} lbs")
        if 'bmi' in data:
            add_field("BMI", f"{data['bmi']:.1f}")
        
        pdf.ln(5)
    
    # Medical Information
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Medical Information", 0, 1)
    pdf.ln(5)
    
    # Go through all the questions and answers
    medical_fields = [
        'currentMedications', 'allergies', 'medicalConditions', 'weightLossAttempts',
        'idealWeight', 'dietaryRestrictions', 'exerciseRoutine', 'smokingStatus',
        'alcoholConsumption', 'sleepPatterns', 'stressLevels', 'menstrualCycle',
        'medications', 'preferredMedication', 'treatmentGoals'
    ]
    
    for field in medical_fields:
        if field in data and data[field]:
            # Convert field name to readable format
            readable_field = field.replace('_', ' ').replace('camelCase', ' ').title()
            readable_field = readable_field.replace('Current Medications', 'Current Medications')
            readable_field = readable_field.replace('Medical Conditions', 'Medical Conditions')
            readable_field = readable_field.replace('Weight Loss Attempts', 'Previous Weight Loss Attempts')
            readable_field = readable_field.replace('Ideal Weight', 'Target Weight')
            readable_field = readable_field.replace('Dietary Restrictions', 'Dietary Restrictions')
            readable_field = readable_field.replace('Exercise Routine', 'Exercise Routine')
            readable_field = readable_field.replace('Smoking Status', 'Smoking Status')
            readable_field = readable_field.replace('Alcohol Consumption', 'Alcohol Consumption')
            readable_field = readable_field.replace('Sleep Patterns', 'Sleep Patterns')
            readable_field = readable_field.replace('Stress Levels', 'Stress Levels')
            readable_field = readable_field.replace('Menstrual Cycle', 'Menstrual Cycle')
            readable_field = readable_field.replace('Preferred Medication', 'Preferred Medication')
            readable_field = readable_field.replace('Treatment Goals', 'Treatment Goals')
            
            value = data[field]
            if isinstance(value, list):
                value = ', '.join(value)
            
            add_field(readable_field, value)
    
    # Delivery Method Section
    if 'deliveryMethod' in data:
        pdf.ln(5)
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Delivery Information", 0, 1)
        pdf.ln(5)
        add_field("Delivery Method", data['deliveryMethod'].title())
    
    # Add any other fields that weren't covered
    excluded_fields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
                      'address', 'city', 'province', 'postalCode', 'height', 'weight', 'bmi', 'deliveryMethod'] + medical_fields
    
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
            if id_file:
                print(f"📎 ID file received: {id_file.filename}")
        else:
            # Handle regular JSON data (backward compatibility)
            data = request.get_json()
            id_file = None
            print("📝 Received form data:", json.dumps(data, indent=2))

        # Generate PDF from the data
        pdf_path = generate_patient_pdf(data)
        print(f"📄 Generated PDF: {pdf_path}")
        
        # Extract necessary information with debugging
        print("🔍 Debug: Looking for customer data in received data...")
        print(f"Data keys: {list(data.keys())}")
        
        first_name = data.get('firstName', 'Patient')
        last_name = data.get('lastName', '')
        full_name = f"{first_name} {last_name}".strip()
        email = data.get('email', '')
        phone = data.get('phone', '')
        address = data.get('address', '')
        city = data.get('city', '')
        province = data.get('province', '')
        postal_code = data.get('postalCode', '')
        preferred_medication = data.get('preferredMedication', '')
        
        print(f"📋 Extracted data: name={full_name}, email={email}, phone={phone}")
        print(f"📋 Address: {address}, {city}, {province} {postal_code}")
        print(f"📋 Medication: {preferred_medication}")

        # ✅ Get the correct email body based on medication choice
        email_body = get_email_body(preferred_medication, first_name)

        # Send email to patient with treatment plan and medication PDF if applicable
        if email:
            try:
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
                print(f"✅ Treatment plan email sent to {email}")
            except Exception as e:
                print(f"❌ Failed to send treatment plan email: {e}")

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
                    content_type = "image/jpeg" if file_extension in ['jpg', 'jpeg'] else "image/png" if file_extension == 'png' else "application/octet-stream"
                    
                    pharmacy_msg.attach(
                        filename=f"patient_id_{full_name.replace(' ', '_')}.{file_extension}",
                        content_type=content_type,
                        data=id_file_data
                    )
                    print("✅ ID file attached to pharmacy email")
                except Exception as id_error:
                    print(f"⚠️ Failed to attach ID file: {id_error}")
            
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
                    "unitPrice": 150.00,
                    "warehouseLocation": "Pharmacy"
                }
            ]
        }

        # Send to ShipStation
        send_to_shipstation(shipstation_order)

        # Clean up PDF file
        try:
            os.remove(pdf_path)
            print(f"🗑️ Cleaned up temporary PDF: {pdf_path}")
        except:
            pass

        return jsonify({
            "success": True,
            "message": "Form submitted successfully. You will receive a treatment plan via email shortly."
        })

    except Exception as e:
        print(f"❌ Error processing form: {e}")
        return jsonify({
            "success": False,
            "message": "An error occurred while processing your form. Please try again."
        }), 500

@app.route("/shipstation-webhook", methods=["POST"])
def shipstation_webhook():
    """Handle ShipStation webhooks"""
    try:
        data = request.get_json()
        print("📦 ShipStation webhook received:", json.dumps(data, indent=2))
        
        # You can add webhook processing logic here
        # For example, updating order status, sending tracking emails, etc.
        
        return jsonify({"success": True})
    except Exception as e:
        print(f"❌ Error processing ShipStation webhook: {e}")
        return jsonify({"success": False}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)