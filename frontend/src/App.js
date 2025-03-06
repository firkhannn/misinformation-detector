import React, { useState } from "react";
import axios from "axios";

function App() {
  const [claim, setClaim] = useState("");
  const [factResult, setFactResult] = useState("");
  const [imageResult, setImageResult] = useState("");

  // Call Flask backend for fake news detection
  const checkFact = async () => {
    setFactResult("🔍 Checking...");
    try {
      const response = await axios.post("http://127.0.0.1:5000/fact-check", { claim });
      if (response.data.error) {
        setFactResult("⚠️ No fact-check found for this article.");
      } else {
        setFactResult(`✅ ${response.data.claim} - ${response.data.verdict} (Source: ${response.data.source})`);
      }
    } catch (error) {
      setFactResult("❌ Error fetching fact-check data.");
    }
  };

  // Call Flask backend for image analysis
  const analyzeImage = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setImageResult("📤 Uploading image...");

    try {
      const response = await axios.post("http://127.0.0.1:5000/analyze-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImageResult(response.data.deepfake_detected ? "❌ This image is doctored!" : "✅ This image is real.");
    } catch (error) {
      setImageResult("❌ Error analyzing image.");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px", fontFamily: "Arial", maxWidth: "600px", margin: "auto" }}>
      <h1>📰 Fake News & Doctored Image Detector</h1>

      {/* Fake News Detection */}
      <h2>📄 Check an Online Article</h2>
      <textarea
        rows="4"
        cols="50"
        placeholder="Paste an article text here..."
        value={claim}
        onChange={(e) => setClaim(e.target.value)}
        style={{ padding: "10px", width: "90%" }}
      ></textarea>
      <br />
      <button
        onClick={checkFact}
        style={{
          padding: "10px",
          backgroundColor: "#007BFF",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Verify Article
      </button>
      <div style={{ marginTop: "20px", fontWeight: "bold", color: "blue" }}>{factResult}</div>

      {/* Doctored Image Detection */}
      <hr />
      <h2>📷 Check a Photo for Manipulation</h2>
      <input type="file" onChange={analyzeImage} accept="image/*" />
      <div style={{ marginTop: "20px", fontWeight: "bold", color: "red" }}>{imageResult}</div>
    </div>
  );
}

export default App;
