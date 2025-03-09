import React, { useState, useEffect } from "react";
import axios from "axios";
import "./index.css"; // Import Tailwind styles

export default function App() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null); // Store the image URL for display
  const [userGuess, setUserGuess] = useState(null); // User's prediction (Fake or Real)
  const [points, setPoints] = useState(() => {
    // Load points from localStorage or default to 0
    return parseInt(localStorage.getItem("fakemehPoints")) || 0;
  });
  const [badges, setBadges] = useState(() => {
    // Load badges from localStorage or default to an empty array
    return JSON.parse(localStorage.getItem("fakemehBadges")) || [];
  });

  useEffect(() => {
    // Save points and badges to localStorage whenever they change
    localStorage.setItem("fakemehPoints", points);
    localStorage.setItem("fakemehBadges", JSON.stringify(badges));
  }, [points, badges]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create and store image URL for display
      setImageUrl(URL.createObjectURL(selectedFile));
      setUserGuess(null); // Reset guess when new file is selected
    }
  };

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
    setUserGuess(null); // Reset guess when new URL is entered
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
        // Award points based on guess and result
        awardPoints(newResult);
      }, 5000); // Simulate 5-second loading
    } catch (err) {
      setError("Failed to analyze. Please try again.");
      setLoading(false);
    }
  };

  // Award points based on user guess and result
  const awardPoints = (result) => {
    const deepfakeScore = result.deepfake_score || 0;
    let newPoints = 0;
    const isFake = result.classification.includes("Fake");
    const guessedCorrectly = (userGuess === "Fake" && isFake) || (userGuess === "Real" && !isFake);

    // Base points for a correct guess
    if (guessedCorrectly) {
      newPoints += 100;
      // Bonus for high-confidence detection
      if (deepfakeScore >= 0.9) newPoints += 50;
      else if (deepfakeScore >= 0.7) newPoints += 25;
    } else {
      newPoints -= 50; // Penalty for incorrect guess
    }

    setPoints(prevPoints => {
      const updatedPoints = Math.max(0, prevPoints + newPoints); // Ensure points don't go negative
      return updatedPoints;
    });
    checkBadges();
  };

  // Check and award badges
  const checkBadges = () => {
    const checksCompleted = parseInt(localStorage.getItem("checksCompleted") || 0) + 1;
    localStorage.setItem("checksCompleted", checksCompleted);

    const newBadges = [...badges];
    if (checksCompleted === 5 && !badges.includes("Novice Detector")) {
      newBadges.push("Novice Detector");
    } else if (checksCompleted === 20 && !badges.includes("Expert Analyst")) {
      newBadges.push("Expert Analyst");
    } else if (badges.filter(b => b.includes("Fake")).length === 10 && !badges.includes("Fake Buster")) {
      newBadges.push("Fake Buster");
    }
    setBadges(newBadges);
  };

  // Get status icon based on classification
  const getStatusIcon = () => {
    if (!result) return null;
    switch (result.classification) {
      case "Highly Likely Fake":
        return "❌";
      case "Possibly Fake":
        return "⚠️";
      case "Likely Real":
        return "✅";
      default:
        return null;
    }
  };

  // Determine classification text color
  const getClassificationColor = () => {
    if (!result) return "text-gray-500";
    switch (result.classification) {
      case "Highly Likely Fake":
        return "text-red-600";
      case "Possibly Fake":
        return "text-yellow-600";
      case "Likely Real":
        return "text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-lime-600";
      default:
        return "text-gray-500";
    }
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
      </div>

      {/* Right Section */}
      <div className="w-1/2 bg-gradient-to-r from-teal-500 to-lime-400 flex flex-col items-center justify-center p-12 relative">
        <button className="absolute top-8 right-8 bg-blue-700 text-white px-6 py-3 rounded-lg text-xl hover:bg-blue-800 transition duration-300">
          SIGN IN
        </button>

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
          <div className="mt-6 flex items-center text-xl text-yellow-500">
            <svg
              className="animate-spin h-5 w-5 mr-2 text-yellow-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
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
            {/* Display Uploaded Image */}
            {imageUrl && (
              <div className="mt-4">
                <img src={imageUrl} alt="Uploaded for analysis" className="max-w-full rounded-lg border border-gray-300" />
              </div>
            )}
            {/* Gamification Stats */}
            <div className="mt-4 text-left">
              <p className="text-lg font-semibold">Your Stats:</p>
              <p>Points: <span className="text-teal-600">{points}</span></p>
              {badges.length > 0 && (
                <p>Badges: <span className="text-teal-600">{badges.join(", ")}</span></p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Your Guess: {userGuess} | Correct: {(userGuess === "Fake" && result.classification.includes("Fake")) || (userGuess === "Real" && !result.classification.includes("Fake")) ? "Yes" : "No"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}