import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

function AssessmentPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleStartAssessment = (type) => {
    if (!isLoggedIn) {
      toast.warning("Vui lòng đăng nhập để thực hiện bài đánh giá");
      setTimeout(() => navigate('/login', { state: { from: `/assessment-${type}` } }), 1500);
      return;
    }
    
    // Chuyển đến các trang riêng biệt
    if (type === 'assist') {
      navigate('/assessment-assist');
    } else if (type === 'crafft') {
      navigate('/assessment-crafft');
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-800 mb-4">
            Đánh giá rủi ro cá nhân
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Chọn bài khảo sát phù hợp để đánh giá mức độ rủi ro liên quan đến việc sử dụng chất gây nghiện và nhận các khuyến nghị phù hợp với tình trạng của bạn.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 inline-block text-left">
            <p className="text-gray-700">
              <span className="font-semibold text-blue-700">Lưu ý:</span> Bài khảo sát này chỉ mang tính chất tham khảo và không thay thế cho việc tư vấn trực tiếp với chuyên gia y tế.
            </p>
          </div>
        </div>
        
        {/* Survey Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* ASSIST Survey */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100 transition hover:shadow-xl">
            <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-20 bg-pattern"></div>
              <h3 className="text-3xl font-bold text-white relative z-10">ASSIST</h3>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-blue-800 mb-2">Công cụ đánh giá ASSIST</h3>
              <p className="text-gray-600 mb-4">
                Bài kiểm tra sàng lọc sự can thiệp liên quan đến rượu, thuốc lá và các chất gây nghiện khác của WHO. Phù hợp với người trưởng thành.
              </p>
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">Thời gian: ~5-10 phút</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-700">8 câu hỏi chính</span>
                </div>
              </div>
              <button 
                onClick={() => handleStartAssessment('assist')}
                className="inline-block w-full py-3 px-6 text-center font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-md"
              >
                Bắt đầu bài kiểm tra ASSIST
              </button>
            </div>
          </div>

          {/* CRAFFT Survey */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100 transition hover:shadow-xl">
            <div className="h-48 bg-gradient-to-r from-green-500 to-green-700 flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-20 bg-pattern"></div>
              <h3 className="text-3xl font-bold text-white relative z-10">CRAFFT</h3>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-green-800 mb-2">Công cụ đánh giá CRAFFT</h3>
              <p className="text-gray-600 mb-4">
                Bài kiểm tra sàng lọc ngắn gọn dành cho thanh thiếu niên để đánh giá các hành vi rủi ro liên quan đến rượu và ma túy.
              </p>
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">Thời gian: ~3-5 phút</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-700">6 câu hỏi chính</span>
                </div>
              </div>
              <button 
                onClick={() => handleStartAssessment('crafft')}
                className="inline-block w-full py-3 px-6 text-center font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition shadow-md"
              >
                Bắt đầu bài kiểm tra CRAFFT
              </button>
            </div>
          </div>
        </div>
        
        {/* So sánh hai bài đánh giá */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">So sánh hai bài đánh giá</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 border">Tiêu chí</th>
                  <th className="px-4 py-3 border text-blue-800">ASSIST</th>
                  <th className="px-4 py-3 border text-green-800">CRAFFT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border font-medium">Phù hợp với</td>
                  <td className="px-4 py-2 border">Người trưởng thành (18+ tuổi)</td>
                  <td className="px-4 py-2 border">Thanh thiếu niên (12-21 tuổi)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border font-medium">Thang điểm rủi ro thấp</td>
                  <td className="px-4 py-2 border">0-9 điểm</td>
                  <td className="px-4 py-2 border">0 điểm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border font-medium">Thang điểm rủi ro trung bình</td>
                  <td className="px-4 py-2 border">10-19 điểm</td>
                  <td className="px-4 py-2 border">1 điểm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border font-medium">Thang điểm rủi ro cao</td>
                  <td className="px-4 py-2 border">20+ điểm</td>
                  <td className="px-4 py-2 border">2+ điểm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border font-medium">Ưu điểm</td>
                  <td className="px-4 py-2 border">Đánh giá chi tiết về nhiều loại chất khác nhau</td>
                  <td className="px-4 py-2 border">Ngắn gọn, dễ trả lời, phù hợp với thanh thiếu niên</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Lợi ích của việc đánh giá */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Tại sao nên thực hiện khảo sát?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-5 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nhận biết sớm rủi ro</h3>
              <p className="text-gray-600">
                Phát hiện sớm các dấu hiệu nguy cơ trước khi chúng trở thành vấn đề nghiêm trọng hơn.
              </p>
            </div>
            
            <div className="bg-blue-50 p-5 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nhận khuyến nghị cá nhân</h3>
              <p className="text-gray-600">
                Dựa trên kết quả khảo sát, bạn sẽ nhận được các khuyến nghị phù hợp với tình trạng cá nhân.
              </p>
            </div>
            
            <div className="bg-blue-50 p-5 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Kết nối với chuyên gia</h3>
              <p className="text-gray-600">
                Sau khi nhận kết quả, bạn có thể dễ dàng kết nối với chuyên gia tư vấn phù hợp.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
      
      <Footer />
    </div>
  );
}

export default AssessmentPage;
