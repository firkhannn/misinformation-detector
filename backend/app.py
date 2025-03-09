from flask import Flask, request, jsonify, session
from flask_cors import CORS
import requests
from PIL import Image
import pytesseract
import io
import os
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from werkzeug.utils import secure_filename
import base64
import jwt
from datetime import datetime, timedelta


# img = Image.open("test1.png").convert("RGB")
# img.save("test1.jpg", "JPEG")

# Load environment variables
load_dotenv()
API_USER = os.getenv("SIGHTENGINE_API_USER")
API_SECRET = os.getenv("SIGHTENGINE_API_SECRET")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MXFACE_API_KEY = os.getenv("MXFACE_API_KEY")

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
# Mock user database (replace with a real database in production)
# Mock user database
mock_users = {
    "user@example.com": "password123"
}

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if email in mock_users and mock_users[email] == password:
        session["user"] = email  # Store user in session
        return jsonify({"success": True, "message": "Login successful"})
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

# Helper function to encode image to base64
def encode_image_to_base64(image_data):
    encoded = base64.b64encode(image_data).decode('utf-8')
    print(f"Encoded Image Length: {len(encoded)}")  # Debug log
    return encoded

# Helper function to call Sightengine Deepfake API
def call_deepware_api(image_data):
    try:
        sightengine_url = "https://api.sightengine.com/1.0/check.json"
        params = {
            "api_user": API_USER,
            "api_secret": API_SECRET,
            "models": "deepfake"
        }
        files = {
            "media": ("image.jpg", image_data, "image/jpeg")
        }
        response = requests.post(sightengine_url, params=params, files=files)
        response.raise_for_status()
        result = response.json()
        print(f"Sightengine Raw Response: {result}")  # Debug log
        deepfake_score = result.get("type", {}).get("deepfake", 0.0)
        return {
            "manipulation_score": deepfake_score,
            "details": {"confidence": "high" if deepfake_score > 0.5 else "low"},
            "raw_response": result
        }
    except Exception as e:
        return {"error": f"Sightengine API failed: {str(e)}"}

# Helper function to call Google Fact-Checker API
def call_google_factcheck_api(claim):
    try:
        factcheck_url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
        params = {
            "query": claim,
            "key": GOOGLE_API_KEY
        }
        response = requests.get(factcheck_url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": f"Google Fact-Check API failed: {str(e)}"}

# Helper function to extract claim from image or URL
def extract_claim(image_data, url=None):
    try:
        image = Image.open(io.BytesIO(image_data))
        image.verify()
        image = Image.open(io.BytesIO(image_data))
        text = pytesseract.image_to_string(image).strip()

        if url:
            response = requests.get(url)
            soup = BeautifulSoup(response.text, "lxml")
            meta_description = soup.find("meta", attrs={"name": "description"})
            if meta_description and meta_description.get("content"):
                text += " " + meta_description.get("content")
            else:
                text += " " + soup.get_text(separator=" ", strip=True)

        return text if text else "No claim detected"
    except Exception as e:
        print(f"Claim Extraction Error: {str(e)}")
        return "No claim detected"

# Helper function to call MXFace.ai Face Landmark API

def call_mxface_landmark(image_data):
    url = "https://faceapi.mxface.ai/api/v3/face/landmark"
    headers = {"subscriptionkey": MXFACE_API_KEY}

    # Ensure image is in JPEG format
    img = Image.open(io.BytesIO(image_data))
    img_byte_arr = io.BytesIO()
    img.convert("RGB").save(img_byte_arr, format="JPEG")
    image_data = img_byte_arr.getvalue()
    encoded_image = base64.b64encode(image_data).decode("utf-8")

    # Try JSON with different body keys
    body_options = [
        {"image": encoded_image},
        {"data": encoded_image},
        {"file": encoded_image}
    ]
    for body in body_options:
        print(f"Trying JSON body: {body}")
        headers["Content-Type"] = "application/json"
        response = requests.post(url, headers=headers, json=body)
        if response.status_code == 200:
            result = response.json()
            landmarks = result.get("landmarks", [])
            if landmarks:
                print(f"MXFace.ai Landmarks found: {landmarks}")
                return landmarks
            print(f"No landmarks, response: {response.text}")
        else:
            print(f"JSON attempt failed: {response.status_code} - {response.text}")

    # Try binary upload
    try:
        headers["Content-Type"] = "image/jpeg"
        print("Trying binary upload with Content-Type: image/jpeg")
        response = requests.post(url, headers=headers, data=image_data)
        if response.status_code == 200:
            result = response.json()
            landmarks = result.get("landmarks", [])
            if landmarks:
                print(f"MXFace.ai Landmarks found: {landmarks}")
                return landmarks
            print(f"No landmarks, response: {response.text}")
        else:
            print(f"Binary attempt failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Binary error: {str(e)}")

    print("MXFace.ai: No landmarks detected or unable to process image after all attempts")
    return [{"x": 400, "y": 175, "anomaly_score": 0.5}]  # Fallback to center

def call_mxface_quality(image_data):
    try:
        print("Reminder: Ensure the image has an inter-eye distance of at least 32 pixels for MXFace API.")
        img = Image.open(io.BytesIO(image_data))
        img.verify()
        print("Image verified successfully")
        url_options = [
            "https://faceapi.mxface.ai/api/v3/face/Quality"
        ]
        headers = {
            "Content-Type": "application/json",
            "subscriptionkey": MXFACE_API_KEY
        }
        encoded_image = encode_image_to_base64(image_data).split(',')[-1] if ',' in encode_image_to_base64(image_data) else encode_image_to_base64(image_data)
        body_options = [
            {"encoded_image": encoded_image},
            {"image": encoded_image},
            {"encodedImage": encoded_image}
        ]

        for url in url_options:
            for body in body_options:
                print(f"Trying URL: {url}, Body: {body}")
                response = requests.post(url, headers=headers, json=body)
                try:
                    response.raise_for_status()
                    result = response.json()
                    print(f"MXFace.ai Response: {result}")
                    quality = result.get("quality", 0.0)
                    if quality > 0.0:
                        return quality
                except requests.exceptions.HTTPError as e:
                    print(f"Failed with URL {url}, Body {body}: {e}")
                    print(f"Response Text: {e.response.text}")
                    continue
        print("MXFace.ai: No face detected or quality not assessed after all attempts")
        return 0.0
    except Exception as e:
        print(f"MXFace Quality API Error: {str(e)}")
        return 0.0

# Helper function to generate heatmap data
def generate_heatmap_data(landmarks, quality_score, sightengine_response=None):
    if not landmarks:
        print("No landmarks from MXFace.ai")
        if sightengine_response and "faces" in sightengine_response:
            face = sightengine_response["faces"][0]
            if "x" in face and "y" in face:
                print(f"Using Sightengine face coordinates: x={face['x']}, y={face['y']}")
                return [{"region": "face", "x": face["x"], "y": face["y"], "anomaly_score": 0.5}]
        print("No Sightengine face data, using default face center")
        return [{"region": "mock", "x": 400, "y": 175, "anomaly_score": 0.5}]

    heatmap_data = []
    left_eye = next((lm for lm in landmarks if "left_eye" in lm.get("type", "").lower()), None)
    right_eye = next((lm for lm in landmarks if "right_eye" in lm.get("type", "").lower()), None)
    nose_tip = next((lm for lm in landmarks if "nose_tip" in lm.get("type", "").lower()), None)
    print(f"Left Eye: {left_eye}, Right Eye: {right_eye}, Nose Tip: {nose_tip}")

    if left_eye and right_eye and nose_tip and all(k in left_eye for k in ["x", "y"]):
        eye_distance = abs(left_eye["x"] - right_eye["x"])
        eye_to_nose = abs(left_eye["y"] - nose_tip["y"])
        anomaly_score = 0.0
        if eye_distance > 100 or eye_to_nose / eye_distance < 0.5:
            anomaly_score = 0.8
        if quality_score < 50:
            anomaly_score += (1 - quality_score / 100) * 0.5
        anomaly_score = min(anomaly_score, 1.0)
        heatmap_data.append({
            "region": "eyes",
            "x": (left_eye["x"] + right_eye["x"]) / 2,
            "y": (left_eye["y"] + right_eye["y"]) / 2,
            "anomaly_score": anomaly_score
        })
    else:
        print("Landmarks incomplete, using default face center")
        heatmap_data = [{"region": "mock", "x": 400, "y": 175, "anomaly_score": 0.5}]

    return heatmap_data

# Endpoint to analyze image or URL
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        if 'image' in request.files:
            image = request.files['image']
            filename = secure_filename(image.filename)
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                return jsonify({"error": "Unsupported image format"}), 400
            image_data = image.read()
        elif 'url' in request.form:
            image_url = request.form['url']
            response = requests.get(image_url)
            response.raise_for_status()
            image_data = response.content
        else:
            return jsonify({"error": "No image or URL provided"}), 400

        deepware_result = call_deepware_api(image_data)
        if "error" in deepware_result:
            print(f"Sightengine Error: {deepware_result['error']}")
            return jsonify(deepware_result), 500

        deepfake_score = deepware_result.get("manipulation_score", 0.0)

        landmarks = call_mxface_landmark(image_data)
        quality_score = call_mxface_quality(image_data)

        if not landmarks and not quality_score:
            heatmap_data = [{"region": "mock", "x": 300, "y": 300, "anomaly_score": 0.5}]
        else:
            heatmap_data = generate_heatmap_data(landmarks, quality_score, deepware_result.get("raw_response"))
        if "error" in heatmap_data:
            print(f"Heatmap Generation Error: {heatmap_data['error']}")
            return jsonify(heatmap_data), 500

        claim = extract_claim(image_data, request.form.get('url'))
        if isinstance(claim, str) and "failed" in claim.lower():
            print(f"Claim Extraction Error: {claim}")
        factcheck_result = call_google_factcheck_api(claim) if GOOGLE_API_KEY else {"note": "Google Fact Check disabled"}
        if "error" in factcheck_result:
            print(f"Google Fact Check Error: {factcheck_result['error']}")
            factcheck_result = {"note": "Fact-check data unavailable"}

        anomaly_score = max([point["anomaly_score"] for point in heatmap_data], default=0.0)
        adjusted_score = deepfake_score
        if anomaly_score > 0.7:
            adjusted_score += 0.2
        if quality_score < 30:
            adjusted_score += 0.1

        if adjusted_score >= 0.7:
            classification = "Highly Likely Fake"
            color = "red"
        elif adjusted_score >= 0.4:
            classification = "Possibly Fake"
            color = "yellow"
        else:
            classification = "Likely Real"
            color = "green"

        result = {
            "deepfake_score": deepfake_score,
            "classification": classification,
            "color": color,
            "raw_response": deepware_result,
            "landmarks": landmarks,
            "quality_score": quality_score,
            "heatmap_data": heatmap_data,
            "factcheck_data": factcheck_result
        }

        return jsonify(result), 200

    except Exception as e:
        print(f"General Error in /analyze: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)