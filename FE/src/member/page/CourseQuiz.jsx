import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../config/axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';

function CourseQuiz() {
  const [selected, setSelected] = useState({});
  const [course, setCourse] = useState(null);
  const [quizList, setQuizList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(null);
  const { id } = useParams(); // Lấy course ID từ URL thay vì localStorage
  const navigate = useNavigate();
  
  // Lấy thông tin user từ Redux store
  const currentUser = useSelector(state => state.user.user);

  // Thêm state để lưu user từ localStorage nếu Redux store không có
  const [localUser, setLocalUser] = useState(null);
  const [userId, setUserId] = useState(null);

  // Kiểm tra user từ cả Redux và localStorage
  useEffect(() => {
    // Nếu có user từ Redux, sử dụng nó
    if (currentUser && currentUser.id) {
      setUserId(currentUser.id);
      console.log("Sử dụng user từ Redux:", currentUser);
      return;
    }
    
    // Nếu không có từ Redux, kiểm tra localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        console.log("User từ localStorage:", parsedUser);
        
        if (parsedUser && parsedUser.id) {
          setLocalUser(parsedUser);
          setUserId(parsedUser.id);
          console.log("Đã set localUser và userId:", parsedUser.id);
        }
      }
    } catch (error) {
      console.error("Lỗi khi parse user từ localStorage:", error);
    }
  }, [currentUser]);

  // Lấy câu trả lời đã lưu (nếu có)
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`quiz_answers_${id}`);
    if (savedAnswers) {
      try {
        const parsedAnswers = JSON.parse(savedAnswers);
        setSelected(parsedAnswers);
        toast.info("Đã khôi phục câu trả lời trước đó của bạn");
      } catch (e) {
        console.error("Không thể khôi phục câu trả lời:", e);
      }
    }
  }, [id]);

  // Lưu câu trả lời khi thay đổi
  useEffect(() => {
    if (Object.keys(selected).length > 0) {
      localStorage.setItem(`quiz_answers_${id}`, JSON.stringify(selected));
    }
  }, [selected, id]);

  // Lấy dữ liệu quiz và khóa học
  useEffect(() => {
    if (!id) {
      toast.error('Không tìm thấy thông tin khóa học');
      navigate('/courseList');
      return;
    }

    const fetchQuizData = async () => {
      setLoading(true);
      try {
        // Lấy thông tin khóa học
        console.log(`Đang lấy thông tin khóa học với ID: ${id}`);
        
        try {
          const courseRes = await api.get(`courses/${id}`);
          console.log('Kết quả API khóa học:', courseRes);
          
          if (courseRes.status === 200 && courseRes.data) {
            setCourse(courseRes.data);
            console.log('Đã set course:', courseRes.data);
            
            // Thiết lập thời gian làm bài dựa trên thông tin khóa học (nếu có)
            if (courseRes.data.durationInMinutes) {
              setRemainingTime(courseRes.data.durationInMinutes * 60); // Chuyển phút sang giây
            } else {
              // Mặc định là 30 phút nếu không có
              setRemainingTime(30 * 60);
            }
          } else {
            console.error('API trả về nhưng không có dữ liệu:', courseRes);
            toast.warning('Dữ liệu khóa học không đầy đủ');
          }
        } catch (courseError) {
          console.error('Lỗi khi lấy thông tin khóa học:', courseError);
          toast.error('Không thể lấy thông tin khóa học');
        }
        
        // Lấy các câu hỏi quiz
        try {
          const quizRes = await api.get(`quiz/course/${id}`);
          console.log('Kết quả API quiz:', quizRes);
          
          if (quizRes.status === 200 && Array.isArray(quizRes.data)) {
            // In ra mẫu câu hỏi đầu tiên để kiểm tra cấu trúc
            if (quizRes.data.length > 0) {
              console.log('Cấu trúc câu hỏi mẫu:', quizRes.data[0]);
            }
            
            const parsedQuizzes = quizRes.data.map(q => ({
              ...q,
              answer: Array.isArray(q.answer) ? q.answer : JSON.parse(q.answer || '[]'),
              // Đảm bảo correct luôn là số nguyên để so sánh chính xác
              correct: Number(q.correct)
            }));
            setQuizList(parsedQuizzes);
            console.log('Đã set quizList:', parsedQuizzes);
          }
        } catch (quizError) {
          console.error('Lỗi khi lấy câu hỏi quiz:', quizError);
          toast.error('Không thể tải câu hỏi bài kiểm tra');
        }
      } catch (error) {
        console.error('Lỗi tổng quan khi tải dữ liệu quiz:', error);
        toast.error('Đã xảy ra lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();

    // Cảnh báo khi người dùng cố gắng rời khỏi trang
    const handleBeforeUnload = (e) => {
      const message = "Bạn có câu trả lời chưa được lưu. Bạn có chắc chắn muốn rời đi?";
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [id, navigate]);

  // Đếm ngược thời gian làm bài
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0 || loading) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning("Hết thời gian làm bài! Hệ thống sẽ tự động nộp bài.");
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime, loading]);

  // Format thời gian còn lại
  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Di chuyển giữa các câu hỏi
  const navigateToQuestion = (index) => {
    if (index >= 0 && index < quizList.length) {
      setActiveQuestionIndex(index);
    }
  };

  const handleSelect = (quizId, idx) => {
    setSelected(prev => ({ ...prev, [quizId]: idx }));
  };

  // Xử lý lưu kết quả quiz
  const handleSubmit = useCallback(async () => {
    // Kiểm tra đăng nhập
    if (!userId) {
      toast.error('Bạn cần đăng nhập để nộp bài kiểm tra');
      // Lưu trạng thái quiz hiện tại
      localStorage.setItem(`quiz_answers_${id}`, JSON.stringify(selected));
      // Lưu URL để quay lại sau khi đăng nhập
      localStorage.setItem('redirectAfterLogin', `/quiz/${id}`);
      navigate('/login');
      return;
    }

    // Kiểm tra đã trả lời hết câu hỏi chưa
    if (Object.keys(selected).length !== quizList.length) {
      if (!window.confirm('Bạn chưa trả lời hết các câu hỏi. Bạn có chắc muốn nộp bài?')) {
        return;
      }
    }
    
    // Tránh nộp bài nhiều lần
    if (submitting) return;
    setSubmitting(true);

    // Tính điểm và số câu trả lời đúng
    const correctCount = quizList.reduce((acc, quiz) => {
      // Chuyển đổi sang cùng kiểu dữ liệu trước khi so sánh
      const selectedAnswer = Number(selected[quiz.id]);
      const correctAnswer = Number(quiz.correct);
      console.log(`Quiz ${quiz.id}: selected=${selectedAnswer}, correct=${correctAnswer}, match=${selectedAnswer === correctAnswer}`);
      
      return selectedAnswer === correctAnswer ? acc + 1 : acc;
    }, 0);
    
    // Tính phần trăm câu trả lời đúng
    const percentage = (correctCount / quizList.length) * 100;
    // Xác định đạt hay không (ví dụ: >70% là đạt)
    const passed = percentage >= 70;

    try {
      console.log('Bắt đầu nộp bài kiểm tra...');
      
      // 1. Lưu kết quả quiz vào hệ thống
      const payload = {
        score: correctCount,
        totalQuestions: quizList.length,
        user: { 
          id: parseInt(userId)
        },
        course: { 
          id: parseInt(id)
        }
      };
      
      // Thêm xác thực kiểu dữ liệu
      if (isNaN(payload.course.id) || payload.course.id <= 0) {
        toast.error('ID khóa học không hợp lệ');
        setSubmitting(false);
        return;
      }

      if (isNaN(payload.user.id) || payload.user.id <= 0) {
        toast.error('ID người dùng không hợp lệ');
        setSubmitting(false);
        return;
      }

      console.log('Gửi payload:', JSON.stringify(payload));

      // Đảm bảo gửi token trong header
      const token = localStorage.getItem('token');
      console.log('Token hiện tại:', token ? 'Có token' : 'Không có token');

      // Gửi kết quả quiz lên server với header đầy đủ
      const resultRes = await api.post('quiz-result', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined
        }
      });
      console.log('Kết quả API quiz-result:', resultRes);
      
      const resultId = resultRes.data?.id;
      
      // 2. Cập nhật tiến độ học tập
      try {
        // Cập nhật tiến độ cho tất cả các bài học trong khóa học
        const lessonsRes = await api.get(`lessons/course/${id}`);
        if (lessonsRes.status === 200 && Array.isArray(lessonsRes.data)) {
          const lessons = lessonsRes.data;
          
          // Nếu người dùng đạt, đánh dấu hoàn thành tất cả các bài học
          if (passed) {
            console.log(`Người dùng đạt yêu cầu với ${percentage.toFixed(1)}%. Đánh dấu hoàn thành các bài học...`);
            
            for (const lesson of lessons) {
              await api.post('progress/quiz', null, {
                params: {
                  userId: userId,
                  lessonId: lesson.id,
                  passed: true
                }
              });
            }
            toast.success('Chúc mừng! Bạn đã hoàn thành khóa học này.');
          } else {
            console.log(`Người dùng không đạt yêu cầu với ${percentage.toFixed(1)}%.`);
            toast.info(`Bạn đạt ${percentage.toFixed(1)}%. Cần đạt ít nhất 70% để hoàn thành khóa học.`);
          }
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật tiến độ học tập:', error);
      }

      // Xóa lưu trữ cục bộ khi đã nộp bài thành công
      localStorage.removeItem(`quiz_answers_${id}`);

      // 3. Chuyển hướng đến trang kết quả
      if (resultId) {
        console.log(`Chuyển hướng đến trang kết quả với ID: ${resultId}`);
        navigate(`/quiz-result/${resultId}`);
      } else {
        // Nếu không có resultId, quay lại trang khóa học
        console.log('Không có result ID, quay lại trang khóa học');
        navigate(`/course/${id}`);
        toast.info('Đã nộp bài kiểm tra thành công!');
      }
    } catch (err) {
      console.error('Lỗi khi nộp bài kiểm tra:', err);
      
      // Hiển thị thông báo lỗi chi tiết
      if (err.response) {
        console.error('Lỗi response:', err.response.status, err.response.data);
        let errorMessage = 'Đã xảy ra lỗi khi nộp bài kiểm tra';
        
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        
        // Xử lý theo status code
        if (err.response.status === 401) {
          errorMessage = "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại";
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
        }
        
        toast.error(`Lỗi: ${errorMessage}`);
      } else if (err.request) {
        toast.error('Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        toast.error('Đã xảy ra lỗi khi nộp bài kiểm tra. Vui lòng thử lại sau.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [quizList, selected, userId, id, navigate, submitting]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-grow py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <Link to="/courseList" className="hover:text-blue-600">Khóa học</Link>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link to={`/course/${id}`} className="hover:text-blue-600">{course?.name || `Khóa học #${id}`}</Link>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900">Bài kiểm tra</span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h1 className="text-3xl font-bold text-blue-700 mb-2">Bài kiểm tra cuối khóa</h1>
              {remainingTime !== null && (
                <div className="flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-blue-800">{formatTime(remainingTime)}</span>
                </div>
              )}
            </div>
            
            <p className="text-gray-600 mb-6">
              Hãy trả lời các câu hỏi dưới đây để kiểm tra kiến thức của bạn. 
              Bạn cần đạt ít nhất 70% câu trả lời đúng để hoàn thành khóa học.
            </p>
            
            {/* Hiển thị thông tin đăng nhập */}
            <div className="mb-4">
              {userId ? (
                <div className="flex items-center bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700">
                    Đã đăng nhập với ID: <strong>{userId}</strong>
                  </span>
                </div>
              ) : (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        Bạn chưa đăng nhập. <button
                          className="font-bold underline"
                          onClick={() => {
                            localStorage.setItem('redirectAfterLogin', window.location.pathname);
                            navigate('/login');
                          }}
                        >Đăng nhập ngay</button> để có thể nộp bài kiểm tra!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 flex-grow">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Đây là bài kiểm tra cuối khóa. Bạn cần hoàn thành tất cả {quizList.length} câu hỏi.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                <div className="text-sm text-blue-700 font-medium">
                  Đã trả lời: {Object.keys(selected).length}/{quizList.length}
                </div>
                <div className="w-full bg-gray-200 h-2 mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600"
                    style={{ width: `${(Object.keys(selected).length / quizList.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {quizList.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có bài kiểm tra nào</h3>
              <p className="text-gray-500 mb-4">
                Khóa học này hiện chưa có bài kiểm tra. Vui lòng quay lại sau.
              </p>
              <button
                onClick={() => navigate(`/course/${id}`)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Quay lại khóa học
              </button>
            </div>
          ) : (
            <>
              {/* Thanh điều hướng câu hỏi */}
              <div className="mb-6 bg-white rounded-lg shadow-md p-4 overflow-x-auto">
                <div className="flex space-x-2 min-w-max">
                  {quizList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigateToQuestion(idx)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition
                        ${idx === activeQuestionIndex
                          ? 'bg-blue-600 text-white font-bold'
                          : selected[quizList[idx].id] !== undefined
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hiển thị câu hỏi hiện tại */}
              <div className="space-y-8">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="bg-blue-600 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center mr-3">
                        {activeQuestionIndex + 1}
                      </span>
                      {quizList[activeQuestionIndex]?.question}
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {quizList[activeQuestionIndex]?.answer.map((ans, idx) => (
                        <label 
                          key={idx} 
                          className={`flex items-center p-3 rounded-lg cursor-pointer transition
                            ${selected[quizList[activeQuestionIndex]?.id] === idx 
                              ? 'bg-blue-50 border border-blue-200' 
                              : 'hover:bg-gray-50 border border-gray-200'}`}
                        >
                          <input
                            type="radio"
                            name={`quiz_${quizList[activeQuestionIndex]?.id}`}
                            checked={selected[quizList[activeQuestionIndex]?.id] === idx}
                            onChange={() => handleSelect(quizList[activeQuestionIndex]?.id, idx)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 mr-3"
                          />
                          <span className="text-gray-800">
                            <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                            {ans}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Nút điều hướng câu hỏi trước/sau */}
                <div className="flex justify-between">
                  <button
                    onClick={() => navigateToQuestion(activeQuestionIndex - 1)}
                    disabled={activeQuestionIndex === 0}
                    className={`px-4 py-2 rounded-lg flex items-center
                      ${activeQuestionIndex === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Câu trước
                  </button>
                  
                  <button
                    onClick={() => navigateToQuestion(activeQuestionIndex + 1)}
                    disabled={activeQuestionIndex === quizList.length - 1}
                    className={`px-4 py-2 rounded-lg flex items-center
                      ${activeQuestionIndex === quizList.length - 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  >
                    Câu kế tiếp
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-12 flex justify-between items-center">
                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn quay lại khóa học? Tiến trình làm bài sẽ được lưu.')) {
                      navigate(`/course/${id}`);
                    }
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Quay lại khóa học
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={submitting || Object.keys(selected).length === 0}
                  className={`px-8 py-3 rounded-lg flex items-center font-semibold
                    ${submitting
                      ? 'bg-gray-400 text-gray-200 cursor-wait'
                      : Object.keys(selected).length === quizList.length
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
                >
                  {submitting ? (
                    <>
                      <span className="animate-pulse mr-2">⏳</span>
                      Đang xử lý...
                    </>
                  ) : Object.keys(selected).length === quizList.length ? (
                    'Nộp bài kiểm tra'
                  ) : (
                    `Nộp bài (${Object.keys(selected).length}/${quizList.length})`
                  )}
                  {!submitting && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
              
              {Object.keys(selected).length !== quizList.length && (
                <div className="mt-4 text-center text-sm text-yellow-600">
                  Bạn đã trả lời {Object.keys(selected).length} trên {quizList.length} câu hỏi.
                  {Object.keys(selected).length === 0 
                    ? ' Vui lòng trả lời ít nhất một câu hỏi để có thể nộp bài.' 
                    : ' Bạn có thể nộp bài ngay bây giờ hoặc tiếp tục trả lời các câu còn lại.'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default CourseQuiz;