import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaCheckCircle, FaTimesCircle, FaRedo, FaArrowLeft } from 'react-icons/fa';

function QuizResult() {
  const { id } = useParams(); 
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [resultDetails, setResultDetails] = useState([]);
  const [course, setCourse] = useState(null);

  // Lấy dữ liệu kết quả khi component mount
  useEffect(() => {
    const fetchQuizResult = async () => {
      try {
        setLoading(true);
        
        // Lấy kết quả theo ID
        const resultsRes = await api.get('/quiz-result/my-results');
        
        if (resultsRes.status === 200 && Array.isArray(resultsRes.data)) {
          const foundResult = resultsRes.data.find(r => r.id === parseInt(id));
          
          if (foundResult) {
            setResult(foundResult);
            
            // Lấy chi tiết kết quả
            try {
              const detailsRes = await api.get(`/quiz-result/my-details?resultId=${id}`);
              if (detailsRes.status === 200 && Array.isArray(detailsRes.data)) {
                setResultDetails(detailsRes.data);
              }
            } catch (detailsErr) {
              console.warn('Không thể tải chi tiết kết quả:', detailsErr);
            }
            
            // Lấy thông tin khóa học
            try {
              if (foundResult.courseId) {
                const courseRes = await api.get(`/courses/${foundResult.courseId}`);
                if (courseRes.status === 200) {
                  setCourse(courseRes.data);
                }
              }
            } catch (courseErr) {
              console.warn('Không thể tải thông tin khóa học:', courseErr);
              setCourse({
                id: null,
                name: foundResult.courseName
              });
            }
          } else {
            toast.error('Không tìm thấy kết quả bài kiểm tra');
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải kết quả bài kiểm tra:', error);
        toast.error('Không thể tải kết quả bài kiểm tra');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuizResult();
    }
  }, [id]);

  // Tính điểm phần trăm
  const calculatePercentage = () => {
    if (!result) return 0;
    return Math.round((result.score / result.totalQuestions) * 100);
  };

  // Xác định trạng thái đậu/rớt
  const isPassed = () => {
    return calculatePercentage() >= 80;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-medium text-gray-700">Đang tải kết quả bài kiểm tra...</h2>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-gray-500 mb-4">Kết quả bài kiểm tra không tồn tại hoặc đã bị xóa.</p>
            <Link to="/courseList" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <FaArrowLeft className="mr-2" />
              Quay lại danh sách khóa học
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm">
              <li><Link to="/dashboard" className="text-blue-600 hover:text-blue-800">Trang chủ</Link></li>
              <li className="text-gray-400">/</li>
              <li><Link to="/courseList" className="text-blue-600 hover:text-blue-800">Khóa học</Link></li>
              {course?.id && (
                <>
                  <li className="text-gray-400">/</li>
                  <li><Link to={`/course/${course.id}`} className="text-blue-600 hover:text-blue-800">{course.name}</Link></li>
                </>
              )}
              <li className="text-gray-400">/</li>
              <li className="text-gray-600">Kết quả kiểm tra</li>
            </ol>
          </nav>

          {/* Kết quả tổng quan */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <div className={`p-8 text-white ${isPassed() ? 'bg-gradient-to-r from-green-500 to-green-700' : 'bg-gradient-to-r from-red-500 to-red-700'}`}>
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <h1 className="text-3xl font-bold mb-2">
                    {isPassed() ? 'Chúc mừng! Bạn đã đậu' : 'Chưa đạt yêu cầu'}
                  </h1>
                  <p className="opacity-90 mb-3">
                    Khóa học: {course?.name || 'N/A'}
                  </p>
                  <p className="text-sm opacity-80">
                    Ngày làm bài: {new Date(result.submittedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">
                    {calculatePercentage()}%
                  </div>
                  <div className="text-lg opacity-90">
                    {result.score}/{result.totalQuestions} câu đúng
                  </div>
                  <div className={`mt-3 px-4 py-2 rounded-full text-sm font-medium ${
                    isPassed() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isPassed() ? (
                      <><FaCheckCircle className="inline mr-2" />Đạt yêu cầu</>
                    ) : (
                      <><FaTimesCircle className="inline mr-2" />Chưa đạt 80%</>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="p-6 bg-gray-50 flex flex-wrap gap-3 justify-between">
              <div className="flex flex-wrap gap-3">
                {course?.id ? (
                  <Link
                    to={`/courseList`}
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    <FaArrowLeft className="mr-2" />
                    Quay lại khóa học
                  </Link>
                ) : (
                  <Link
                    to="/courseList"
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    <FaArrowLeft className="mr-2" />
                    Danh sách khóa học
                  </Link>
                )}
                
                {!isPassed() && course?.id && (
                  <Link
                    to={`/quiz/${course.id}`}
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    <FaRedo className="mr-2" />
                    Làm lại bài kiểm tra
                  </Link>
                )}
              </div>

              {!isPassed() && (
                <div className="w-full mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Bạn cần đạt tối thiểu 80% để hoàn thành khóa học. Hãy ôn tập và thử lại!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chi tiết từng câu hỏi */}
          {resultDetails.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Chi tiết từng câu hỏi</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {resultDetails.map((detail, index) => {
                  // Xử lý options: hỗ trợ cả dạng chuỗi và mảng
                  let options = [];
                  if (Array.isArray(detail.options)) {
                    options = detail.options;
                  } else if (typeof detail.options === 'string') {
                    const optionsText = detail.options || "";
                    const optionParts = optionsText.split(';').map(part => part.trim()).filter(Boolean);
                    options = optionParts.map(part => {
                      const match = part.match(/^[A-Z]\.\s*(.+)$/);
                      return match ? match[1].trim() : part;
                    }).filter(Boolean);
                  }
                  
                  return (
                    <div key={index} className="p-6">
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                          detail.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {detail.correct ? <FaCheckCircle /> : <FaTimesCircle />}
                        </div>
                        
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Câu {index + 1}: {detail.question}
                          </h3>
                          
                          <div className="space-y-2 mb-4">
                            {options.map((option, idx) => {
                              // Kiểm tra xem đây có phải là đáp án học viên đã chọn không
                              const isUserAnswer = detail.studentAnswer === String.fromCharCode(65 + idx) || 
                                                   detail.studentAnswer === option ||
                                                   detail.studentAnswer === `${String.fromCharCode(65 + idx)}. ${option}`;
                              
                              return (
                                <div 
                                  key={idx} 
                                  className={`p-3 rounded-lg border ${
                                    isUserAnswer 
                                      ? detail.correct 
                                        ? 'bg-green-50 border-green-300' 
                                        : 'bg-red-50 border-red-300'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <span>
                                    <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                                    {option}
                                    {isUserAnswer && (
                                      <span className={`ml-2 text-sm font-medium ${
                                        detail.correct ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        (Đáp án bạn chọn)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>                          
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default QuizResult;