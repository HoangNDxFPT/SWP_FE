import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

function HomePage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Fixed blue Header */}
      <Header />

      {/* Add padding-top to avoid content being hidden behind the fixed header */}
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative w-full h-[340px] flex items-center justify-center bg-gray-100">
          <img
            src="https://res.cloudinary.com/dq3akwrvo/image/upload/v1748825351/download_1_czgnvf.png"
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full bg-black/40">
            <h1 className="text-5xl font-extrabold text-white mb-2 text-center drop-shadow-lg">
              Bạn đang băn khoăn điều gì?
            </h1>
            <div className="text-lg text-white font-semibold mb-2 text-center">
              Đừng chừng chừ nữa!
            </div>
            <div className="text-white mb-4 text-center">
              Hãy làm khảo sát ngay!
            </div>
            <a href="/servey">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-semibold shadow">
                Khảo sát tại đây
              </button>
            </a>
          </div>
        </section>

        {/* Main Content */}
        <main className="flex flex-wrap gap-8 px-16 py-10 bg-white">
          {/* Say No To Drugs */}
          <div className="bg-white rounded-lg shadow p-4 w-[350px] flex flex-col items-center">
            <img
              src="https://res.cloudinary.com/dwjtg28ti/image/upload/v1748867410/say-no-to-drugs-poster-34182318_l6ily8.webp"
              alt="Say No To Drugs"
              className="w-full h-48 object-cover rounded mb-2"
            />
            <div className="text-2xl font-bold text-center text-black mb-2">
              SAY <span className="text-blue-600">N</span>O TO DRUGS
            </div>
          </div>

          {/* About Us */}
          <div className="flex-1 min-w-[320px]">
            <div className="border-l-4 border-blue-500 pl-4 mb-2 font-semibold text-gray-700 flex items-center gap-2">
              {/* Icon or image */}
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt="About Us"
                className="w-7 h-7"
              />
              About Us
            </div>
            <div className="text-2xl font-bold mb-2 text-gray-800">
              Your Support Is Really Powerful.
            </div>
            <div className="text-gray-600 mb-4">
              "The secret to happiness lies in helping others. Never underestimate the difference YOU can make in the lives of those struggling with addiction, those at risk, and those seeking a path to recovery from drugs."
            </div>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold shadow">
              Read More
            </button>
          </div>
        </main>

        {/* Mission Section */}
        <section className="flex flex-wrap items-center justify-between px-16 py-10 bg-gray-100">
          <div>
            <div className="text-2xl font-bold mb-2 text-gray-800">Our Mission</div>
            <div className="text-gray-600 max-w-xl">
              We are developing a comprehensive software platform to support a volunteer organization's community-based drug prevention efforts. Our solution empowers communities with education, assessment tools, and professional support to combat substance abuse.
            </div>
            <button className="mt-4 text-blue-500 hover:underline font-semibold">Read More</button>
          </div>
          <div className="bg-blue-100 rounded-lg p-8 flex flex-col items-center min-w-[220px] mt-8 md:mt-0">
            <div className="text-xl font-bold mb-2 text-gray-800">Take A Pledge!</div>
            <button className="bg-white border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-50 font-semibold">
              Support Us
            </button>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}

export default HomePage;