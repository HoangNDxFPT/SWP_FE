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
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [course, setCourse] = useState(null);
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  // Lấy dữ liệu kết quả khi component mount
  useEffect(() => {
    const fetchQuizResult = async () => {
      try {
        setLoading(true);
        
        // Lấy thông tin kết quả bài kiểm tra
        const resultRes = await api.get(`/quiz-result/${id}`);
        if (resultRes.status === 200) {
          setResult(resultRes.data);
          
          // Lấy thông tin khóa học
          if (resultRes.data.course?.id) {
            const courseRes = await api.get(`/courses/${resultRes.data.course.id}`);
            if (courseRes.status === 200) {
              setCourse(courseRes.data);
            }
            
            // Lấy danh sách câu hỏi của khóa học
            const quizRes = await api.get(`/quiz/course/${resultRes.data.course.id}`);
            if (quizRes.status === 200 && Array.isArray(quizRes.data)) {
              const parsedQuizzes = quizRes.data.map(q => ({
                ...q,
                answer: Array.isArray(q.answer) ? q.answer : JSON.parse(q.answer || '[]'),
              }));
              setQuizQuestions(parsedQuizzes);
            }
          }

          // Lấy thông tin câu trả lời của người dùng
          const answersRes = await api.get(`/quiz/result/${id}`);
          if (answersRes.status === 200 && Array.isArray(answersRes.data)) {
            const answersMap = {};
            answersRes.data.forEach(answer => {
              answersMap[answer.questionId] = answer.selectedAnswer;
            });
            setUserAnswers(answersMap);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải kết quả bài kiểm tra:', error);
        toast.error('Không thể tải kết quả bài kiểm tra');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResult();
  }, [id]);

  // Tính điểm phần trăm
  const calculatePercentage = () => {
    if (!result) return 0;
    return Math.round((result.score / result.totalQuestions) * 100);
  };

  // Xác định trạng thái đậu/rớt
  const isPassed = () => {
    const percentage = calculatePercentage();
    return percentage >= 80; // Đậu nếu đạt từ 80% trở lên
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 inline-flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Trang chủ
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <Link to="/courseList" className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2">
                    Khóa học
                  </Link>
                </div>
              </li>
              {course && (
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <Link to={`/course/${course.id}`} className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2">
                      {course.name}
                    </Link>
                  </div>
                </li>
              )}
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-gray-500 md:ml-2 font-medium">Kết quả kiểm tra</span>
                </div>
              </li>
            </ol>
          </nav>
          
          {result && (
            <>
              {/* Result Summary */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className={`p-6 text-white ${isPassed() ? 'bg-gradient-to-r from-green-600 to-green-800' : 'bg-gradient-to-r from-yellow-500 to-red-600'}`}>
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        {isPassed() ? 'Chúc mừng!' : 'Kết quả bài kiểm tra'}
                      </h1>
                      <p className="opacity-90 mb-4">
                        {isPassed() 
                          ? 'Bạn đã hoàn thành xuất sắc bài kiểm tra.' 
                          : 'Bạn đã hoàn thành bài kiểm tra, nhưng chưa đạt điểm đậu.'}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                          Khóa học: {course?.name || 'N/A'}
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                          Ngày làm bài: {result?.submittedAt 
                            ? new Date(result.submittedAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 md:mt-0 flex items-center">
                      <div className="flex flex-col items-center">
                        <div className="text-5xl font-bold">
                          {calculatePercentage()}%
                        </div>
                        <div className="text-sm opacity-90 mt-1">
                          {result.score}/{result.totalQuestions} câu đúng
                        </div>
                        
                        {isPassed() && (
                          <div className="mt-4 flex items-center bg-white text-green-700 px-3 py-1 rounded-full text-sm">
                            <FaCheckCircle className="mr-2" />
                            <span>Đạt yêu cầu</span>
                          </div>
                        )}
                        
                        {!isPassed() && (
                          <div className="mt-4 flex items-center bg-white text-red-600 px-3 py-1 rounded-full text-sm">
                            <FaTimesCircle className="mr-2" />
                            <span>Chưa đạt yêu cầu</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="p-6 flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={`/course/${course?.id}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FaArrowLeft className="mr-2" />
                      Quay lại khóa học
                    </Link>
                    
                    {!isPassed() && (
                      <Link
                        to={`/quiz/${course?.id}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <FaRedo className="mr-2" />
                        Làm lại bài kiểm tra
                      </Link>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Detailed Results */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="border-b border-gray-200 p-6">
                  <div className="flex flex-wrap justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Chi tiết kết quả</h2>
                    <button
                      onClick={() => setShowAllAnswers(!showAllAnswers)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showAllAnswers ? 'Ẩn đáp án' : 'Hiển thị tất cả đáp án'}
                    </button>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {quizQuestions.map((question, index) => {
                    const userAnswerIndex = userAnswers[question.id];
                    const isCorrect = userAnswerIndex === question.correct;
                    
                    return (
                      <div key={question.id} className="p-6">
                        <div className="flex items-start mb-4">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-1 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {isCorrect ? (
                              <FaCheckCircle />
                            ) : (
                              <FaTimesCircle />
                            )}
                          </div>
                          <div className="flex-grow">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                              {index + 1}. {question.question}
                            </h3>
                            
                            <div className="space-y-3 mt-4">
                              {question.answer.map((ans, idx) => (
                                <div 
                                  key={idx} 
                                  className={`p-3 rounded-lg border ${
                                    showAllAnswers && idx === question.correct
                                      ? 'bg-green-50 border-green-300'
                                      : userAnswerIndex === idx 
                                        ? (isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300')
                                        : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                                    <span className="text-gray-800">{ans}</span>
                                    
                                    {showAllAnswers && idx === question.correct && (
                                      <span className="ml-auto text-green-600 text-sm font-medium">Đáp án đúng</span>
                                    )}
                                    
                                    {userAnswerIndex === idx && (
                                      <span className="ml-auto text-sm font-medium">
                                        {isCorrect ? (
                                          <span className="text-green-600">Bạn đã chọn đúng</span>
                                        ) : (
                                          <span className="text-red-600">Bạn đã chọn sai</span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Result Summary Bottom */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden p-6 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {isPassed() 
                    ? 'Chúc mừng bạn đã hoàn thành bài kiểm tra!' 
                    : 'Bạn cần học kỹ hơn để đạt điểm cao hơn.'}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {isPassed() 
                    ? 'Bạn đã hiểu rõ nội dung bài học và đạt kết quả tốt. Hãy tiếp tục phát huy!' 
                    : 'Đừng lo lắng, bạn có thể ôn tập lại bài học và thử lại bài kiểm tra để đạt kết quả tốt hơn.'}
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    to={`/course/${course?.id}`}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    Quay lại khóa học
                  </Link>
                  
                  <Link
                    to="/courseList"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                    Khám phá các khóa học khác
                  </Link > 
                </div>
              </div>
            </>
          )}
          
          {!result && !loading && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy kết quả bài kiểm tra</h3>
              <p className="text-gray-500 mb-4">
                Kết quả bài kiểm tra bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
              </p>
              <Link
                to="/courseList"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Quay lại danh sách khóa học
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default QuizResult;