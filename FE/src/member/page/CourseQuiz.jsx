import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';

function CourseQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState({});
  const [course, setCourse] = useState(null);
  const [quizList, setQuizList] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [user, setUser] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/profile');
        if (res.status === 200 && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        toast.error('Không thể lấy thông tin người dùng');
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]);

  // Khởi động timer khi quizList được tải
  useEffect(() => {
    if (!loading && quizList.length > 0 && timeLeft !== null) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, quizList]);

  const handleTimeUp = () => {
    toast.warning("Hết thời gian làm bài! Hệ thống sẽ tự động nộp bài của bạn.");
    handleSubmit();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelect = (quizId, idx) => {
    setSelected(prev => ({ ...prev, [quizId]: idx }));
  };

  const handlePreviousQuestion = () => {
    setCurrentQuestion(prev => Math.max(0, prev - 1));
  };

  const handleNextQuestion = () => {
    setCurrentQuestion(prev => Math.min(quizList.length - 1, prev + 1));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      
      const correctCount = quizList.reduce((acc, quiz) => {
        return selected[quiz.id] === quiz.correct ? acc + 1 : acc;
      }, 0);

      // Tạo answers array theo format API
      const answers = quizList.map(quiz => {
        const studentAnswerIndex = selected[quiz.id];
        const studentAnswer = studentAnswerIndex !== undefined ? quiz.answer[studentAnswerIndex] : "";
        const correctAnswer = quiz.answer[quiz.correct];
        
        return {
          question: quiz.question,
          options: quiz.answer, // Đây đã là mảng string đơn giản như ["Chất kích thích", "Chất ma túy", "Vitamin", "Chất dinh dưỡng"]
          correctAnswer: correctAnswer,
          studentAnswer: studentAnswer
        };
      });

      const payload = {
        courseId: Number(id),
        score: correctCount,
        answers: answers
      };

      console.log("Submitting quiz with payload:", payload);

      // Gọi API POST /api/quiz-result/api/quiz-result-submit/
      const resultRes = await api.post('/quiz-result/submit', payload);
      
      console.log("Submit response:", resultRes.data);

      toast.success("Nộp bài kiểm tra thành công!");
      
      // Sử dụng kết quả trả về trực tiếp từ API submit
      const submitResult = resultRes.data;
      
      if (submitResult && submitResult.id) {
        // Lưu mapping courseId -> course name cho sau này
        const courseMapping = JSON.parse(localStorage.getItem('courseMapping') || '{}');
        courseMapping[id] = course?.name;
        localStorage.setItem('courseMapping', JSON.stringify(courseMapping));
        
        // Lưu mapping result ID -> course ID
        const resultCourseMapping = JSON.parse(localStorage.getItem('resultCourseMapping') || '{}');
        resultCourseMapping[submitResult.id] = Number(id);
        localStorage.setItem('resultCourseMapping', JSON.stringify(resultCourseMapping));
        
        console.log("Submit result:", submitResult);
        console.log("Saved mapping:", submitResult.id, "->", id);
        
        // Chuyển hướng đến trang kết quả với ID từ response
        navigate(`/quiz-result/${submitResult.id}`);
      } else {
        console.log("No result ID returned, redirecting to course page");
        navigate(`/course/${id}`);
      }
    } catch (err) {
      console.error('Lỗi khi nộp bài kiểm tra:', err);
      
      if (err.response) {
        console.error('Server response:', err.response.data);
        
        if (err.response.status === 401 || err.response.status === 403) {
          toast.error("Phiên làm việc hết hạn, vui lòng đăng nhập lại");
          navigate('/login');
          return;
        }
        
        toast.error(`Lỗi: ${err.response.data?.message || err.response.data || 'Không thể nộp bài kiểm tra'}`);
      } else {
        toast.error("Đã xảy ra lỗi khi nộp bài kiểm tra. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const getQuestionStatus = (index) => {
    const questionId = quizList[index]?.id;
    if (!questionId) return 'unanswered';
    
    return selected[questionId] !== undefined ? 'answered' : 'unanswered';
  };

  useEffect(() => {
    // Lấy courseId từ URL params thay vì localStorage
    const courseId = id;
    if (!courseId) {
      toast.error("Không tìm thấy thông tin khóa học");
      navigate('/courses');
      return;
    }

    // Chỉ fetch data khi đã có user
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy thông tin khóa học
        const courseRes = await api.get(`courses/${courseId}`);
        setCourse(courseRes.data);
        
        // Lấy danh sách câu hỏi
        const quizRes = await api.get(`quiz/course/${courseId}`);
        
        // Xử lý dữ liệu quiz
        const parsedQuizzes = quizRes.data.map(q => ({
          ...q,
          answer: Array.isArray(q.answer) ? q.answer : JSON.parse(q.answer || '[]'),
          correct: typeof q.correct === 'string' ? Number(q.correct) - 1 : q.correct - 1,
        }));
        
        setQuizList(parsedQuizzes);
        
        // Thiết lập timer (30 phút)
        setTimeLeft(30 * 60); // 30 phút tính bằng giây
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        toast.error("Không thể tải bài kiểm tra. Vui lòng thử lại sau.");
        navigate(`/course/${courseId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, navigate, user]); // Thêm user vào dependencies

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-medium text-gray-700">Đang tải bài kiểm tra...</h2>
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
          {/* Quiz Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-md text-white p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold mb-2">{course?.name || "Bài kiểm tra"}</h1>
                <p className="text-blue-100 mb-2">Hãy chọn đáp án đúng cho mỗi câu hỏi</p>
                <div className="flex items-center">
                  <span className="mr-2 text-blue-100">Câu hỏi:</span>
                  <span className="bg-blue-500 px-2 py-1 rounded font-semibold">{currentQuestion + 1}/{quizList.length}</span>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-col items-end">
                <div className="bg-white text-blue-800 px-4 py-2 rounded-lg font-mono text-xl font-bold animate-pulse">
                  {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                </div>
                <span className="text-xs mt-1 text-blue-100">Thời gian còn lại</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Question Navigation */}
            <div className="md:col-span-1 order-2 md:order-1">
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Danh sách câu hỏi</h3>
                <div className="grid grid-cols-5 md:grid-cols-3 gap-2">
                  {quizList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
                        ${idx === currentQuestion 
                          ? 'bg-blue-600 text-white' 
                          : getQuestionStatus(idx) === 'answered' 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <h3 className="font-medium text-blue-800 mb-2">Chú ý:</h3>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-2 5a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    <span>Đã trả lời: Nền xanh lá</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-2 5a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    <span>Chưa trả lời: Nền xám</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-2 5a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    <span>Câu hiện tại: Nền xanh dương</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Current Question */}
            <div className="md:col-span-3 order-1 md:order-2">
              {quizList.length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-50 p-5 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Câu hỏi {currentQuestion + 1}: {quizList[currentQuestion].question}
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {quizList[currentQuestion].answer.map((ans, idx) => (
                        <label 
                          key={idx} 
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                            ${selected[quizList[currentQuestion].id] === idx 
                              ? 'bg-blue-50 border-blue-300' 
                              : 'hover:bg-gray-50 border-gray-200'}`}
                        >
                          <input
                            type="radio"
                            name={`quiz_${quizList[currentQuestion].id}`}
                            checked={selected[quizList[currentQuestion].id] === idx}
                            onChange={() => handleSelect(quizList[currentQuestion].id, idx)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-3">
                            <span className="block font-medium text-gray-800">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-gray-600">{ans}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 border-t flex justify-between">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestion === 0}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Câu trước
                    </button>
                    
                    {currentQuestion < quizList.length - 1 ? (
                      <button
                        onClick={handleNextQuestion}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Câu tiếp theo
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowConfirmDialog(true)}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                      >
                        Nộp bài
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Quiz Progress */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Tiến độ làm bài</span>
                  <span className="text-sm font-medium text-gray-700">
                    {Object.keys(selected).length}/{quizList.length} câu đã trả lời
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(Object.keys(selected).length / quizList.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Submit button for mobile */}
              <div className="mt-8 md:hidden">
                <button
                  onClick={() => setShowConfirmDialog(true)}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Nộp bài kiểm tra
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Xác nhận nộp bài</h3>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Bạn đã trả lời {Object.keys(selected).length}/{quizList.length} câu hỏi.
                {Object.keys(selected).length < quizList.length && (
                  <span className="text-yellow-600 block mt-2">
                    Chú ý: Vẫn còn {quizList.length - Object.keys(selected).length} câu chưa được trả lời.
                  </span>
                )}
              </p>
              
              <p className="text-gray-600">
                Bạn có chắc chắn muốn nộp bài kiểm tra này không?
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Kiểm tra lại
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : 'Xác nhận nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseQuiz;