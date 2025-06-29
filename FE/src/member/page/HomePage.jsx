import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

function HomePage() {
  return (
    <div className="bg-white min-h-screen">
      <Header />

      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative w-full h-[400px] flex items-center justify-center bg-gray-100">
          <img
            src="https://res.cloudinary.com/dq3akwrvo/image/upload/v1748825351/download_1_czgnvf.png"
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full bg-black/50 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 text-center drop-shadow-lg">
              Bạn đang băn khoăn điều gì?
            </h1>
            <p className="text-lg text-white font-medium mb-2 text-center">
              Đừng chần chừ nữa!
            </p>
            <p className="text-white mb-4 text-center">
              Hãy làm khảo sát ngay để hiểu rõ bản thân và nhận hỗ trợ phù hợp.
            </p>
            <a href="/servey">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-semibold shadow transition">
                Khảo sát tại đây
              </button>
            </a>
          </div>
        </section>
        {/* Giới thiệu tổng quan hệ thống */}
        <section className="px-8 md:px-16 py-12 bg-white">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Giới Thiệu Về Hệ Thống Phòng Ngừa Ma Túy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg hover:shadow-md transition">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">🌱 Giáo Dục & Nhận Thức</h3>
              <p className="text-gray-600">
                Cung cấp tài liệu và khóa học miễn phí về phòng ngừa ma túy, phù hợp cho từng nhóm tuổi.
              </p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">📝 Đánh Giá Rủi Ro Cá Nhân</h3>
              <p className="text-gray-600">
                Sử dụng các công cụ khảo sát như ASSIST, CRAFFT để xác định mức độ rủi ro cá nhân và nhận được khuyến nghị phù hợp.
              </p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">🤝 Kết Nối Tư Vấn Chuyên Gia</h3>
              <p className="text-gray-600">
                Người dùng có thể dễ dàng đặt lịch hẹn tư vấn với các chuyên gia tâm lý, bác sĩ hoặc nhân viên xã hội có kinh nghiệm.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-12 bg-blue-50">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tham Gia Cùng Chúng Tôi Vì Một Cộng Đồng Không Ma Túy!</h2>
          <a href="/servey">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded font-semibold shadow transition">
              Bắt đầu khảo sát ngay
            </button>
          </a>
        </section>


        {/* Say No To Drugs + About Us */}
        <main className="flex flex-wrap gap-8 px-8 md:px-16 py-12 bg-white justify-center">
          {/* Say No To Drugs */}
          <div className="bg-white rounded-lg shadow-md p-4 w-[340px] flex flex-col items-center hover:shadow-lg transition">
            <img
              src="https://res.cloudinary.com/dwjtg28ti/image/upload/v1748867410/say-no-to-drugs-poster-34182318_l6ily8.webp"
              alt="Say No To Drugs"
              className="w-full h-48 object-cover rounded mb-3"
            />
            <div className="text-2xl font-bold text-center text-black mb-2">
              SAY <span className="text-blue-600">N</span>O TO DRUGS
            </div>
            <p className="text-gray-600 text-center text-sm">
              Cùng nhau xây dựng cộng đồng khỏe mạnh, không ma túy.
            </p>
          </div>

          {/* About Us */}
          <div className="flex-1 min-w-[320px] max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt="About Us"
                className="w-7 h-7"
              />
              <span className="text-blue-600 font-semibold text-lg">About Us</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              Your Support Is Really Powerful.
            </h2>
            <p className="text-gray-600 mb-4">
              "The secret to happiness lies in helping others. Never underestimate the difference YOU can make in the lives of those struggling with addiction, those at risk, and those seeking a path to recovery from drugs."
            </p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold shadow transition">
              Read More
            </button>
          </div>
        </main>

        {/* Mission Section */}
        <section className="flex flex-wrap items-center justify-between gap-8 px-8 md:px-16 py-12 bg-gray-100">
          <div className="flex-1 min-w-[300px] max-w-xl">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Sứ Mệnh Của Chúng Tôi</h2>
            <p className="text-gray-600">
              Chúng tôi phát triển một nền tảng công nghệ nhằm hỗ trợ cộng đồng phòng ngừa ma túy hiệu quả hơn. Từ giáo dục, khảo sát đánh giá rủi ro đến kết nối tư vấn chuyên sâu.
            </p>
            <button className="mt-4 text-blue-600 hover:underline font-semibold">
              Đọc Thêm
            </button>
          </div>
          <div className="bg-blue-100 rounded-lg p-6 flex flex-col items-center min-w-[220px]">
            <div className="text-xl font-bold mb-2 text-gray-800">Hãy Hành Động!</div>
            <button className="bg-white border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-50 font-semibold transition">
              Tham Gia Cùng Chúng Tôi
            </button>
          </div>
        </section>

        
        <Footer />
      </div>
    </div>
  );
}

export default HomePage;
