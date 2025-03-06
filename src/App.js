import React, { useState } from "react";

function App() {
  const [claim, setClaim] = useState("");
  const [factResult, setFactResult] = useState("");
  const [imageResult, setImageResult] = useState("");

  const checkFact = async () => {
    setFactResult("🔍 Checking...");
    setTimeout(() => {
      setFactResult("✅ False, verified by BBC");
    }, 2000);
  };

  const analyzeImage = async () => {
    setImageResult("📤 Uploading image...");
    setTimeout(() => {
      setImageResult("❌ AI-generated deepfake detected!");
    }, 3000);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px", fontFamily: "Arial" }}>
      <h2>🔍 Misinformation Detector</h2>

      {/* Fact-Checking Input */}
      <input
        type="text"
        placeholder="Enter a claim to verify..."
        value={claim}
        onChange={(e) => setClaim(e.target.value)}
        style={{ padding: "10px", margin: "10px", width: "90%" }}
      />
      <button onClick={checkFact} style={{ padding: "10px", backgroundColor: "#007BFF", color: "white" }}>
        Check Fact
      </button>

      <hr />

      {/* Image Upload for Deepfake Detection */}
      <input type="file" />
      <button onClick={analyzeImage} style={{ padding: "10px", backgroundColor: "#007BFF", color: "white" }}>
        Upload & Analyze
      </button>

      <hr />

      {/* Results Display */}
      <div style={{ marginTop: "20px", fontWeight: "bold" }}>{factResult}</div>
      <div style={{ marginTop: "20px", fontWeight: "bold" }}>{imageResult}</div>
    </div>
  );
}

export default App;
