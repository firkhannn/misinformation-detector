import React from "react";

const App = () => {
  return (
    <div className="flex h-screen">
      {/* Left Section */}
      <div className="w-1/2 bg-black text-white flex flex-col justify-center items-center p-10">
        <div className="text-5xl font-bold">fakemeh?</div>
        <p className="mt-4 text-xl">Check first, don't kena scam!</p>
        <p className="mt-2 text-md text-gray-400 text-center max-w-sm">
          Detect fraud & misinformation by checking if an image was created with generative AI.
        </p>
      </div>

      {/* Right Section */}
      <div className="w-1/2 flex justify-center items-center bg-gradient-to-r from-green-300 to-blue-600">
        <div className="bg-white p-4 rounded-full flex items-center shadow-lg">
          <input
            type="text"
            placeholder="Eh, insert your link or image, let us check for you!"
            className="p-3 w-96 outline-none text-gray-500"
          />
          <button className="p-2 text-gray-500">
            🔼
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;