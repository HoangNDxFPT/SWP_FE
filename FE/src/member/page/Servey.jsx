import React from 'react';


function Survey() {
  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen py-8 px-4">
      {/* Title on top center */}
      <h1 className="text-3xl font-bold text-blue-900 mb-8 text-center">Choose a Survey</h1>

      {/* Survey Cards */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        {/* ASSIST Survey */}
        <a
          href="/assist"
          className="flex flex-col items-center bg-white rounded-lg shadow-md hover:shadow-lg transition duration-200 p-4 w-64"
        >
          <img
            src="https://via.placeholder.com/300x150.png?text=ASSIST+Test"
            alt="ASSIST Test"
            className="w-full h-40 object-cover rounded"
          />
          <span className="mt-3 text-lg font-semibold text-blue-700">ASSIST Test</span>
        </a>

        {/* CRAFFT Survey */}
        <a
          href="/crafft"
          className="flex flex-col items-center bg-white rounded-lg shadow-md hover:shadow-lg transition duration-200 p-4 w-64"
        >
          <img
            src="https://via.placeholder.com/300x150.png?text=CRAFFT+Test"
            alt="CRAFFT Test"
            className="w-full h-40 object-cover rounded"
          />
          <span className="mt-3 text-lg font-semibold text-green-700">CRAFFT Test</span>
        </a>
      </div>
    </div>
  );
}

export default Survey;
