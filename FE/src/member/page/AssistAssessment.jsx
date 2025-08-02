import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

function AssistAssessment() {
  const [substances, setSubstances] = useState([]);
  const [selectedSubstances, setSelectedSubstances] = useState([]); // Đổi thành array
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [unansweredQuestions, setUnansweredQuestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubstances = async () => {
      try {
        setLoading(true);
        const res = await api.get('/assessments/assist/substances');
        if (res.status === 200) {
          setSubstances(res.data);
        }
      } catch (err) {
        console.error('Lỗi khi load substances:', err);
        toast.error('Không thể tải danh sách chất!');
      } finally {
        setLoading(false);
      }
    };

    fetchSubstances();
  }, []);

  const handleSubstanceToggle = (substanceId) => {
    setSelectedSubstances(prev => {
      if (prev.includes(substanceId)) {
        // Nếu đã chọn thì bỏ chọn
        return prev.filter(id => id !== substanceId);
      } else {
        // Nếu chưa chọn thì thêm vào
        return [...prev, substanceId];
      }
    });
  };

  const loadQuestionsForSubstances = async () => {
    if (selectedSubstances.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một chất!');
      return;
    }

    try {
      setLoadingQuestions(true);
      
      // Sử dụng API mới để load câu hỏi cho nhiều chất cùng lúc
      console.log('Loading questions for substances:', selectedSubstances);
      const res = await api.post('/assessments/assist/start-for-multiple-substances', selectedSubstances);
      
      if (res.status === 200 && res.data.questions) {
        // Sử dụng substances từ API response thay vì state
        const substancesFromAPI = res.data.substances || [];
        
        // API trả về câu hỏi đã có substanceId, chỉ cần thêm thông tin tên chất
        const questionsWithSubstance = res.data.questions.map(q => {
          // Tìm substance info từ API response
          const substanceInfo = substancesFromAPI.find(s => s.id === q.substanceId);
          
          return {
            ...q,
            id: `${q.id}-${q.substanceId}`, // Tạo unique id bằng cách kết hợp questionId và substanceId
            originalId: q.id, // Giữ lại id gốc để submit
            substanceName: substanceInfo?.name || 'Unknown',
            substanceDescription: substanceInfo?.description || '',
            substanceInfo: substanceInfo // Lưu toàn bộ thông tin substance để sử dụng sau
          };
        });
        
        setQuestions(questionsWithSubstance);
        setAnswers({}); // Reset answers
        
        // Hiển thị thông tin chi tiết hơn
        const substanceNames = substancesFromAPI.map(s => s.name).join(', ');
        toast.success(`Đã tải ${questionsWithSubstance.length} câu hỏi cho: ${substanceNames}`);
        
        // Log để debug
        console.log('Loaded questions with substances:', {
          questions: questionsWithSubstance,
          substances: substancesFromAPI,
          totalQuestions: questionsWithSubstance.length
        });
        
      } else {
        toast.error('Không có câu hỏi nào được tải!');
      }
      
    } catch (err) {
      console.error('Lỗi khi load câu hỏi:', err);
      
      if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        navigate('/login');
      } else if (err.response?.status === 400) {
        toast.error('Danh sách chất không hợp lệ!');
      } else {
        toast.error('Không thể tải câu hỏi!');
      }
    } finally {
      setLoadingQuestions(false);
    }
  };

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

    // Chuyển đổi answers về format gốc để submit
    const payload = Object.keys(answers).map(questionId => {
      const question = questions.find(q => q.id === questionId);
      return {
        questionId: parseInt(question.originalId),
        answerId: parseInt(answers[questionId]),
        substanceId: parseInt(question.substanceId) // ✅ Already included
      };
    });

    try {
      console.log('Submitting ASSIST payload:', payload);
      const res = await api.post('/assessments/submit?type=ASSIST', payload);

      if (res.status === 200) {
        toast.success('Gửi bài thành công!');
        navigate(`/assessment-result/${res.data.assessmentResultId}`);
      } else {
        toast.error('Gửi thất bại!');
      }
    } catch (err) {
      console.error('Submit error:', err);
      
      if (err.response?.data && typeof err.response.data === 'string' && 
          err.response.data.includes('Missing risk config for level')) {
        
        const riskLevel = err.response.data.split(': ')[1];
        toast.warning(`Hệ thống hiện không hỗ trợ mức độ rủi ro ${riskLevel}. Vui lòng liên hệ quản trị viên.`);
      } else {
        toast.error('Có lỗi khi gửi câu trả lời!');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bộ câu hỏi ASSIST...</p>
          <p className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</p>
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
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg shadow-lg mb-8 overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" className="w-full h-full">
                <path d="M14 16H9v-2h5V9.87a4 4 0 1 1 2 0V14h5v2h-5v15.95A10 10 0 0 0 23.66 27l-3.46-2 8.2-2.2-2.9 5a12 12 0 0 1-21 0l-2.89-5 8.2 2.2-3.47 2A10 10 0 0 0 14 31.95V16zm40 40h-5v-2h5v-4.13a4 4 0 1 1 2 0V54h5v2h-5v15.95A10 10 0 0 0 63.66 67l-3.47-2 8.2-2.2-2.88 5a12 12 0 0 1-21.02 0l-2.88-5 8.2 2.2-3.47 2A10 10 0 0 0 54 71.95V56zm-39 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm40-40a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
              </svg>
            </div>
            <div className="p-6 md:p-8 relative z-10">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Bộ câu hỏi đánh giá ASSIST</h1>
              <p className="text-blue-100 md:w-3/4">
                ASSIST là bộ công cụ sàng lọc sự can thiệp liên quan đến rượu, thuốc lá và các chất gây nghiện khác được phát triển bởi Tổ chức Y tế Thế giới (WHO).
              </p>
            </div>
          </div>

          {/* Câu hỏi chọn chất - Multiple choice */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="font-semibold mb-4 flex items-start">
              <span className="inline-flex justify-center items-center w-7 h-7 bg-blue-100 text-blue-800 rounded-full mr-3 font-medium text-sm shrink-0">
                1
              </span>
              <span className="text-gray-800">Trong suốt cuộc đời, bạn đã từng sử dụng bất kỳ chất nào dưới đây, kể cả chỉ một lần? (Có thể chọn nhiều đáp án)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10 mb-4">
              {substances.map(substance => (
                <label 
                  key={substance.id} 
                  className={`flex items-start gap-3 p-4 border rounded-md cursor-pointer transition-all
                    ${selectedSubstances.includes(substance.id) 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'}`
                  }
                >
                  <div className={`w-5 h-5 border-2 rounded flex items-center justify-center mt-0.5
                    ${selectedSubstances.includes(substance.id) 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-400'}`
                    }
                  >
                    {selectedSubstances.includes(substance.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    value={substance.id}
                    checked={selectedSubstances.includes(substance.id)}
                    onChange={() => handleSubstanceToggle(substance.id)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <span className={`font-medium block ${selectedSubstances.includes(substance.id) ? 'text-blue-900' : 'text-gray-700'}`}>
                      {substance.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {substance.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {/* Nút tiếp tục */}
            {selectedSubstances.length > 0 && (
              <div className="pl-10">
                <button
                  onClick={loadQuestionsForSubstances}
                  disabled={loadingQuestions}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-70"
                >
                  {loadingQuestions ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tải câu hỏi...
                    </span>
                  ) : (
                    `Tiếp tục với ${selectedSubstances.length} chất đã chọn`
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Hiển thị các câu hỏi ASSIST khi đã chọn chất */}
          {questions.length > 0 && (
            <>
              {/* Thông tin thang điểm */}
              <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Thông tin thang điểm ASSIST</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-green-50 rounded-md border border-green-100">
                    <div className="flex items-center mb-1">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                      <span className="font-medium text-green-800">Rủi ro thấp</span>
                    </div>
                    <p className="text-sm text-gray-600">0-9 điểm</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-md border border-yellow-100">
                    <div className="flex items-center mb-1">
                      <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                      <span className="font-medium text-yellow-800">Rủi ro trung bình</span>
                    </div>
                    <p className="text-sm text-gray-600">10-19 điểm</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-md border border-red-100">
                    <div className="flex items-center mb-1">
                      <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                      <span className="font-medium text-red-800">Rủi ro cao</span>
                    </div>
                    <p className="text-sm text-gray-600">20+ điểm</p>
                  </div>
                </div>
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
                  <span className="text-blue-600 font-medium">
                    {Object.keys(answers).length}/{questions.length} câu hỏi
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Danh sách câu hỏi ASSIST */}
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
                          isUnanswered ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        } rounded-full mr-3 font-medium text-sm shrink-0`}>
                          {index + 2}
                        </span>
                        <div>
                          <span className="text-gray-800">{question.questionText}</span>
                          <div className="text-sm text-blue-600 mt-1 font-medium flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                            </svg>
                            <span>Về chất: {question.substanceName}</span>
                            {question.substanceDescription && (
                              <span className="text-gray-500 text-xs">
                                ({question.substanceDescription})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 pl-10">
                        {question.answers.map(answer => (
                          <label 
                            key={answer.id} 
                            className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-all
                              ${answers[question.id] === answer.id 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 hover:bg-gray-50'}`
                            }
                          >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                              ${answers[question.id] === answer.id 
                                ? 'border-blue-500' 
                                : 'border-gray-400'}`
                              }
                            >
                              {answers[question.id] === answer.id && (
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              )}
                            </div>
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={answer.id}
                              checked={answers[question.id] === answer.id}
                              onChange={() => handleAnswerChange(question.id, answer.id)}
                              className="sr-only"
                            />
                            <span className={answers[question.id] === answer.id ? 'text-blue-900' : 'text-gray-700'}>
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
                  disabled={submitting || questions.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex-1 sm:flex-none disabled:opacity-70 disabled:cursor-not-allowed"
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
            </>
          )}

          {/* Hướng dẫn khi chưa chọn chất */}
          {selectedSubstances.length === 0 && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
              <p className="text-blue-800">
                👆 Vui lòng chọn ít nhất một chất ở trên để bắt đầu bài đánh giá ASSIST
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AssistAssessment;