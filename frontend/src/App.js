import React, { useState } from "react";
import axios from "axios";
import Home from "./pages/Home";  // Correct import path
import "./index.css"; // Import global styles

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
    <Home
      claim={claim}
      setClaim={setClaim}
      factResult={factResult}
      checkFact={checkFact}
      analyzeImage={analyzeImage}
      imageResult={imageResult}
    />
  );
}

export default App;
