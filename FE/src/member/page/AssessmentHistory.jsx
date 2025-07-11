import React, { useEffect, useState } from 'react';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function AssessmentHistory() {
  const navigate = useNavigate();
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await api.get('/assessment-results/me');
        if (res.status === 200) {
          setAssessmentResults(res.data);
        }
      } catch (err) {
        console.error('Error fetching results:', err);
        toast.error('Không thể tải kết quả đánh giá!');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const handleViewResult = (assessmentResultId) => {
    if (expandedRow === assessmentResultId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(assessmentResultId);
    }
  };

  const getRiskLevelDetails = (level) => {
    switch (level) {
      case 'LOW':
        return {
          text: 'Rủi ro thấp',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textDark: 'text-green-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'MEDIUM':
        return {
          text: 'Rủi ro trung bình',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textDark: 'text-yellow-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'HIGH':
        return {
          text: 'Rủi ro cao',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textDark: 'text-red-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          text: 'Không xác định',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textDark: 'text-blue-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };
  
  const getAssessmentTypeDetails = (type) => {
    switch (type) {
      case 'ASSIST':
        return {
          text: 'ASSIST',
          description: 'Đánh giá sàng lọc của WHO',
          color: 'bg-blue-100 text-blue-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'CRAFFT':
        return {
          text: 'CRAFFT',
          description: 'Đánh giá dành cho thanh thiếu niên',
          color: 'bg-green-100 text-green-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          text: type || 'Đánh giá',
          description: 'Loại đánh giá khác',
          color: 'bg-gray-100 text-gray-800',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };

  const filteredResults = filterType === 'ALL' 
    ? assessmentResults
    : assessmentResults.filter(result => result.assessmentType === filterType);

  return (
    <>
      <Header />
      
      <div className="bg-gray-50 min-h-screen py-10">
        {/* Banner section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-8 mb-8">
          <div className="max-w-5xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-white mb-2">Lịch sử đánh giá</h1>
            <p className="text-blue-100">
              Xem lại các bài đánh giá bạn đã thực hiện và kết quả chi tiết
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-10 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải lịch sử đánh giá của bạn...</p>
            </div>
          ) : assessmentResults.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-10 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Chưa có kết quả đánh giá</h2>
              <p className="text-gray-500 mb-6">Bạn chưa thực hiện bài đánh giá nào.</p>
              <button
                onClick={() => navigate('/assessment')}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
              >
                Thực hiện đánh giá ngay
              </button>
            </div>
          ) : (
            <>
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-3 sm:mb-0">
                  Tổng cộng: <span className="text-blue-600">{assessmentResults.length}</span> kết quả
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      filterType === 'ALL' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button 
                    onClick={() => setFilterType('ASSIST')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      filterType === 'ASSIST' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ASSIST
                  </button>
                  <button 
                    onClick={() => setFilterType('CRAFFT')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      filterType === 'CRAFFT' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    CRAFFT
                  </button>
                </div>
              </div>

              {/* Results list */}
              <div className="space-y-4">
                {filteredResults.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p className="text-gray-600">Không tìm thấy kết quả phù hợp với bộ lọc.</p>
                  </div>
                ) : (
                  filteredResults.map((result) => {
                    const riskLevel = getRiskLevelDetails(result.riskLevel);
                    const assessmentType = getAssessmentTypeDetails(result.assessmentType);
                    const isExpanded = expandedRow === result.assessmentResultId;
                    
                    return (
                      <div 
                        key={result.assessmentResultId}
                        className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 ${
                          isExpanded ? 'shadow-md' : 'hover:shadow-md'
                        }`}
                      >
                        {/* Result header */}
                        <div 
                          className={`p-4 cursor-pointer ${isExpanded ? 'border-b border-gray-200' : ''}`}
                          onClick={() => handleViewResult(result.assessmentResultId)}
                        >
                          <div className="flex flex-wrap justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${assessmentType.color} bg-opacity-20`}>
                                {assessmentType.icon}
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <span className="font-medium">{assessmentType.text}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 ml-2">
                                    ID: {result.assessmentResultId}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500">
                                  {new Date(result.submittedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {riskLevel.icon}
                                <span className={`font-medium ${riskLevel.color}`}>
                                  {riskLevel.text}
                                </span>
                              </div>
                              
                              <button className="text-blue-500 flex items-center gap-1 focus:outline-none">
                                <span>{isExpanded ? 'Ẩn' : 'Xem'}</span>
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className={`h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
                                  viewBox="0 0 20 20" 
                                  fill="currentColor"
                                >
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded detail view */}
                        {isExpanded && (
                          <div className="p-5 bg-gray-50 animate-fadeIn">
                            <div className="mb-6">
                              <h3 className="text-xl font-semibold mb-4 text-gray-800">Chi tiết kết quả</h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                                  <p className="text-sm text-gray-500 mb-1">Loại đánh giá</p>
                                  <div className="flex items-center">
                                    {assessmentType.icon}
                                    <span className="font-semibold ml-2">{assessmentType.text}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">{assessmentType.description}</p>
                                </div>
                                
                                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                                  <p className="text-sm text-gray-500 mb-1">Điểm số</p>
                                  <p className="text-2xl font-bold">{result.score}</p>
                                  <p className="text-xs text-gray-500 mt-1">Dựa trên câu trả lời của bạn</p>
                                </div>
                                
                                <div className={`rounded-lg shadow-sm p-4 border ${riskLevel.borderColor} ${riskLevel.bgColor}`}>
                                  <p className="text-sm text-gray-500 mb-1">Mức độ rủi ro</p>
                                  <div className="flex items-center">
                                    {riskLevel.icon}
                                    <span className={`font-semibold ml-2 ${riskLevel.color}`}>{riskLevel.text}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {result.assessmentType === 'ASSIST' 
                                      ? 'Dựa trên thang điểm ASSIST' 
                                      : 'Dựa trên tiêu chuẩn CRAFFT'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className={`p-5 rounded-lg mb-6 ${riskLevel.bgColor} ${riskLevel.borderColor} border`}>
                                <h4 className={`font-medium mb-2 ${riskLevel.textDark}`}>Khuyến nghị:</h4>
                                <p className={riskLevel.textDark}>{result.recommendation || "Không có khuyến nghị."}</p>
                              </div>
                              
                              {result.recommendedCourses?.length > 0 && (
                                <div className="mb-6">
                                  <h4 className="font-semibold mb-3">Khóa học được khuyến nghị:</h4>
                                  <div className="grid grid-cols-1 gap-3">
                                    {result.recommendedCourses.map((course) => (
                                      <div key={course.id} className="bg-white rounded-lg p-4 border border-gray-200 flex justify-between items-center">
                                        <div>
                                          <h5 className="font-medium">{course.name}</h5>
                                          <p className="text-sm text-gray-600">{course.description}</p>
                                          <p className="text-sm text-gray-500 mt-1">Độ tuổi: {course.targetAgeGroup}</p>
                                        </div>
                                        <button
                                          onClick={() => navigate(`/course/${course.id}`)}
                                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1 transition-colors"
                                        >
                                          <span>Xem</span>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => navigate(`/assessment-result/${result.assessmentResultId}`)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                                >
                                  Xem chi tiết đầy đủ
                                </button>
                                <button
                                  onClick={() => setExpandedRow(null)}
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition-colors"
                                >
                                  Đóng
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Action section */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => navigate('/assessment')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition"
                >
                  Thực hiện đánh giá mới
                </button>
              </div>
            </>
          )}
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

export default AssessmentHistory;
