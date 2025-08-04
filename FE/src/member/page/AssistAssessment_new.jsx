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
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [showCourseRecommendations, setShowCourseRecommendations] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const navigate = useNavigate();

  // Sửa API endpoint để lấy substances
  useEffect(() => {
    const fetchSubstances = async () => {
      try {
        setLoading(true);
        const res = await api.get('/substances');
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
      
      // Sửa API endpoint từ /assessments/assist/start-for-multiple-substances thành /assessments/start-assist
      console.log('Loading questions for substances:', selectedSubstances);
      const res = await api.post('/assessments/start-assist');
      
      if (res.status === 200) {
        // Lấy substances và template questions từ response
        const substancesFromAPI = res.data.substances || [];
        const templateQuestions = res.data.templateQuestions || [];
        const injectionQuestion = res.data.injectionQuestion;
        
        // Tạo questions cho từng substance được chọn
        const questionsWithSubstance = [];
        
        selectedSubstances.forEach(substanceId => {
          const substanceInfo = substancesFromAPI.find(s => s.id === substanceId);
          
          // Thêm template questions (2-7)
          templateQuestions.forEach(template => {
            questionsWithSubstance.push({
              id: `${template.questionOrder}-${substanceId}`, // Unique ID
              originalId: template.questionOrder, // Question order để submit
              questionText: template.questionTemplate,
              questionOrder: template.questionOrder,
              substanceId: substanceId,
              substanceName: substanceInfo?.name || 'Unknown',
              substanceDescription: substanceInfo?.description || '',
              substanceInfo: substanceInfo,
              answers: template.answerOptions.map(opt => ({
                id: opt.id,
                text: opt.text
              }))
            });
          });
        });
        
        // Thêm injection question (8) chỉ một lần cho tất cả substances
        if (injectionQuestion && selectedSubstances.length > 0) {
          questionsWithSubstance.push({
            id: `${injectionQuestion.questionId}-injection`, // Unique ID for injection question
            originalId: injectionQuestion.questionId,
            questionText: injectionQuestion.questionText,
            questionOrder: injectionQuestion.questionId,
            substanceId: 'injection', // Special ID for injection question
            substanceName: 'Kim tiêm chích',
            substanceDescription: 'Câu hỏi về việc sử dụng kim tiêm',
            substanceInfo: { name: 'Injection', description: 'Injection related question' },
            isInjectionQuestion: true, // Flag để identify injection question
            answers: injectionQuestion.answerOptions.map(opt => ({
              id: opt.id,
              text: opt.text
            }))
          });
        }
        
        setQuestions(questionsWithSubstance);
        setAnswers({}); // Reset answers
        setCurrentQuestionIndex(0); // Reset to first question
        
        const substanceNames = selectedSubstances
          .map(id => substancesFromAPI.find(s => s.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        toast.success(`Đã tải ${questionsWithSubstance.length} câu hỏi cho: ${substanceNames}`);
        
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
    
    // Tự động chuyển sang câu hỏi tiếp theo
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300); // Delay nhỏ để user thấy được selection
    }
  };

  const validateAllAnswered = () => {
    const unanswered = visibleQuestions
      .filter(q => !answers[q.id])
      .map(q => q.id);

    setUnansweredQuestions(unanswered);

    if (unanswered.length > 0) {
      toast.error('Vui lòng trả lời tất cả câu hỏi bắt buộc!');
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

    // Tạo substanceAssessments theo format API mới nhất
    const substanceAssessments = selectedSubstances.map(substanceId => {
      // Tìm tất cả answers cho substance này (không bao gồm injection question)
      const substanceQuestions = questions.filter(q => 
        q.substanceId === substanceId && !q.isInjectionQuestion
      );
      
      // Lấy tất cả answerIds cho substance này, sắp xếp theo questionOrder
      const answerIds = substanceQuestions
        .sort((a, b) => a.questionOrder - b.questionOrder)
        .map(question => parseInt(answers[question.id]))
        .filter(answerId => !isNaN(answerId)); // Remove NaN values

      return {
        substanceId: parseInt(substanceId),
        answerIds: answerIds
      };
    });

    // Tìm injection question answer (nếu có)
    const injectionQuestion = questions.find(q => q.isInjectionQuestion);
    let injectionAnswerId = null;
    if (injectionQuestion && answers[injectionQuestion.id]) {
      injectionAnswerId = parseInt(answers[injectionQuestion.id]);
    }

    const payload = {
      substanceAssessments: substanceAssessments,
      ...(injectionAnswerId && { injectionAnswerId: injectionAnswerId }) // Chỉ thêm nếu có answer
    };

    try {
      console.log('Submitting ASSIST payload:', payload);
      const res = await api.post('/assessments/submit-assist', payload);

      if (res.status === 200) {
        toast.success('Gửi bài thành công!');
        
        // Check if there are recommended courses in the response
        if (res.data.recommendedCourses && res.data.recommendedCourses.length > 0) {
          setRecommendedCourses(res.data.recommendedCourses);
          setShowCourseRecommendations(true);
        }
        
        navigate(`/assessment-result/${res.data.assessmentResultId}`);
      } else {
        toast.error('Gửi thất bại!');
      }
    } catch (err) {
      console.error('Submit error:', err);
      
      if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        navigate('/login');
      } else if (err.response?.data && typeof err.response.data === 'string') {
        if (err.response.data.includes('Missing risk config for level')) {
          const riskLevel = err.response.data.split(': ')[1];
          toast.warning(`Hệ thống hiện không hỗ trợ mức độ rủi ro ${riskLevel}. Vui lòng liên hệ quản trị viên.`);
        } else if (err.response.data.includes('Substance not found')) {
          toast.error('Không tìm thấy chất được chọn. Vui lòng thử lại!');
        } else {
          toast.error(`Lỗi: ${err.response.data}`);
        }
      } else {
        toast.error('Có lỗi khi gửi câu trả lời!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Check if Q2 answer is "Never" to skip Q6-Q8
  const shouldSkipAdvancedQuestions = (substanceId) => {
    const q2Answer = answers[`2-${substanceId}`];
    if (!q2Answer) return false;
    
    // Find the answer option in questions data
    const q2Question = questions.find(q => q.id === `2-${substanceId}`);
    const q2AnswerOption = q2Question?.answers.find(a => a.id === parseInt(q2Answer));
    
    // Skip if answer contains "never" or has score 0 (theo logic ASSIST)
    return q2AnswerOption?.text?.toLowerCase().includes('never') || 
           q2AnswerOption?.text?.toLowerCase().includes('không bao giờ');
  };

  // Get visible questions (excluding skipped ones)
  const getVisibleQuestions = () => {
    return questions.filter(q => {
      // Always show injection question
      if (q.isInjectionQuestion) return true;
      
      // Skip advanced questions (6-8) if Q2 for this substance is "Never"
      if (q.originalId >= 6 && q.originalId <= 8) {
        return !shouldSkipAdvancedQuestions(q.substanceId);
      }
      
      return true;
    });
  };

  const visibleQuestions = getVisibleQuestions();

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < visibleQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Get current question
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

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
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Thông tin thang điểm ASSIST
                </h2>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>Cách tính điểm:</strong> Mỗi chất sẽ có điểm riêng. Mức độ rủi ro tổng thể sẽ được xác định dựa trên <strong>điểm cao nhất</strong> trong số các chất bạn đã chọn.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-center mb-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 mr-3 flex-shrink-0"></div>
                      <span className="font-semibold text-green-800">Rủi ro thấp</span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="text-xs text-green-700">
                        • Sử dụng ở mức độ thấp
                      </p>
                      <p className="text-xs text-green-700">
                        • Khuyến nghị: Tự theo dõi và giảm thiểu
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-center mb-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500 mr-3 flex-shrink-0"></div>
                      <span className="font-semibold text-yellow-800">Rủi ro trung bình</span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="text-xs text-yellow-700">
                        • Có dấu hiệu sử dụng có hại
                      </p>
                      <p className="text-xs text-yellow-700">
                        • Khuyến nghị: Can thiệp ngắn hạn
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-center mb-2">
                      <div className="w-4 h-4 rounded-full bg-red-500 mr-3 flex-shrink-0"></div>
                      <span className="font-semibold text-red-800">Rủi ro cao</span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="text-xs text-red-700">
                        • Có thể đã phụ thuộc
                      </p>
                      <p className="text-xs text-red-700">
                        • Khuyến nghị: Điều trị chuyên sâu
                      </p>
                    </div>
                  </div>
                </div>

                {/* Thông tin bổ sung về đánh giá đa chất */}
                <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Lưu ý quan trọng:
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1 ml-5">
                    <li className="flex items-start">
                      <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 mr-2 flex-shrink-0"></span>
                      <span>Bạn sẽ được đánh giá riêng cho từng chất đã chọn</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 mr-2 flex-shrink-0"></span>
                      <span>Mức độ rủi ro chung sẽ dựa trên chất có điểm cao nhất</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 mr-2 flex-shrink-0"></span>
                      <span>Kết quả sẽ bao gồm khuyến nghị cụ thể cho từng mức độ rủi ro</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Thông báo câu hỏi chưa trả lời */}
              {unansweredQuestions.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
                  <p className="text-yellow-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Còn {unansweredQuestions.length} câu hỏi chưa được trả lời. Vui lòng hoàn thành tất cả để nộp bài.
                  </p>
                </div>
              )}

              {/* Tiến trình hoàn thành */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Tiến trình hoàn thành</span>
                  <span className="text-blue-600 font-medium">
                    {Object.keys(answers).filter(key => visibleQuestions.some(q => q.id === key)).length}/{visibleQuestions.length} câu hỏi
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${visibleQuestions.length > 0 ? 
                        (Object.keys(answers).filter(key => visibleQuestions.some(q => q.id === key)).length / visibleQuestions.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                
                {/* Navigation dots */}
                <div className="flex justify-center mt-4 space-x-2">
                  {visibleQuestions.map((_, index) => {
                    const question = visibleQuestions[index];
                    const isAnswered = !!answers[question.id];
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => goToQuestion(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          isCurrent 
                            ? 'bg-blue-600 scale-125' 
                            : isAnswered 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        title={`Câu hỏi ${index + 2}${isAnswered ? ' (Đã trả lời)' : ''}`}
                      />
                    );
                  })}
                </div>
                
                {/* Thông báo về câu hỏi bị ẩn */}
                {questions.length > visibleQuestions.length && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        Đã ẩn {questions.length - visibleQuestions.length} câu hỏi do bạn trả lời "Không bao giờ" ở câu 2 cho một số chất.
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Hiển thị câu hỏi hiện tại */}
              {currentQuestion && (
                <div className="space-y-6 mb-8">
                  <div
                    id={`question-${currentQuestion.id}`}
                    className={`${currentQuestion.isInjectionQuestion ? 'bg-orange-50 border-orange-200' : 'bg-white'} p-6 rounded-lg shadow-md border-2 ${
                      currentQuestion.isInjectionQuestion ? 'border-orange-300' : 'border-blue-300'
                    } transition-all duration-300`}
                  >
                    <div className="font-semibold mb-4 flex items-start">
                      <span className={`inline-flex justify-center items-center w-8 h-8 ${
                        currentQuestion.isInjectionQuestion 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      } rounded-full mr-3 font-medium text-sm shrink-0`}>
                        {currentQuestion.isInjectionQuestion ? '💉' : currentQuestionIndex + 2}
                      </span>
                      <div>
                        <span className="text-gray-800 text-lg">{currentQuestion.questionText}</span>
                        <div className={`text-sm mt-2 font-medium flex items-center gap-2 ${
                          currentQuestion.isInjectionQuestion ? 'text-orange-600' : 'text-blue-600'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            {currentQuestion.isInjectionQuestion ? (
                              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 712 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 712 0zM2 13a2 2 0 712-2h12a2 2 0 712 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 712 0z" clipRule="evenodd" />
                            )}
                          </svg>
                          <span>
                            {currentQuestion.isInjectionQuestion 
                              ? 'Câu hỏi chung về kim tiêm (không tính điểm cho chất cụ thể)'
                              : `Về chất: ${currentQuestion.substanceName}`
                            }
                          </span>
                          {!currentQuestion.isInjectionQuestion && currentQuestion.substanceDescription && (
                            <span className="text-gray-500 text-xs">
                              ({currentQuestion.substanceDescription})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 pl-11">
                      {currentQuestion.answers.map(answer => (
                        <label 
                          key={answer.id} 
                          className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-sm
                            ${answers[currentQuestion.id] === answer.id 
                              ? 'border-blue-400 bg-blue-50 shadow-md' 
                              : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`
                          }
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                            ${answers[currentQuestion.id] === answer.id 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-400'}`
                            }
                          >
                            {answers[currentQuestion.id] === answer.id && (
                              <div className="w-3 h-3 rounded-full bg-white"></div>
                            )}
                          </div>
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={answer.id}
                            checked={answers[currentQuestion.id] === answer.id}
                            onChange={() => handleAnswerChange(currentQuestion.id, answer.id)}
                            className="sr-only"
                          />
                          <span className={`text-base ${answers[currentQuestion.id] === answer.id ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                            {answer.text}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex justify-between items-center mt-6 pl-11">
                      <button
                        onClick={goToPreviousQuestion}
                        disabled={isFirstQuestion}
                        className={`px-4 py-2 rounded-md transition ${
                          isFirstQuestion 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        ← Câu trước
                      </button>

                      <span className="text-sm text-gray-600">
                        Câu {currentQuestionIndex + 2} / {visibleQuestions.length + 1}
                      </span>

                      {!isLastQuestion ? (
                        <button
                          onClick={goToNextQuestion}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                          Câu tiếp → 
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (validateAllAnswered()) {
                              // Scroll to submit button
                              const submitButton = document.getElementById('submit-button');
                              if (submitButton) {
                                submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                        >
                          Hoàn thành →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Courses Preview (nếu có) */}
              {showCourseRecommendations && recommendedCourses.length > 0 && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="text-lg font-semibold text-green-800">Khóa học được đề xuất</h3>
                  </div>
                  <p className="text-green-700 text-sm mb-4">
                    Dựa trên kết quả đánh giá của bạn, hệ thống đề xuất các khóa học phù hợp:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedCourses.map((course) => (
                      <div key={course.id} className="bg-white border border-green-200 rounded-md p-4 hover:shadow-sm transition-shadow">
                        <h4 className="font-medium text-gray-900 mb-2">{course.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {course.targetAgeGroup}
                          </span>
                          <button 
                            onClick={() => navigate(`/courses/${course.id}`)}
                            className="text-sm text-green-600 hover:text-green-800 font-medium hover:underline"
                          >
                            Xem chi tiết →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  id="submit-button"
                  onClick={handleSubmit}
                  disabled={submitting || questions.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex-1 sm:flex-none disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
