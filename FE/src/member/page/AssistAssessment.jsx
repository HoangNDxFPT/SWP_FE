import React, { useEffect, useState, useMemo } from 'react';
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
    console.log('Answer changed:', { questionId, answerId });
    
    setAnswers(prev => {
      const newAnswers = { ...prev };
      
      // Handle injection question specially
      const currentQ = visibleQuestions.find(q => q.id === questionId);
      if (currentQ && currentQ.isInjectionQuestion) {
        newAnswers['injection-question'] = answerId;
      } else {
        newAnswers[questionId] = answerId;
      }
      
      console.log('Updated answers:', newAnswers);
      return newAnswers;
    });
  };

  // Update getCurrentAnswer to handle injection question
  const getCurrentAnswer = () => {
    if (!currentQuestion) return null;
    
    // For injection question, use special key
    if (currentQuestion.isInjectionQuestion) {
      return answers['injection-question'] || null;
    }
    
    // For substance questions, use normal key
    return answers[currentQuestion.id] || null;
  };

  const validateAllAnswered = () => {
    const unanswered = visibleQuestions.filter(q => {
      // For injection question, check special key
      if (q.isInjectionQuestion) {
        return !answers['injection-question'];
      }
      // For regular questions, check normal key
      return !answers[q.id];
    }).map(q => ({
      id: q.id,
      questionText: q.questionText,
      substanceName: q.substanceName
    }));

    setUnansweredQuestions(unanswered.map(q => q.id));

    if (unanswered.length > 0) {
      toast.error(`Vui lòng trả lời tất cả ${unanswered.length} câu hỏi còn lại!`);
      console.log('Unanswered questions:', unanswered);
      
      // Scroll to first unanswered question
      const firstUnansweredIndex = visibleQuestions.findIndex(q => 
        q.isInjectionQuestion ? !answers['injection-question'] : !answers[q.id]
      );
      if (firstUnansweredIndex !== -1) {
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Prepare submission data
      const substanceAssessments = selectedSubstances.map(substanceId => {
        const substanceAnswers = [];
        
        // Get Q2-Q7 answers for this substance
        for (let qNum = 2; qNum <= 7; qNum++) {
          const questionId = `${qNum}-${substanceId}`;
          const answerId = answers[questionId];
          
          if (answerId) {
            // Skip Q3-Q5 if Q2 is "Never" - let backend handle this
            substanceAnswers.push(parseInt(answerId));
          }
        }
        
        return {
          substanceId: substanceId,
          answerIds: substanceAnswers
        };
      });
      
      // Add injection question answer if available
      const injectionAnswer = answers['injection-question'];
      if (injectionAnswer) {
        // Add injection answer to submission - backend will handle this separately
        // This might need adjustment based on how backend expects injection answers
      }
      
      const submissionData = {
        substanceAssessments: substanceAssessments
      };
      
      console.log('Submitting:', submissionData);
      
      const response = await api.post('/assessments/submit-assist', submissionData);
      
      if (response.data && response.data.assessmentResultId) {
        toast.success('Đánh giá đã được hoàn thành!');
        navigate(`/assessment-result/${response.data.assessmentResultId}`);
      }
      
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Có lỗi xảy ra khi nộp bài đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if Q2 answer is "Never" (score = 0) to determine which questions to skip
  const shouldSkipQuestions345 = (substanceId) => {
    const q2Answer = answers[`2-${substanceId}`];
    if (!q2Answer) return false;
    
    // Find the answer option in questions data
    const q2Question = questions.find(q => q.id === `2-${substanceId}`);
    const q2AnswerOption = q2Question?.answers.find(a => a.id === parseInt(q2Answer));
    
    // Skip 3-4-5 if answer contains "never" (score = 0, không sử dụng trong 3 tháng qua)
    return q2AnswerOption?.text?.toLowerCase().includes('không lần nào') || 
           q2AnswerOption?.text?.toLowerCase().includes('không bao giờ');
  };

  // Get visible questions (excluding skipped ones)
  const visibleQuestions = useMemo(() => {
    console.log('🔍 Calculating visible questions...');
    console.log('All questions:', questions);
    console.log('Current answers:', answers);
    
    return questions.filter(q => {
      console.log(`Checking question ${q.originalId} for substance ${q.substanceId}`);
      
      // Always show injection question (Q8) - it's independent of any substance
      if (q.isInjectionQuestion || q.originalId === 8) {
        console.log(`✅ Showing injection question ${q.originalId}`);
        return true;
      }
      
      // For substance questions (Q2-Q7)
      if (q.substanceId) {
        // Get Q2 answer for this substance
        const q2Answer = answers[`2-${q.substanceId}`];
        console.log(`Q2 answer for substance ${q.substanceId}:`, q2Answer);
        
        if (!q2Answer) {
          console.log(`✅ Showing question ${q.originalId} (no Q2 answer yet)`);
          return true; // Show all questions if Q2 not answered yet
        }
        
        // Find Q2 for this substance to check the answer score
        const q2Question = questions.find(qs => qs.originalId === 2 && qs.substanceId === q.substanceId);
        const q2AnswerOption = q2Question?.answers?.find(a => a.id === parseInt(q2Answer));
        console.log(`Q2 answer option:`, q2AnswerOption);
        
        // Check if Q2 is "Never" (score = 0) - we need to get score from API or assume based on text
        const isQ2Never = q2AnswerOption?.text?.toLowerCase().includes('không lần nào');
        console.log(`Q2 is Never: ${isQ2Never}`);
        
        // Skip questions 3-4-5 if Q2 is "Never"
        if (q.originalId >= 3 && q.originalId <= 5) {
          const shouldShow = !isQ2Never;
          console.log(`Question ${q.originalId}: shouldShow = ${shouldShow} (isQ2Never: ${isQ2Never})`);
          return shouldShow;
        }
        
        // Always show questions 2, 6, 7
        if (q.originalId === 2 || q.originalId === 6 || q.originalId === 7) {
          console.log(`✅ Showing question ${q.originalId} (always show)`);
          return true;
        }
      }
      
      console.log(`✅ Showing question ${q.originalId} (default)`);
      return true;
    });
  }, [questions, answers]);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Đang tải bộ câu hỏi ASSIST</h2>
            <p className="text-gray-600 mb-2">Vui lòng đợi trong giây lát</p>
            <p className="text-sm text-gray-500">Hệ thống đang chuẩn bị các câu hỏi chuyên nghiệp từ WHO</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Bộ câu hỏi đánh giá <span className="text-blue-200">ASSIST</span>
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Công cụ sàng lọc chuyên nghiệp được phát triển bởi <strong>Tổ chức Y tế Thế giới (WHO)</strong> 
                để đánh giá mức độ rủi ro liên quan đến việc sử dụng các chất gây nghiện
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Khoa học & Chính xác
                </div>
                <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Bảo mật & Riêng tư
                </div>
                <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Kết quả Tức thì
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Step 1: Substance Selection */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-white">Chọn các chất bạn đã từng sử dụng</h2>
                  <p className="text-blue-100 mt-1">Trong suốt cuộc đời, kể cả chỉ một lần (có thể chọn nhiều đáp án)</p>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {substances.map(substance => (
                  <label 
                    key={substance.id} 
                    className={`group relative flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md
                      ${selectedSubstances.includes(substance.id) 
                        ? 'border-blue-400 bg-blue-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`
                    }
                  >
                    {/* Custom Checkbox */}
                    <div className={`flex-shrink-0 w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200
                      ${selectedSubstances.includes(substance.id) 
                        ? 'border-blue-500 bg-blue-500 shadow-sm' 
                        : 'border-gray-300 group-hover:border-gray-400'}`
                      }
                    >
                      {selectedSubstances.includes(substance.id) && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-base leading-tight transition-colors
                        ${selectedSubstances.includes(substance.id) ? 'text-blue-900' : 'text-gray-900 group-hover:text-gray-700'}`}>
                        {substance.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {substance.description}
                      </p>
                    </div>

                    {/* Selection Indicator */}
                    {selectedSubstances.includes(substance.id) && (
                      <div className="absolute top-3 right-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </label>
                ))}
              </div>

              {/* Continue Button */}
              {selectedSubstances.length > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center text-blue-800">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Đã chọn {selectedSubstances.length} chất</span>
                  </div>
                  <button
                    onClick={loadQuestionsForSubstances}
                    disabled={loadingQuestions}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                  >
                    {loadingQuestions ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang tải câu hỏi...
                      </>
                    ) : (
                      <>
                        Bắt đầu đánh giá
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Assessment Information Panel */}
          {questions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold text-white">Thông tin thang điểm ASSIST</h2>
                    <p className="text-purple-100 mt-1">Hiểu rõ cách đánh giá và phân loại mức độ rủi ro</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Important Note */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-5 rounded-r-xl">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-blue-900">Cách tính điểm</h3>
                      <p className="text-blue-800 mt-1">
                        Mỗi chất sẽ có điểm riêng. Mức độ rủi ro tổng thể sẽ được xác định dựa trên 
                        <span className="font-semibold"> điểm cao nhất</span> trong số các chất bạn đã chọn.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Levels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className="ml-3 text-lg font-bold text-green-800">Rủi ro thấp</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-green-700 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Sử dụng ở mức độ thấp
                      </p>
                      <p className="text-sm text-green-700 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Tự theo dõi và giảm thiểu
                      </p>
                    </div>
                  </div>

                  <div className="group bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border-2 border-yellow-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className="ml-3 text-lg font-bold text-yellow-800">Rủi ro trung bình</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-yellow-700 flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Có dấu hiệu sử dụng có hại
                      </p>
                      <p className="text-sm text-yellow-700 flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Can thiệp ngắn hạn
                      </p>
                    </div>
                  </div>

                  <div className="group bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border-2 border-red-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a1 1 0 011 1v3a1 1 0 11-2 0V6a1 1 0 011-1zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className="ml-3 text-lg font-bold text-red-800">Rủi ro cao</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-red-700 flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Có thể đã phụ thuộc
                      </p>
                      <p className="text-sm text-red-700 flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Điều trị chuyên sâu
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500 p-5 rounded-r-xl">
                  <h4 className="text-base font-semibold text-indigo-900 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Lưu ý quan trọng
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm text-indigo-800">Đánh giá riêng cho từng chất đã chọn</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm text-indigo-800">Mức độ rủi ro dựa trên chất có điểm cao nhất</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm text-indigo-800">Kết quả kèm khuyến nghị cụ thể</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-sm text-indigo-800">Bảo mật thông tin cá nhân tuyệt đối</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Progress & Navigation */}
          {questions.length > 0 && (
            <>
              {/* Progress Section */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h2 className="text-xl font-semibold text-white">Tiến trình đánh giá</h2>
                        <p className="text-green-100 mt-1">Theo dõi quá trình hoàn thành bài đánh giá</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {visibleQuestions.filter(q => 
                          q.isInjectionQuestion ? !!answers['injection-question'] : !!answers[q.id]
                        ).length}/{visibleQuestions.length}
                      </div>
                      <div className="text-green-100 text-sm">câu hỏi</div>
                    </div>
                  </div>
                </div>

                {/* Progress Content */}
                <div className="p-6">
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">Tiến độ hoàn thành</span>
                      <span className="text-green-600 font-bold">
                        {visibleQuestions.length > 0 ? 
                          Math.round((visibleQuestions.filter(q => 
                            q.isInjectionQuestion ? !!answers['injection-question'] : !!answers[q.id]
                          ).length / visibleQuestions.length) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out" 
                        style={{ 
                          width: `${visibleQuestions.length > 0 ? 
                            (visibleQuestions.filter(q => 
                              q.isInjectionQuestion ? !!answers['injection-question'] : !!answers[q.id]
                            ).length / visibleQuestions.length) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Navigation Dots */}
                  <div className="flex justify-center mb-6">
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                      {visibleQuestions.map((question, index) => {
                        const isAnswered = question.isInjectionQuestion 
                          ? !!answers['injection-question']
                          : !!answers[question.id];
                        const isCurrent = index === currentQuestionIndex;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => goToQuestion(index)}
                            className={`w-4 h-4 rounded-full transition-all duration-200 relative group ${
                              isCurrent 
                                ? 'bg-blue-600 scale-125 shadow-lg' 
                                : isAnswered 
                                  ? 'bg-green-500 hover:bg-green-600 shadow-md' 
                                  : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                            title={`Câu hỏi ${question.isInjectionQuestion ? 'tiêm chích' : (question.questionOrder || question.originalId)}${isAnswered ? ' (Đã trả lời)' : ''}`}
                          >
                            {isCurrent && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Skip Logic Info */}
                  {questions.length > visibleQuestions.length && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-blue-800 font-medium">Đã tối ưu hóa câu hỏi</p>
                          <p className="text-blue-600 text-sm">
                            {shouldSkipQuestions345(selectedSubstances[0]) 
                              ? 'Ẩn câu 3-4-5 (vì trả lời "Không bao giờ" ở câu 2, chỉ làm Q2-Q6-Q7-Q8)' 
                              : 'Hiển thị tất cả câu hỏi phù hợp'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Unanswered Questions Alert */}
                  {unansweredQuestions.length > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-yellow-800 font-medium">Còn {unansweredQuestions.length} câu hỏi chưa trả lời</p>
                          <p className="text-yellow-600 text-sm">Vui lòng hoàn thành tất cả để nộp bài</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Question Display */}
              {currentQuestion && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                  {/* Question Header */}
                  <div className={`${
                    currentQuestion.isInjectionQuestion 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  } p-6`}>
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                        currentQuestion.isInjectionQuestion 
                          ? 'bg-white/20' 
                          : 'bg-white/20'
                      }`}>
                        {currentQuestion.isInjectionQuestion ? (
                          <span className="text-2xl">💉</span>
                        ) : (
                          <span className="text-white font-bold text-xl">
                            {currentQuestion.questionOrder || currentQuestion.originalId}
                          </span>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-xl font-semibold text-white leading-tight">
                          {currentQuestion.questionText}
                        </h3>
                        <div className={`mt-3 flex items-center gap-2 text-sm ${
                          currentQuestion.isInjectionQuestion ? 'text-orange-100' : 'text-blue-100'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            {currentQuestion.isInjectionQuestion ? (
                              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 712 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 712 0zM2 13a2 2 0 712-2h12a2 2 0 712 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 712 0z" clipRule="evenodd" />
                            )}
                          </svg>
                          <span className="font-medium">
                            {currentQuestion.isInjectionQuestion 
                              ? 'Câu hỏi chung về kim tiêm (không tính điểm cho chất cụ thể)'
                              : `Về chất: ${currentQuestion.substanceName}`
                            }
                          </span>
                          {!currentQuestion.isInjectionQuestion && currentQuestion.substanceDescription && (
                            <span className="text-xs opacity-75">
                              ({currentQuestion.substanceDescription})
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Question Counter */}
                      <div className="text-right text-white">
                        <div className="text-lg font-bold">
                          {currentQuestionIndex + 1}/{visibleQuestions.length}
                        </div>
                        <div className="text-xs opacity-75">câu hỏi</div>
                      </div>
                    </div>
                  </div>

                  {/* Answer Options */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {currentQuestion.answers.map(answer => (
                        <label 
                          key={answer.id} 
                          className={`group flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                            (currentQuestion.isInjectionQuestion 
                              ? answers['injection-question'] === answer.id
                              : answers[currentQuestion.id] === answer.id)
                              ? 'border-blue-400 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {/* Custom Radio Button */}
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            (currentQuestion.isInjectionQuestion 
                              ? answers['injection-question'] === answer.id
                              : answers[currentQuestion.id] === answer.id)
                              ? 'border-blue-500 bg-blue-500 shadow-sm' 
                              : 'border-gray-400 group-hover:border-gray-500'
                          }`}>
                            {(currentQuestion.isInjectionQuestion 
                              ? answers['injection-question'] === answer.id
                              : answers[currentQuestion.id] === answer.id) && (
                              <div className="w-3 h-3 rounded-full bg-white"></div>
                            )}
                          </div>
                          
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={answer.id}
                            checked={
                              currentQuestion.isInjectionQuestion 
                                ? answers['injection-question'] === answer.id
                                : answers[currentQuestion.id] === answer.id
                            }
                            onChange={() => handleAnswerChange(currentQuestion.id, answer.id)}
                            className="sr-only"
                          />
                          
                          {/* Answer Text */}
                          <span className={`text-base leading-relaxed transition-colors flex-1 ${
                            (currentQuestion.isInjectionQuestion 
                              ? answers['injection-question'] === answer.id
                              : answers[currentQuestion.id] === answer.id)
                              ? 'text-blue-900 font-medium' 
                              : 'text-gray-700 group-hover:text-gray-900'
                          }`}>
                            {answer.text}
                          </span>

                          {/* Selection Indicator */}
                          {(currentQuestion.isInjectionQuestion 
                            ? answers['injection-question'] === answer.id
                            : answers[currentQuestion.id] === answer.id) && (
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                      <button
                        onClick={goToPreviousQuestion}
                        disabled={isFirstQuestion}
                        className={`flex items-center px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
                          isFirstQuestion 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Câu trước
                      </button>

                      <div className="text-center">
                        <span className="text-sm text-gray-500">
                          Câu {currentQuestion.isInjectionQuestion ? 'tiêm chích' : (currentQuestion.questionOrder || currentQuestion.originalId)} 
                          trong tổng số {visibleQuestions.length + 1} câu
                        </span>
                      </div>

                      {!isLastQuestion ? (
                        <button
                          onClick={goToNextQuestion}
                          className="flex items-center px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                        >
                          Câu tiếp
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ) : (
                        <div></div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Course Recommendations */}
              {showCourseRecommendations && recommendedCourses.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h2 className="text-xl font-semibold text-white">Khóa học được đề xuất</h2>
                        <p className="text-green-100 mt-1">Dựa trên kết quả đánh giá của bạn</p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-green-800 text-sm">
                        <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Hệ thống đã phân tích kết quả và đề xuất các khóa học phù hợp để hỗ trợ bạn.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recommendedCourses.map((course) => (
                        <div key={course.id} className="group bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-2">{course.name}</h3>
                              <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                              </svg>
                              {course.targetAgeGroup}
                            </span>
                            <button 
                              onClick={() => navigate(`/courses/${course.id}`)}
                              className="flex items-center px-4 py-2 text-sm text-green-600 hover:text-white hover:bg-green-600 border border-green-600 rounded-xl font-medium transition-all duration-200 group-hover:shadow-md"
                            >
                              Xem chi tiết
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={() => navigate('/assessment')}
                      className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center"
                      disabled={submitting}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Quay lại
                    </button>
                    
                    <button
                      id="submit-button"
                      onClick={() => {
                        if (validateAllAnswered()) {
                          handleSubmit();
                        }
                      }}
                      disabled={submitting || questions.length === 0}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang xử lý kết quả...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Hoàn thành bài đánh giá
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Guidance when no substances selected */}
          {selectedSubstances.length === 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Bắt đầu đánh giá ASSIST</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Vui lòng chọn ít nhất một chất ở phần trên để bắt đầu bài đánh giá chuyên nghiệp của WHO.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AssistAssessment;
