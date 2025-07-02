import React, { useEffect, useState } from 'react';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

function Assessment() {
  const { type } = useParams(); // Lấy loại từ URL, ví dụ: /assessment/assist hoặc /assessment/crafft
  const assessmentType = type?.toUpperCase() || 'ASSIST'; // Mặc định là ASSIST nếu không có loại
  
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [unansweredQuestions, setUnansweredQuestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await api.post(`/assessments/start?type=${assessmentType}`);
        console.log(`${assessmentType} response:`, res.data);
        
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

    // Reset state khi chuyển loại assessment
    setQuestions([]);
    setAnswers({});
    setUnansweredQuestions([]);
    
    fetchQuestions();
  }, [assessmentType]);

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

    const payload = Object.keys(answers).map(questionId => ({
      questionId: parseInt(questionId),
      answerId: answers[questionId],
    }));

    try {
      console.log('Submitting payload:', payload);
      const res = await api.post(`/assessments/submit?type=${assessmentType}`, payload);
      
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
    }
  };

  // Hiển thị tiêu đề dựa trên loại
  const getAssessmentTitle = () => {
    switch (assessmentType) {
      case 'ASSIST':
        return 'Bộ câu hỏi ASSIST';
      case 'CRAFFT':
        return 'Bộ câu hỏi CRAFFT';
      default:
        return 'Bộ câu hỏi đánh giá';
    }
  };

  if (loading) return <div className="text-center mt-10">Đang tải câu hỏi...</div>;

  if (questions.length === 0) return <div className="text-center mt-10 text-red-500">Không có câu hỏi nào.</div>;

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">{getAssessmentTitle()}</h1>

        {unansweredQuestions.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">Bạn còn {unansweredQuestions.length} câu chưa trả lời!</p>
          </div>
        )}

        {questions.map((question, index) => {
          const isUnanswered = unansweredQuestions.includes(question.id);

          return (
            <div
              id={`question-${question.id}`}
              key={question.id}
              className={`mb-6 bg-white p-4 rounded-lg shadow-sm ${isUnanswered ? 'border-2 border-yellow-400' : ''}`}
            >
              <div className="font-semibold mb-2 flex items-start">
                <span className={`inline-flex justify-center items-center w-6 h-6 ${
                  isUnanswered ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                } rounded-full mr-2 font-semibold`}>
                  {index + 1}
                </span>
                <span>{question.questionText}</span>
              </div>

              <div className="flex flex-col gap-2 pl-8">
                {question.answers.map(answer => (
                  <label key={answer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded transition">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={answer.id}
                      checked={answers[question.id] === answer.id}
                      onChange={() => handleAnswerChange(question.id, answer.id)}
                    />
                    <span>{answer.text}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <button
          onClick={handleSubmit}
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Gửi câu trả lời
        </button>
      </div>
      <Footer />
    </>
  );
}

export default Assessment;