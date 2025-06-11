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
        order_data["storeId"] = "1a4d285c-c602-4731-81d3-c5fb4661fedc"

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
    if med == "semaglutide" or med == "quickstrips":
        return f"""Hi {name},

Thank you for using City Life Pharmacy, I have reviewed your medical intake and I have put
together the following treatment plan for you below. Please read it carefully.
You have been prescribed compounded semaglutide oral dissolving film. 

Oraldissolving films are a novel way to take semaglutide that allows you to receive the
dose effectively and safely. Oral dissolving films allow you to bypass the digestive
tract which allows you to get more of the medication into your bloodstream without
being broken down by your stomach acids or liver. This also would reduce the side
effects of the medication.

Taking GLP-1 medication like semaglutide while taking steps toward maintaining a
healthy diet and lifestyle can help you achieve your target weight.
Please note: Your prescription has been sent to the pharmacy for processing and
fulfillment and should ship out within 3-4 business days.

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

*On your next refill order date, you will be asked a series of questions with your refill
order, which will help me determine if you need to be increased, or kept at the same
dose*

<strong>*Please make sure to follow up with your primary care physician for routine
screening including evaluation of your cholesterol levels, thyroid levels, and other
routine lab testing*</strong>

<strong>How should you take semaglutide strips?</strong>
Make sure your hands are dry and clean before removing the strips. The strip should
then be removed from its packaging and placed either under the tongue (sublingual)
or between your gum and cheek (buccal). The strip should start dissolving almost
immediately when it comes in contact with your saliva. Allow it to rest in place for 90
seconds before swallowing any remaining undissolved portion of the strip. You may
drink water after this step although it is not necessary. The starting dose of the strips
is to take it 3 times a week. We recommend taking it every other day such as
Monday/Wednesday/Friday. The dose may be increased to daily based on your
response.

<strong>What is the titration schedule with semaglutide strips?</strong>
In general, the starting dose is 1 mg taken three times a week for the first month.
This allows your body to get used to the medication and observe if you experience
any side effects. The dose can be increased to 2 mg three times a week if you
tolerate the medication. If more response is required and if you are tolerating the
medication well, the medication can be increased to 2 mg once daily.


<strong>How should semaglutide strips be stored?</strong>
The medication should be stored at room temperature and in an area away from light
and moisture. We recommend storing it in your bedroom or living room area as those
areas are generally not exposed to fluctuations in temperature and aren’t exposed to
moisture.

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

Thank you and please contact us if you have any questions or concerns

Rimon
<strong>Pharmacist</strong>

City Life Pharmacy & Compounding Centre
info@CityLifePharmacy.com
www.CityLifePharmacy.com
Tel 416-214-CITY (2489)"""
    
    elif med == "drops":
        return f"""Hi {name},

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
areas are generally not exposed to fluctuations in temperature and aren’t exposed to
moisture.

Thank you and please reach out to us if you have any questions or concerns!

Rimon
<strong>Pharmacist</strong>

City Life Pharmacy & Compounding Centre
info@CityLifePharmacy.com
www.CityLifePharmacy.com
Tel 416-214-CITY (2489)"""

    elif med == "tirzepatide":
        return f"""Hi {name},

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
Tel 416-214-CITY (2489)"""

    elif med == "ozempic":
        return f"""Hi {name},

Thank you for using Direct Meds, I have reviewed your medical intake and I have put
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
Tel 416-214-CITY (2489)"""
    
    else:
        return f"Hi {name},\n\nThank you for your submission to City Life Pharmacy. We’ll be in touch shortly."


@app.route("/submit-form", methods=["POST"])
def submit_form():
    data = request.json
    print("📝 Received form data")

    pharmacy_email = "info@citylifepharmacy.com"
    patient_email = data.get("email")
    patient_name = data.get("fullName", "Patient")
    medication = data.get("activeIngredient") or data.get("sublingual_form")

    # Save uploaded ID image
    image_path = None
    if "idUpload" in data:
        base64_image = data["idUpload"]
        if base64_image and base64_image.startswith("data:image"):
            try:
                header, encoded = base64_image.split(",", 1)
                image_data = base64.b64decode(encoded)
                image_path = "uploads/id_upload.png"
                with open(image_path, "wb") as f:
                    f.write(image_data)
                print("✅ Saved ID image as uploads/id_upload.png")
            except Exception as e:
                print(f"⚠️ Failed to save image: {e}")

    # Save form answers to JSON
    try:
        with open("uploads/form_data.json", "w") as f:
            json.dump(data, f, indent=2)
        print("✅ Saved form data to uploads/form_data.json")
    except Exception as e:
        print(f"⚠️ Failed to save form data: {e}")
        return jsonify({"success": False, "message": "Failed to save form data."}), 500

    # PDFs only for injectables
    pdf_attachments = {
        "ozempic": "Ozempic Injection Instructions (1).pdf",
        "tirzepatide": "Mounjaro Penfill Instructions.pdf"
    }

    # 1️⃣ Send to pharmacy
    try:
        summary = "\n".join([f"{k}: {v}" for k, v in data.items()])
        msg1 = Message("📝 New Weight Loss Submission", recipients=[pharmacy_email])
        msg1.body = f"A new patient submitted the form:\n\n{summary}"
        if image_path:
            with open(image_path, 'rb') as img:
                msg1.attach("id_upload.png", "image/png", img.read())
        mail.send(msg1)
        print("📤 Sent email to pharmacy")
    except Exception as e:
        print(f"⚠️ Failed to email pharmacy: {e}")

    # 2️⃣ Send to patient
    try:
        plain_text = get_email_body(medication, patient_name)
        html_text = f"<p>{plain_text.replace('\n\n', '<br><br>').replace('\n', '<br>')}</p>"

        msg2 = Message("✅ Instructions for Your Weight Loss Medication", recipients=[patient_email])
        msg2.body = plain_text
        msg2.html = html_text

        attachment_path = pdf_attachments.get(medication.lower())
        if attachment_path:
            with open(f"./{attachment_path}", 'rb') as f:
                msg2.attach(attachment_path, "application/pdf", f.read())

        mail.send(msg2)
        print("📤 Sent email to patient")
    except Exception as e:
        print(f"⚠️ Failed to email patient: {e}")

    return jsonify({"success": True, "message": "Form submitted and emails sent!"})

@app.route("/shipstation-webhook", methods=["POST"])
def shipstation_webhook():
    data = request.json

    print("📬 Webhook received from ShipStation")

    event_type = data.get("event")
    resource_url = data.get("resource_url")

    # Only proceed if it's a shipment notification
    if event_type == "SHIP_NOTIFY" and resource_url:
        # Fetch full shipment details from ShipStation
        auth = HTTPBasicAuth(SHIPSTATION_API_KEY, SHIPSTATION_API_SECRET)
        response = requests.get(resource_url, auth=auth)
        if response.status_code == 200:
            shipment = response.json()
            email = shipment.get("customerEmail")
            tracking = shipment.get("trackingNumber")
            carrier = shipment.get("carrierCode")
            service = shipment.get("serviceCode")

            if email and tracking:
                subject = "📦 Your City Life Pharmacy Order Has Shipped!"
                body = f"""
Hi,

Your order has been shipped via {carrier.upper()} ({service}).
Tracking Number: {tracking}

You can track it here: https://www.google.com/search?q={carrier}+tracking+{tracking}

Thank you for choosing City Life Pharmacy!
                """

                msg = Message(subject=subject, recipients=[email])
                msg.body = body
                mail.send(msg)
                print(f"✅ Sent tracking email to {email}")
            else:
                print("⚠️ Missing email or tracking number.")
        else:
            print(f"❌ Failed to fetch shipment data: {response.status_code}")
    else:
        print(f"ℹ️ Ignored event type: {event_type}")

    return jsonify({"success": True}), 200


# ✅ Only ONE app.run()
if __name__ == "__main__":
    app.run(debug=True, port=5050)
