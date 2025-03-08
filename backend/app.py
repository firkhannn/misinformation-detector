from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Allows frontend to communicate with backend

# Replace with your actual API keys
GOOGLE_FACT_CHECK_API_KEY = "YOUR_GOOGLE_API_KEY"
DEEPWARE_API_KEY = "YOUR_DEEPWARE_API_KEY"

# 🔹 Fake News Detection Using Google Fact Check API
@app.route('/fact-check', methods=['POST'])
def fact_check():
    data = request.json
    query = data.get("claim", "")
    if not query:
        return jsonify({"error": "No claim provided"}), 400

    api_url = f"https://factchecktools.googleapis.com/v1alpha1/claims:search?query={query}&key={GOOGLE_FACT_CHECK_API_KEY}"
    response = requests.get(api_url).json()

    if "claims" in response and response["claims"]:
        claim_data = response["claims"][0]
        return jsonify({
            "claim": claim_data["text"],
            "verdict": claim_data["claimReview"][0]["textualRating"],
            "source": claim_data["claimReview"][0]["publisher"]["name"]
        })
    return jsonify({"message": "No fact-check available for this claim."})

# 🔹 Doctored Image Detection Using Deepware AI
@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    files = {'file': file}
    headers = {"Authorization": f"Bearer {DEEPWARE_API_KEY}"}

    response = requests.post("https://deepware.ai/api/analyze", files=files, headers=headers).json()
    return jsonify({"deepfake_detected": response.get("isDeepfake", False)})

# Run the Flask app
if __name__ == '__main__':
    print("Starting Flask server...")  # Debugging print
    app.run(debug=True)
