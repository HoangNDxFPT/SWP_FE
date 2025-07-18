import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

function AssessmentResult() {
  const { assessmentResultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswerDetails, setShowAnswerDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assessment-results/${assessmentResultId}`);
        if (res.status === 200) {
          setResult(res.data);
        }
      } catch (err) {
        console.error('Error fetching assessment result:', err);
        toast.error('Không thể tải kết quả đánh giá!');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [assessmentResultId]);

  // Lấy thông tin nút chuyển hướng dựa trên mức độ rủi ro
  const getActionButtonInfo = () => {
    switch (result?.riskLevel) {
      case 'LOW':
        return { 
          show: true,
          text: 'Xem khóa học phòng ngừa',
          color: 'bg-green-500 hover:bg-green-600',
          action: () => navigate('/courseList')
        };
      case 'MEDIUM':
        return {
          show: true,
          text: 'Xem khóa học phù hợp',
          color: 'bg-yellow-500 hover:bg-yellow-600',
          action: () => navigate('/courseList')
        };
      case 'HIGH':
        return {
          show: true,
          text: 'Đặt lịch tư vấn ngay',
          color: 'bg-red-500 hover:bg-red-600',
          action: () => navigate('/consultantList')
        };
      default:
        return { show: false };
    }
  };

  // Lấy thông tin về mức độ rủi ro
  const getRiskLevelInfo = (level) => {
    switch (level) {
      case 'LOW':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          lightColor: 'bg-green-100',
          darkColor: 'bg-green-600',
          textDark: 'text-green-800',
          text: 'Rủi ro thấp',
          description: 'Bạn hiện không có dấu hiệu đáng lo ngại. Tuy nhiên, hãy chú ý theo dõi sức khỏe tâm thần và thể chất của mình.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
          recommendations: [
            "Tiếp tục duy trì lối sống lành mạnh",
            "Tham gia các hoạt động giáo dục phòng ngừa",
            "Theo dõi định kỳ"
          ]
        };
      case 'MEDIUM':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          lightColor: 'bg-yellow-100',
          darkColor: 'bg-yellow-500',
          textDark: 'text-yellow-800',
          text: 'Rủi ro trung bình',
          description: 'Có một số dấu hiệu cần được quan tâm. Chúng tôi khuyến nghị bạn tham gia các khóa học hỗ trợ để cải thiện tình trạng.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          recommendations: [
            "Tham gia các khóa học hỗ trợ",
            "Trao đổi với chuyên gia tư vấn",
            "Tăng cường hoạt động thể chất và tinh thần tích cực"
          ]
        };
      case 'HIGH':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          lightColor: 'bg-red-100',
          darkColor: 'bg-red-600',
          textDark: 'text-red-800',
          text: 'Rủi ro cao',
          description: 'Kết quả cho thấy bạn có thể cần được trợ giúp chuyên nghiệp. Chúng tôi khuyến nghị bạn đặt lịch tư vấn với chuyên gia càng sớm càng tốt.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          recommendations: [
            "Đặt lịch tư vấn với chuyên gia",
            "Tham gia nhóm hỗ trợ",
            "Theo dõi sát sao và báo cáo các thay đổi"
          ]
        };
      default:
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          lightColor: 'bg-blue-100',
          darkColor: 'bg-blue-600',
          textDark: 'text-blue-800',
          text: 'Chưa xác định',
          description: 'Chưa có thông tin về mức độ rủi ro.',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          ),
          recommendations: []
        };
    }
  };
  
  // Lấy thông tin về loại đánh giá
  const getAssessmentTypeInfo = (type) => {
    switch (type) {
      case 'ASSIST':
        return {
          text: 'ASSIST',
          description: 'Đánh giá sàng lọc của WHO',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'CRAFFT':
        return {
          text: 'CRAFFT',
          description: 'Đánh giá dành cho thanh thiếu niên',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          text: type || 'Đánh giá',
          description: 'Loại đánh giá khác',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải kết quả đánh giá của bạn...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!result) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="bg-red-50 rounded-lg p-6 inline-block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium mb-2">Không có dữ liệu kết quả.</p>
              <button 
                onClick={() => navigate('/assessment')}
                className="text-blue-600 hover:underline mt-2"
              >
                Quay về trang đánh giá
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const actionButton = getActionButtonInfo();
  const riskInfo = getRiskLevelInfo(result.riskLevel);
  const assessmentInfo = getAssessmentTypeInfo(result.assessmentType);

  return (
    <>
      <Header />

      {/* Trang kết quả đánh giá */}
      <div className="min-h-screen bg-gray-50 py-10">
        {/* Header Banner */}
        <div className={`${riskInfo.bgColor} py-8 mb-8`}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm mb-2">
              <Link to="/" className={`${riskInfo.textDark} hover:underline`}>Trang chủ</Link>
              <span className="text-gray-500">›</span>
              <Link to="/assessment" className={`${riskInfo.textDark} hover:underline`}>Đánh giá</Link>
              <span className="text-gray-500">›</span>
              <span className={`font-medium ${riskInfo.textDark}`}>Kết quả</span>
            </div>
            <h1 className={`text-3xl font-bold ${riskInfo.textDark} mb-2`}>
              Kết quả đánh giá {assessmentInfo.text}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Mã: #{result.assessmentResultId}</span>
              <span>•</span>
              <span className="text-gray-600">{new Date(result.submittedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4">
          {/* Tab Navigation */}
          <div className="mb-8 border-b border-gray-200">
            <nav className="flex space-x-6">
              <button 
                onClick={() => setActiveTab('summary')}
                className={`py-4 px-1 font-medium text-lg relative ${activeTab === 'summary' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tổng quan
                {activeTab === 'summary' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('recommendations')}
                className={`py-4 px-1 font-medium text-lg relative ${activeTab === 'recommendations' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Khuyến nghị
                {activeTab === 'recommendations' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
                )}
              </button>
              {result.answers?.length > 0 && (
                <button 
                  onClick={() => setActiveTab('answers')}
                  className={`py-4 px-1 font-medium text-lg relative ${activeTab === 'answers' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Chi tiết câu trả lời
                  {activeTab === 'answers' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Summary Tab Content */}
          {activeTab === 'summary' && (
            <div className="animate-fadeIn">
              {/* Risk Level Card */}
              <div className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
                <div className={`h-2 ${riskInfo.darkColor}`}></div>
                <div className="p-6">
                  <div className="flex items-start gap-5">
                    <div className={`${riskInfo.lightColor} p-4 rounded-full`}>
                      {riskInfo.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">Kết quả đánh giá</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`text-2xl font-bold ${riskInfo.color}`}>
                          {riskInfo.text}
                        </span>
                        <div className="text-lg font-semibold bg-gray-100 px-3 py-1 rounded-full">
                          Điểm số: {result.score}
                        </div>
                      </div>
                      <p className="text-gray-600">{riskInfo.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Info Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Assessment Type */}
                <div className="bg-white rounded-lg shadow-sm p-5 flex items-start gap-4">
                  <div className="bg-blue-50 p-3 rounded-full">
                    {assessmentInfo.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Loại đánh giá</h3>
                    <p className="text-lg font-semibold">{assessmentInfo.text}</p>
                    <p className="text-sm text-gray-500">{assessmentInfo.description}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="bg-white rounded-lg shadow-sm p-5 flex items-start gap-4">
                  <div className="bg-blue-50 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Ngày đánh giá</h3>
                    <p className="text-lg font-semibold">
                      {new Date(result.submittedAt).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(result.submittedAt).toLocaleTimeString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className="bg-white rounded-lg shadow-sm p-5 flex items-start gap-4">
                  <div className={`${riskInfo.bgColor} p-3 rounded-full`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${riskInfo.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Điểm đánh giá</h3>
                    <p className="text-lg font-semibold">{result.score} điểm</p>
                    <p className="text-sm text-gray-500">
                      Thang điểm {result.assessmentType === 'ASSIST' ? '0-27+' : '0-6'}
                    </p>
                  </div>
                </div>
              </div>

              {/* What This Means */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4">Điều này có nghĩa là gì?</h3>
                <div className={`p-4 rounded-lg ${riskInfo.bgColor} mb-4`}>
                  <p className={`mb-4 ${riskInfo.textDark}`}>{riskInfo.description}</p>
                </div>
                
                <h4 className="font-semibold mb-2">Khuyến nghị:</h4>
                <ul className="space-y-2">
                  {riskInfo.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mt-0.5 ${riskInfo.color} flex-shrink-0`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>

                {actionButton.show && (
                  <div className="mt-6">
                    <button
                      onClick={actionButton.action}
                      className={`${actionButton.color} text-white px-6 py-3 rounded-lg font-medium transition shadow hover:shadow-md flex items-center gap-2`}
                    >
                      {actionButton.text}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations Tab Content */}
          {activeTab === 'recommendations' && (
            <div className="animate-fadeIn">
              {/* Recommendation Intro */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full ${riskInfo.lightColor}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${riskInfo.color}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Khuyến nghị cho bạn</h3>
                    <p className="text-gray-600">Dựa trên kết quả đánh giá mức độ rủi ro <span className={`font-medium ${riskInfo.color}`}>{riskInfo.text}</span></p>
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${riskInfo.bgColor}`}>
                  <p className={riskInfo.textDark}>{riskInfo.description}</p>
                </div>
              </div>

              {/* Recommended Courses */}
              {result.recommendedCourses?.length > 0 ? (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Khóa học khuyến nghị</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {result.recommendedCourses.map((course) => (
                      <div key={course.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
                        <div className="h-40 bg-blue-100 relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        </div>
                        <div className="p-5">
                          <h4 className="font-bold text-lg mb-2">{course.name}</h4>
                          <div className="flex items-center text-sm text-gray-500 mb-3 gap-4">
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              Độ tuổi: {course.targetAgeGroup}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {course.description}
                          </p>
                          <button
                            onClick={() => navigate(`/course/${course.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            Xem khóa học
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center mb-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Chưa có khóa học được khuyến nghị</h4>
                  <p className="text-gray-500 mb-4">
                    Bạn có thể xem tất cả các khóa học để tìm khóa học phù hợp với nhu cầu của mình.
                  </p>
                  <button 
                    onClick={() => navigate('/courseList')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center gap-2 transition"
                  >
                    <span>Xem tất cả khóa học</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Các bước tiếp theo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                    </div>
                    <h4 className="font-medium mb-2">1. Đánh giá định kỳ</h4>
                    <p className="text-sm text-gray-600">
                      Thực hiện đánh giá rủi ro định kỳ để theo dõi tiến triển của bạn.
                    </p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <h4 className="font-medium mb-2">2. Học tập chủ động</h4>
                    <p className="text-sm text-gray-600">
                      Tham gia các khóa học và tài liệu giáo dục phù hợp với bạn.
                    </p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="font-medium mb-2">3. Kết nối hỗ trợ</h4>
                    <p className="text-sm text-gray-600">
                      Tìm kiếm sự trợ giúp từ chuyên gia và tham gia vào cộng đồng hỗ trợ.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Answer Details Tab Content */}
          {activeTab === 'answers' && result.answers?.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 animate-fadeIn">
              <h3 className="text-xl font-semibold mb-4">Chi tiết câu trả lời</h3>
              
              <div className="space-y-4">
                {result.answers.map((answer, index) => (
                  <div 
                    key={answer.questionId} 
                    className={`p-4 rounded-lg border ${
                      answer.score > 2 
                        ? 'border-red-200 bg-red-50' 
                        : answer.score > 0 
                          ? 'border-yellow-200 bg-yellow-50' 
                          : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`inline-flex justify-center items-center w-6 h-6 ${
                        answer.score > 2 
                          ? 'bg-red-100 text-red-800' 
                          : answer.score > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-blue-100 text-blue-800'
                        } rounded-full shrink-0 font-medium text-sm`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-2">
                          {answer.questionText}
                        </h4>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-sm">Câu trả lời:</span>
                            <span className="font-medium">{answer.answerText}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-sm">Điểm:</span>
                            <span className={`font-medium ${
                              answer.score > 2 
                                ? 'text-red-600' 
                                : answer.score > 0 
                                  ? 'text-yellow-600' 
                                  : 'text-green-600'
                            }`}>
                              {answer.score}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-8">
            <button
              onClick={() => navigate('/assessment')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition shadow font-medium"
            >
              Thực hiện đánh giá mới
            </button>
            
            <button
              onClick={() => navigate('/assessment-history')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-lg transition font-medium"
            >
              Xem lịch sử đánh giá
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg transition font-medium"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
      
      <Footer />
    </>
  );
}

export default AssessmentResult;
