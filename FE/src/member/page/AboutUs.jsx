import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

function AboutUs() {
  return (
    <div className="bg-white min-h-screen">
      <Header />

      <div className="">
        {/* Hero Section */}
        <section className="relative w-full h-[400px] flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-pattern"></div>
          </div>
          
          {/* Thay thế ảnh bằng dòng chữ "SAY NO TO DRUGS" */}
          <div className="absolute right-0 bottom-0 w-1/2 h-full flex items-center justify-center">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-white opacity-30 tracking-wider rotate-[-8deg]">
              SAY <span className="text-red-500">NO</span> TO DRUGS
            </h2>
          </div>
          
          <div className="relative z-10 container mx-auto px-6 flex flex-col items-start justify-center h-full max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 text-left drop-shadow-lg">
              Về Chúng Tôi
            </h1>
            <p className="text-lg md:text-xl text-white font-medium mb-6 text-left max-w-2xl md:max-w-3xl">
              Hành trình kiến tạo một cộng đồng không ma túy thông qua giáo dục,
              đánh giá và tư vấn chuyên nghiệp
            </p>
            <a
              href="#our-story"
              className="inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition shadow-lg"
            >
              Tìm hiểu thêm
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
          <style jsx>{`
            .bg-pattern {
              background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
            }
          `}</style>
        </section>

        {/* Our Story */}
        <section id="our-story" className="px-8 md:px-16 py-16 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-10">
              <div className="flex-1 min-w-[300px]">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                  Câu chuyện của chúng tôi
                </h2>
                <p className="text-gray-600 mb-4">
                  Dự án này được hình thành từ sự kết hợp giữa các chuyên gia trong
                  lĩnh vực y tế, tâm lý học và công nghệ, với mục tiêu tạo ra một
                  nền tảng toàn diện để giúp cộng đồng phòng ngừa các vấn đề liên
                  quan đến ma túy và các chất gây nghiện.
                </p>
                <p className="text-gray-600 mb-4">
                  Với sự gia tăng của các vấn đề về lạm dụng chất gây nghiện, đặc
                  biệt trong giới trẻ, chúng tôi nhận thấy sự cần thiết của một giải
                  pháp tiếp cận dựa trên công nghệ - nơi mọi người có thể dễ dàng
                  tiếp cận thông tin, đánh giá rủi ro và kết nối với các chuyên gia.
                </p>
                <p className="text-gray-600">
                  Từ ý tưởng đó, hệ thống phòng ngừa ma túy của chúng tôi ra đời,
                  mang đến một cộng đồng hỗ trợ và các công cụ thiết thực cho mọi
                  đối tượng, từ thanh thiếu niên, phụ huynh đến giáo viên và các
                  nhà hoạch định chính sách.
                </p>
              </div>
              <div className="flex-1 min-w-[300px]">
                <img
                  src="https://res.cloudinary.com/dwjtg28ti/image/upload/v1751180586/photo-1584392251892-e640846a98c0_hmjws7.jpg"
                  alt="Our Story"
                  className="rounded-lg shadow-md w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission and Vision */}
        <section className="px-8 md:px-16 py-16 bg-blue-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Sứ mệnh & Tầm nhìn
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Sứ mệnh của chúng tôi
                  </h3>
                </div>
                <p className="text-gray-600">
                  Sử dụng công nghệ để nâng cao nhận thức, cung cấp công cụ đánh
                  giá và kết nối mọi người với các chuyên gia hỗ trợ, nhằm giảm
                  thiểu tác hại của ma túy và các chất gây nghiện trong cộng đồng.
                </p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Tầm nhìn của chúng tôi
                  </h3>
                </div>
                <p className="text-gray-600">
                  Xây dựng một tương lai nơi mọi người được trang bị kiến thức,
                  công cụ và sự hỗ trợ cần thiết để đưa ra quyết định sáng suốt về
                  sức khỏe và lối sống, tạo nên một cộng đồng khỏe mạnh và không
                  ma túy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="px-8 md:px-16 py-16 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Giá trị cốt lõi
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Mọi hoạt động của chúng tôi đều được định hướng bởi những giá trị
                cốt lõi sau đây, giúp chúng tôi không ngừng cải tiến và phục vụ
                cộng đồng tốt hơn mỗi ngày.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              <div className="p-6 border rounded-lg text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Hòa nhập & Tiếp cận
                </h3>
                <p className="text-gray-600">
                  Cam kết tạo ra các giải pháp tiếp cận được cho mọi người, không
                  phân biệt tuổi tác, trình độ hay hoàn cảnh kinh tế xã hội.
                </p>
              </div>
              <div className="p-6 border rounded-lg text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Khoa học & Chứng cứ
                </h3>
                <p className="text-gray-600">
                  Mọi thông tin và công cụ đánh giá của chúng tôi đều dựa trên
                  nghiên cứu khoa học và bằng chứng thực tiễn mới nhất.
                </p>
              </div>
              <div className="p-6 border rounded-lg text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Bảo mật & Tin cậy
                </h3>
                <p className="text-gray-600">
                  Chúng tôi coi trọng quyền riêng tư và bảo mật thông tin của người
                  dùng, tạo nên một môi trường an toàn và đáng tin cậy.
                </p>
              </div>
              <div className="p-6 border rounded-lg text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Cộng đồng & Hợp tác
                </h3>
                <p className="text-gray-600">
                  Chúng tôi tin rằng những thách thức phức tạp cần có giải pháp từ
                  sự hợp tác giữa nhiều bên, từ cá nhân, gia đình đến cơ quan
                  chính phủ.
                </p>
              </div>
              <div className="p-6 border rounded-lg text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Đổi mới & Sáng tạo
                </h3>
                <p className="text-gray-600">
                  Chúng tôi không ngừng tìm kiếm những phương pháp sáng tạo để
                  giải quyết vấn đề, tận dụng công nghệ để tạo ra tác động tích
                  cực.
                </p>
              </div>
              <div className="p-6 border rounded-lg text-center hover:shadow-md transition">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Đồng cảm & Không phán xét
                </h3>
                <p className="text-gray-600">
                  Chúng tôi tiếp cận mọi cá nhân với sự đồng cảm và không phán xét,
                  tạo không gian an toàn để mọi người tìm kiếm sự giúp đỡ.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Join Us */}
        <section className="px-8 md:px-16 py-16 bg-blue-600 text-white text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Hãy cùng chúng tôi xây dựng một cộng đồng không ma túy
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Dù bạn là nhà giáo dục, phụ huynh, học sinh/sinh viên hay đơn giản
              là người quan tâm đến vấn đề này, chúng tôi luôn chào đón sự tham gia
              của bạn.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/assessment">
                <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
                  Thực hiện khảo sát
                </button>
              </a>
              <a href="/consultantList">
                <button className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                  Kết nối chuyên gia
                </button>
              </a>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}

export default AboutUs;