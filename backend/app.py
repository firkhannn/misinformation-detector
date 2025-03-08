from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from PIL import Image
import pytesseract
import io
import os
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from werkzeug.utils import secure_filename

# Load environment variables
load_dotenv()
API_USER = os.getenv("SIGHTENGINE_API_USER")  # Replace with your API user
API_SECRET = os.getenv("SIGHTENGINE_API_SECRET")  # Replace with your API secret
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

app = Flask(__name__)
CORS(app)

# Helper function to call Sightengine Deepfake API
def call_deepware_api(image_data):
    try:
        sightengine_url = "https://api.sightengine.com/1.0/check.json"
        params = {
            "api_user": API_USER,
            "api_secret": API_SECRET,
            "models": "deepfake"  # Specify deepfake detection model
        }
        files = {
            "media": ("image.jpg", image_data, "image/jpeg")
        }
        response = requests.post(sightengine_url, params=params, files=files)
        response.raise_for_status()
        result = response.json()
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
        # Extract text from image using OCR
        image = Image.open(io.BytesIO(image_data))
        text = pytesseract.image_to_string(image).strip()

        # If a URL is provided, scrape it for additional text
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
        return f"Claim extraction failed: {str(e)}"

# Endpoint to analyze image or URL
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        # Check if an image file or URL was sent
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

        # Step 1: Call Sightengine API to analyze the image
        deepware_result = call_deepware_api(image_data)
        if "error" in deepware_result:
            return jsonify(deepware_result), 500

        # Step 2: Extract claim from image or URL
        claim = extract_claim(image_data, request.form.get('url') if 'url' in request.form else None)
        if "failed" in claim.lower():
            return jsonify({"error": claim}), 500

        # Step 3: Call Google Fact-Checker API to verify the claim
        factcheck_result = call_google_factcheck_api(claim)
        if "error" in factcheck_result:
            return jsonify(factcheck_result), 500

        # Combine results
        result = {
            "deepware_result": deepware_result,
            "factcheck_result": factcheck_result,
            "extracted_claim": claim
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)