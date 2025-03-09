import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SignInPage() {
  // Hardcoded credentials for testing
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });
      if (response.data.success) {
        navigate("/"); // Redirect to homepage on success
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans">
      {/* Left Branding Section */}
      <div className="w-1/2 bg-black text-white flex flex-col items-center justify-center p-16 space-y-6">
        <img src="/fakemeh.png" alt="Fakemeh Logo" className="w-24 h-24 mb-4" />
        <h1 className="text-6xl font-extrabold tracking-tight">fakemeh?</h1>
        <p className="text-xl font-medium">Check first, don’t kena scam!</p>
        <p className="text-md text-gray-400 text-center max-w-lg leading-relaxed">
          Detect fraud & misinformation by checking if an image was created with generative AI.
        </p>
      </div>

      {/* Right Sign-in Section */}
      <div className="w-1/2 bg-gradient-to-r from-teal-500 to-lime-400 flex flex-col items-center justify-center p-12 relative">
        <div className="absolute top-8 right-8 flex space-x-4">
          <button
            onClick={() => navigate("/")}
            className="bg-blue-700 text-white px-6 py-2 rounded-lg text-lg font-semibold shadow-md hover:bg-blue-800 transition duration-300"
          >
            HOME
          </button>
          <button
            onClick={() => navigate("/game")}
            className="bg-purple-700 text-white px-6 py-2 rounded-lg text-lg font-semibold shadow-md hover:bg-purple-800 transition duration-300"
          >
            GAME
          </button>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg w-4/5 max-w-md flex flex-col space-y-4">
          <h2 className="text-2xl font-bold text-gray-700 text-center">Sign In</h2>
          <form onSubmit={handleSignIn} className="flex flex-col space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              Sign In
            </button>
            {error && <p className="text-red-500 text-md text-center">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}