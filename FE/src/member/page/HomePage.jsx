import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import api from "../../config/axios";
import { Link } from "react-router-dom";

function HomePage() {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);

  const getPlaceholderImage = (name) => {
    if (!name) return 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&size=150';
    
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=150`;
  };

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        setLoading(true);
        const response = await api.get("/consultant/public");
        setConsultants(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách chuyên viên tư vấn:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultants();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <Header />

      <div>
        <section className="relative w-full h-[500px] flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-pattern"></div>
          </div>
          
          <div className="absolute right-0 bottom-0 w-1/2 h-full flex items-center justify-center">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-white opacity-30 tracking-wider rotate-[-8deg]">
              SAY <span className="text-red-500">NO</span> TO DRUGS
            </h2>
          </div>
          
          <div className="relative z-10 container mx-auto px-6 flex flex-col items-start justify-center h-full max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 text-left drop-shadow-lg">
              DRUG USE <span className="text-yellow-300">PREVENTION</span>
            </h1>
            <p className="text-lg md:text-xl text-white font-medium mb-6 text-left max-w-2xl">
              Đánh giá nguy cơ, nhận tư vấn chuyên nghiệp và tự định hướng để xây dựng lối sống lành mạnh
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/assessment" className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-6 py-3 rounded-lg font-semibold shadow-lg transition hover:shadow-xl">
                Bắt đầu khảo sát
              </Link>
              <a href="#how-it-works" className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                Tìm hiểu thêm
              </a>
            </div>
          </div>
          <style jsx>{`
            .bg-pattern {
              background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
            }
          `}</style>
        </section>
        
        <section className="bg-white py-6 shadow-md relative z-10">
          <div className="container mx-auto px-8 md:px-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600">500+</p>
                <p className="text-gray-600">Người đã khảo sát</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">98%</p>
                <p className="text-gray-600">Đánh giá tích cực</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">20+</p>
                <p className="text-gray-600">Chuyên gia tư vấn</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">24/7</p>
                <p className="text-gray-600">Hỗ trợ trực tuyến</p>
              </div>
            </div>
          </div>
        </section>
        
        <section id="how-it-works" className="px-8 md:px-16 py-16 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Cách hệ thống hoạt động</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-600 text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Hoàn thành khảo sát</h3>
                <p className="text-gray-600">
                  Trả lời các câu hỏi được thiết kế dựa trên các phương pháp đánh giá chuyên nghiệp
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-600 text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Nhận kết quả đánh giá</h3>
                <p className="text-gray-600">
                  Xem kết quả cá nhân hóa và các khuyến nghị dựa trên hồ sơ của bạn
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-600 text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Kết nối với chuyên gia</h3>
                <p className="text-gray-600">
                  Đặt lịch tư vấn với chuyên gia phù hợp nhất với nhu cầu của bạn
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-8 md:px-16 py-16 bg-blue-50">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Dịch vụ của chúng tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Giáo Dục & Nhận Thức</h3>
              <p className="text-gray-600 mb-4">
                Cung cấp tài liệu và khóa học miễn phí về phòng ngừa ma túy, phù hợp cho từng nhóm tuổi.
              </p>
              <Link to="/courseList" className="text-blue-600 hover:underline inline-flex items-center">
                Khám phá tài liệu
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Đánh Giá Rủi Ro Cá Nhân</h3>
              <p className="text-gray-600 mb-4">
                Sử dụng các công cụ khảo sát như ASSIST, CRAFFT để xác định mức độ rủi ro cá nhân và nhận được khuyến nghị phù hợp.
              </p>
              <Link to="/assessment" className="text-blue-600 hover:underline inline-flex items-center">
                Bắt đầu khảo sát
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Kết Nối Tư Vấn Chuyên Gia</h3>
              <p className="text-gray-600 mb-4">
                Đặt lịch hẹn tư vấn với các chuyên gia tâm lý, bác sĩ hoặc nhân viên xã hội có kinh nghiệm.
              </p>
              <Link to="/consultantList" className="text-blue-600 hover:underline inline-flex items-center">
                Tìm chuyên gia
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <section className="px-8 md:px-16 py-16 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Đội Ngũ Chuyên Viên Tư Vấn</h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
              Gặp gỡ đội ngũ chuyên gia tâm lý, bác sĩ và nhân viên xã hội có nhiều kinh nghiệm.
              Họ luôn sẵn sàng hỗ trợ và tư vấn với sự thấu hiểu và chuyên môn cao.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                <div className="col-span-full flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                </div>
              ) : consultants.length > 0 ? (
                consultants.slice(0, 4).map((consultant) => (
                  <div key={consultant.consultantId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                    <div className="h-48 overflow-hidden flex items-center justify-center bg-gray-100">
                      <img 
                        src={consultant.avatarUrl || getPlaceholderImage(consultant.fullName)} 
                        alt={`Chuyên viên ${consultant.fullName}`} 
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getPlaceholderImage(consultant.fullName);
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg">{consultant.fullName}</h3>
                      <div className="text-blue-600 text-sm mb-2">{consultant.degree || "Chuyên viên tư vấn"}</div>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {consultant.information || "Chuyên gia tư vấn có kinh nghiệm trong lĩnh vực phòng chống và điều trị các vấn đề liên quan đến ma túy."}
                      </p>
                      {consultant.address && (
                        <div className="mt-2 text-gray-500 text-sm flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="line-clamp-1">{consultant.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-6 text-gray-500">
                  Hiện chưa có thông tin về chuyên viên tư vấn.
                </div>
              )}
            </div>
            
            <div className="text-center mt-10">
              <Link to="/consultantList" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow transition">
                Xem tất cả chuyên viên
              </Link>
            </div>
          </div>
        </section>

        <section className="px-8 md:px-16 py-16 bg-blue-600 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-12">
              <div className="flex-1 min-w-[300px]">
                <h2 className="text-3xl font-bold mb-4">Về Chúng Tôi</h2>
                <p className="mb-4 opacity-90">
                  Chúng tôi kết hợp công nghệ, giáo dục và tư vấn chuyên môn để tạo nên một hệ thống toàn diện trong công tác phòng ngừa ma túy.
                </p>
                <p className="mb-6 opacity-90">
                  Mỗi cá nhân đều có thể tạo nên sự khác biệt trong cuộc chiến này - từ việc nâng cao nhận thức đến hỗ trợ người đang gặp khó khăn.
                </p>
                <Link to="/about-us" className="inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
                  Tìm hiểu thêm
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              
              <div className="flex-1 min-w-[300px] bg-white/10 rounded-lg p-8 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-4">Cam kết của chúng tôi</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Cung cấp thông tin chính xác, khoa học và cập nhật</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Bảo mật thông tin cá nhân của tất cả người dùng</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Kết nối với chuyên gia có kinh nghiệm và chứng chỉ hành nghề</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Hỗ trợ không phán xét, tôn trọng mọi hoàn cảnh cá nhân</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        
        <section className="py-16 bg-white text-center">
          <div className="max-w-3xl mx-auto px-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Bắt đầu hành trình hỗ trợ ngay hôm nay</h2>
            <p className="text-lg text-gray-600 mb-8">
              Dù bạn là nhà giáo dục, phụ huynh hay học sinh/sinh viên, chúng tôi luôn sẵn sàng hỗ trợ
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/assessment">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-md transition">
                  Thực hiện khảo sát
                </button>
              </Link>
              <Link to="/consultantList">
                <button className="bg-gray-100 hover:bg-gray-200 text-blue-600 px-8 py-3 rounded-lg font-semibold transition">
                  Tìm chuyên gia tư vấn
                </button>
              </Link>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    </div>
  );
}

export default HomePage;
