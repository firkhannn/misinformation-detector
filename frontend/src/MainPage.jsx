import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./index.css";

export default function MainPage() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [userGuess, setUserGuess] = useState(null);
  const [points, setPoints] = useState(() => parseInt(localStorage.getItem("fakemehPoints")) || 0);
  const [badges, setBadges] = useState(() => JSON.parse(localStorage.getItem("fakemehBadges")) || []);
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem("fakemehStreak")) || 0);
  const [checksCompleted, setChecksCompleted] = useState(() => parseInt(localStorage.getItem("checksCompleted")) || 0);
  const [leaderboard, setLeaderboard] = useState(() => JSON.parse(localStorage.getItem("fakemehLeaderboard")) || []);
  const [nickname, setNickname] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("fakemehPoints", points);
    localStorage.setItem("fakemehBadges", JSON.stringify(badges));
    localStorage.setItem("fakemehStreak", streak);
    localStorage.setItem("checksCompleted", checksCompleted);
    localStorage.setItem("fakemehLeaderboard", JSON.stringify(leaderboard));
  }, [points, badges, streak, checksCompleted, leaderboard]);

  useEffect(() => {
    if (result && imageUrl && result.heatmap_data) {
      drawHeatmap();
      console.log("Heatmap Data:", result.heatmap_data);
    }
  }, [result, imageUrl]);

  const drawHeatmap = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const data = result.heatmap_data || [{"x": img.width / 2, "y": img.height / 2, "anomaly_score": 0.5}];
      data.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 30, 0, 2 * Math.PI);
        ctx.globalAlpha = point.anomaly_score || 0.5;
        ctx.fillStyle = "red";
        ctx.fill();
      });
    };
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImageUrl(URL.createObjectURL(selectedFile));
      setUserGuess(null);
      setResult(null); // Clear previous result to hide the results section
    }
  };

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
    setUserGuess(null);
  };

  const handleSubmit = async () => {
    if (!userGuess) {
      setError("Please make a guess before checking!");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    if (file) formData.append("image", file);
    if (url) formData.append("url", url);

    try {
      const response = await axios.post("http://localhost:5000/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTimeout(() => {
        const newResult = response.data;
        setResult(newResult);
        setLoading(false);
        awardPoints(newResult);
        updateLeaderboard();
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze. Please try again.");
      setLoading(false);
    }
  };

  const awardPoints = (result) => {
    const deepfakeScore = result.deepfake_score || 0;
    let newPoints = 0;
    const isFake = result.classification.includes("Fake");
    const guessedCorrectly = (userGuess === "Fake" && isFake) || (userGuess === "Real" && !isFake);

    if (guessedCorrectly) {
      newPoints += 100;
      if (deepfakeScore >= 0.9) newPoints += 50;
      else if (deepfakeScore >= 0.7) newPoints += 25;
      setStreak(prev => prev + 1);
      if (streak + 1 >= 3) newPoints += 50;
    } else {
      newPoints -= 50;
      setStreak(0);
    }

    setPoints(prevPoints => Math.max(0, prevPoints + newPoints));
    setChecksCompleted(prev => prev + 1);
    checkBadges();
  };

  const checkBadges = () => {
    const newBadges = [...badges];
    if (checksCompleted + 1 === 5 && !badges.includes("Novice Detector")) newBadges.push("Novice Detector");
    else if (checksCompleted + 1 === 20 && !badges.includes("Expert Analyst")) newBadges.push("Expert Analyst");
    else if (checksCompleted + 1 === 50 && !badges.includes("Fake Buster")) newBadges.push("Fake Buster");
    setBadges(newBadges);
  };

  const updateLeaderboard = () => {
    if (nickname) {
      const newEntry = { nickname, points, timestamp: new Date().toISOString() };
      const updatedLeaderboard = [...leaderboard, newEntry].sort((a, b) => b.points - a.points).slice(0, 5);
      setLeaderboard(updatedLeaderboard);
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;
    switch (result.classification) {
      case "Highly Likely Fake": return "❌";
      case "Possibly Fake": return "⚠️";
      case "Likely Real": return "✅";
      default: return null;
    }
  };

  const getClassificationColor = () => {
    if (!result) return "text-gray-500";
    switch (result.classification) {
      case "Highly Likely Fake": return "text-red-600";
      case "Possibly Fake": return "text-yellow-600";
      case "Likely Real": return "text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-lime-600";
      default: return "text-gray-500";
    }
  };

  const getNextBadgeProgress = () => {
    if (checksCompleted >= 50) return "Max badges achieved!";
    if (checksCompleted >= 20) return `Progress to Fake Buster: ${checksCompleted}/50`;
    if (checksCompleted >= 5) return `Progress to Expert Analyst: ${checksCompleted}/20`;
    return `Progress to Novice Detector: ${checksCompleted}/5`;
  };

  const startTutorial = () => {
    setShowTutorial(true);
    setTutorialStep(1);
  };

  const nextTutorialStep = () => {
    if (tutorialStep < 3) setTutorialStep(tutorialStep + 1);
    else setShowTutorial(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left Section */}
      <div className="w-1/2 bg-black text-white flex flex-col items-center justify-center p-16 space-y-8">
        <img src="/fakemeh.png" alt="Fakemeh Logo" className="w-40 h-40 mb-4" />
        <h1 className="text-7xl font-extrabold tracking-tight">fakemeh?</h1>
        <p className="text-3xl font-semibold">Check first, don’t kena scam!</p>
        <p className="text-xl text-gray-300 text-center max-w-xl leading-relaxed">
          Detect fraud & misinformation by checking if an image was created with generative AI.
        </p>
        <button
          onClick={startTutorial}
          className="mt-6 bg-teal-600 text-white px-6 py-2 rounded-lg text-lg hover:bg-teal-700 transition duration-300"
        >
          Start Tutorial
        </button>
      </div>

      {/* Right Section */}
      <div className="w-1/2 bg-gradient-to-r from-teal-500 to-lime-400 flex flex-col items-center justify-center p-12 relative">
        <button
          onClick={() => navigate("/signin")}
          className="absolute top-8 right-8 bg-blue-700 text-white px-6 py-3 rounded-lg text-xl hover:bg-blue-800 transition duration-300"
        >
          SIGN IN
        </button>

        {/* Nickname Input for Leaderboard */}
        <div className="w-4/5 max-w-md mb-4">
          <input
            type="text"
            placeholder="Enter nickname (optional)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full p-3 border border-teal-500 rounded-lg text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        {/* Upload Area */}
        <div className="bg-white p-6 rounded-xl shadow-lg w-4/5 max-w-md flex items-center gap-4 border-2 border-dashed border-teal-500 hover:border-lime-500 transition duration-300">
          <input
            type="text"
            placeholder="Eh, insert your link or image, let us check for you!"
            value={url}
            onChange={handleUrlChange}
            className="w-full p-4 border-none outline-none text-lg text-gray-700"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="fileUpload"
          />
          <label
            htmlFor="fileUpload"
            className="cursor-pointer text-3xl text-teal-500 hover:text-lime-500 transition duration-300"
          >
            ☁️
          </label>
          {file && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {file.name}
            </span>
          )}
        </div>

        {/* Guess Selection */}
        <div className="mt-4 w-4/5 max-w-md">
          <select
            value={userGuess || ""}
            onChange={(e) => setUserGuess(e.target.value)}
            className="w-full p-3 border border-teal-500 rounded-lg text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="" disabled>Select your guess</option>
            <option value="Fake">Fake</option>
            <option value="Real">Real</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg text-xl font-semibold hover:bg-blue-700 transition duration-300"
          disabled={loading || !userGuess}
        >
          {loading ? "Checking..." : "Check"}
        </button>

        {/* Loading Indicator */}
        {loading && (
            <div className="mt-6 flex items-center text-xl text-black">
            <svg
                className="animate-spin h-5 w-5 mr-2 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Analyzing... Please wait
        </div>
        )}

        {/* Error Message */}
        {error && <p className="mt-6 text-red-500 text-xl">{error}</p>}

        {/* Result Display */}
        {result && (
          <div className="mt-6 bg-white p-6 rounded-xl shadow-lg max-w-md w-4/5 border-2 border-teal-500 text-center">
            <p className="text-2xl font-semibold">
              Deepfake Score: {Math.round(result.deepfake_score * 100)}%
            </p>
            <div className="mt-4 flex items-center justify-center">
              <span className={`text-4xl font-bold ${getClassificationColor()}`}>
                {getStatusIcon()} {result.classification}
              </span>
            </div>
            <div className="mt-2 text-lg text-gray-600">
              Status: <span className={`font-medium text-${result.color}-600`}>{result.classification}</span>
            </div>
            {imageUrl && (
              <div className="mt-4 relative">
                <img src={imageUrl} alt="Uploaded for analysis" className="max-w-full rounded-lg border border-gray-300" />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 max-w-full rounded-lg border border-gray-300 opacity-70"
                  style={{ width: '100%', height: 'auto' }}
                />
                {!result.heatmap_data || result.heatmap_data.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No manipulation points detected (using fallback).</p>
                )}
              </div>
            )}
            {/* Gamification Stats */}
            <div className="mt-4 text-left">
              <p className="text-lg font-semibold">Your Stats:</p>
              <p>Points: <span className="text-teal-600">{points}</span></p>
              <p>Streak: <span className="text-teal-600">{streak}</span></p>
              {badges.length > 0 && (
                <p>Badges: <span className="text-teal-600">{badges.join(", ")}</span></p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Your Guess: {userGuess} | Correct: {(userGuess === "Fake" && result.classification.includes("Fake")) || (userGuess === "Real" && !result.classification.includes("Fake")) ? "Yes" : "No"}
              </p>
              <p className="text-sm text-gray-500 mt-1">{getNextBadgeProgress()}</p>
            </div>
            {/* Leaderboard */}
            <div className="mt-4 text-left">
              <p className="text-lg font-semibold">Leaderboard (Top 5):</p>
              {leaderboard.map((entry, index) => (
                <p key={index} className="text-sm text-gray-600">
                  {index + 1}. {entry.nickname || "Anonymous"}: {entry.points} pts
                </p>
              ))}
            </div>
            {/* Fact-Check Data (Optional) */}
            {result.factcheck_data && result.factcheck_data.claims && (
              <div className="mt-4 text-left">
                <p className="text-lg font-semibold">Fact-Check Results:</p>
                {result.factcheck_data.claims.map((claim, index) => (
                  <p key={index} className="text-sm text-gray-600">
                    {claim.claimReviewed}: {claim.textualRating || "No rating"}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tutorial Modal */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-4/5 max-w-md text-center">
              <h2 className="text-2xl font-bold mb-4">Deepfake Detection Tutorial</h2>
              {tutorialStep === 1 && (
                <div>
                  <p>Step 1: Upload an image or enter a URL to check.</p>
                  <p>Tip: Look for unnatural facial movements or lighting issues.</p>
                </div>
              )}
              {tutorialStep === 2 && (
                <div>
                  <p>Step 2: Guess if it’s "Fake" or "Real" using the dropdown.</p>
                  <p>Try it with this hint: Check for blurry edges.</p>
                </div>
              )}
              {tutorialStep === 3 && (
                <div>
                  <p>Step 3: Click "Check" and see the result!</p>
                  <p>Earn points for correct guesses and unlock badges.</p>
                </div>
              )}
              <button
                onClick={nextTutorialStep}
                className="mt-6 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition duration-300"
              >
                {tutorialStep < 3 ? "Next" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}