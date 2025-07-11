import React, { useEffect, useState } from 'react';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Crafft() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [unansweredQuestions, setUnansweredQuestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await api.post('/assessments/start?type=CRAFFT');
        console.log('API response:', res.data); // Để kiểm tra cấu trúc dữ liệu
        if (res.status === 200 && res.data.questions) {
          setQuestions(res.data.questions);
        } else {
          toast.error('Không có câu hỏi nào!');
        }
      } catch (err) {
        console.error('Lỗi khi load câu hỏi:', err);
        toast.error('Không thể tải câu hỏi!');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswerChange = (questionId, answerId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId,
    }));
    setUnansweredQuestions(prev => prev.filter(id => id !== questionId));
  };

  const validateAllAnswered = () => {
    const unanswered = questions
      .filter(q => !answers[q.id])
      .map(q => q.id);

    setUnansweredQuestions(unanswered);

    if (unanswered.length > 0) {
      toast.error('Vui lòng trả lời tất cả câu hỏi!');
      const firstUnanswered = document.getElementById(`question-${unanswered[0]}`);
      if (firstUnanswered) {
        firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAllAnswered()) return;

    setSubmitting(true);
    
    const payload = Object.keys(answers).map(questionId => ({
      questionId: parseInt(questionId),
      answerId: parseInt(answers[questionId]),
    }));

    try {
      console.log('Submitting payload:', payload); // Debug
      const res = await api.post('/assessments/submit?type=CRAFFT', payload);
      if (res.status === 200) {
        toast.success('Gửi bài thành công!');
        navigate(`/assessment-result/${res.data.assessmentResultId}`);
      } else {
        toast.error('Gửi thất bại!');
      }
    } catch (err) {
      console.error('Submit error:', err);
      if (err.response) {
        if (err.response.status === 401) {
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
          setTimeout(() => navigate('/login'), 1500);
        } else {
          toast.error(`Lỗi: ${err.response.data?.message || 'Có lỗi khi gửi câu trả lời'}`);
        }
      } else {
        toast.error('Không thể kết nối đến server. Vui lòng thử lại sau!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bộ câu hỏi CRAFFT...</p>
          <p className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
      <Footer />
    </>
  );

  if (questions.length === 0) return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-red-50 rounded-lg p-6 inline-block">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium mb-2">Không có câu hỏi CRAFFT nào.</p>
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

  return (
    <>
      <Header />
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-3xl mx-auto px-4">
          {/* Banner */}
          <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-lg shadow-lg mb-8 overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" className="w-full h-full">
                <path d="M14 16H9v-2h5V9.87a4 4 0 1 1 2 0V14h5v2h-5v15.95A10 10 0 0 0 23.66 27l-3.46-2 8.2-2.2-2.9 5a12 12 0 0 1-21 0l-2.89-5 8.2 2.2-3.47 2A10 10 0 0 0 14 31.95V16zm40 40h-5v-2h5v-4.13a4 4 0 1 1 2 0V54h5v2h-5v15.95A10 10 0 0 0 63.66 67l-3.47-2 8.2-2.2-2.88 5a12 12 0 0 1-21.02 0l-2.88-5 8.2 2.2-3.47 2A10 10 0 0 0 54 71.95V56zm-39 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm40-40a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
              </svg>
            </div>
            <div className="p-6 md:p-8 relative z-10">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Bộ câu hỏi đánh giá CRAFFT</h1>
              <p className="text-green-100 md:w-3/4">
                CRAFFT là bộ công cụ sàng lọc sử dụng chất gây nghiện dành cho thanh thiếu niên, giúp phát hiện sớm các hành vi rủi ro liên quan đến rượu và chất kích thích.
              </p>
            </div>
          </div>

          {/* Thông tin thang điểm */}
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Thông tin thang điểm CRAFFT</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-green-50 rounded-md border border-green-100">
                <div className="flex items-center mb-1">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  <span className="font-medium text-green-800">Rủi ro thấp</span>
                </div>
                <p className="text-sm text-gray-600">0 điểm</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-md border border-yellow-100">
                <div className="flex items-center mb-1">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                  <span className="font-medium text-yellow-800">Rủi ro trung bình</span>
                </div>
                <p className="text-sm text-gray-600">1 điểm</p>
              </div>
              <div className="p-3 bg-red-50 rounded-md border border-red-100">
                <div className="flex items-center mb-1">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  <span className="font-medium text-red-800">Rủi ro cao</span>
                </div>
                <p className="text-sm text-gray-600">2+ điểm</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Sau khi hoàn thành bài đánh giá, bạn sẽ nhận được kết quả và các khuyến nghị phù hợp.
            </p>
          </div>

          {/* Thông báo câu hỏi chưa trả lời */}
          {unansweredQuestions.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
              <p className="text-yellow-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Bạn còn <strong>{unansweredQuestions.length}</strong> câu hỏi chưa trả lời!
              </p>
            </div>
          )}

          {/* Tiến trình hoàn thành */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Tiến trình hoàn thành</span>
              <span className="text-green-600 font-medium">
                {Object.keys(answers).length}/{questions.length} câu hỏi
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Danh sách câu hỏi */}
          <div className="space-y-6 mb-8">
            {questions.map((question, index) => {
              const isUnanswered = unansweredQuestions.includes(question.id);

              return (
                <div
                  id={`question-${question.id}`}
                  key={question.id}
                  className={`bg-white p-5 rounded-lg shadow-sm border ${
                    isUnanswered ? 'border-2 border-yellow-400' : 'border-gray-200'
                  } transition-all duration-200`}
                >
                  <div className="font-semibold mb-3 flex items-start">
                    <span className={`inline-flex justify-center items-center w-7 h-7 ${
                      isUnanswered ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    } rounded-full mr-3 font-medium text-sm shrink-0`}>
                      {index + 1}
                    </span>
                    <span className="text-gray-800">{question.questionText}</span>
                  </div>

                  <div className="flex flex-col gap-3 pl-10">
                    {question.answers.map(answer => (
                      <label 
                        key={answer.id} 
                        className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-all
                          ${answers[question.id] === answer.id 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-200 hover:bg-gray-50'}`
                        }
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                          ${answers[question.id] === answer.id 
                            ? 'border-green-500' 
                            : 'border-gray-400'}`
                          }
                        >
                          {answers[question.id] === answer.id && (
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          )}
                        </div>
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={answer.id}
                          checked={answers[question.id] === answer.id}
                          onChange={() => handleAnswerChange(question.id, answer.id)}
                          className="sr-only" // Ẩn radio button gốc
                        />
                        <span className={answers[question.id] === answer.id ? 'text-green-900' : 'text-gray-700'}>
                          {answer.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nút điều hướng */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/assessment')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition flex-1 sm:flex-none"
              disabled={submitting}
            >
              Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex-1 sm:flex-none disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                'Hoàn thành bài đánh giá'
              )}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Crafft;
