import React, { useEffect, useState } from 'react';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Assist() {
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [unansweredQuestions, setUnansweredQuestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const startAssessment = async () => {
      try {
        const res = await api.post('/assessments/start?type=ASSIST');
        if (res.status === 200) {
          setAssessment(res.data);
        }
      } catch (err) {
        console.error('Failed to start assessment:', err);
        toast.error('Không thể tải câu hỏi');
      } finally {
        setLoading(false);
      }
    };

    startAssessment();
  }, []);

  const handleAnswerChange = (questionId, answerId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId,
    }));
    setUnansweredQuestions(prev => prev.filter(id => id !== questionId));
  };

  const validateAllQuestionsAnswered = () => {
    if (!assessment) return false;

    const unanswered = assessment.questions
      .filter(q => !answers[q.id])
      .map(q => q.id);

    setUnansweredQuestions(unanswered);

    if (unanswered.length > 0) {
      toast.error('Vui lòng trả lời tất cả các câu hỏi!');

      const firstUnansweredElement = document.getElementById(`question-${unanswered[0]}`);
      if (firstUnansweredElement) {
        firstUnansweredElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    if (!validateAllQuestionsAnswered()) {
      return;
    }

    const payload = Object.keys(answers).map(questionId => ({
      questionId: parseInt(questionId),
      answerId: answers[questionId],
    }));

    try {
      const res = await api.post(`assessments/submit?assessmentId=${assessment.assessmentId}`, payload);
      if (res.status === 200) {
        toast.success('Gửi câu trả lời thành công!');
        navigate(`/assessment-result/${res.data.assessmentResultId}`);
      } else {
        toast.error('Gửi thất bại!');
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Có lỗi khi gửi câu trả lời!');
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Đang tải câu hỏi...</div>;
  }

  if (!assessment) {
    return <div className="text-center mt-10 text-red-500">Không có dữ liệu.</div>;
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Đánh giá: {assessment.type}</h1>

        {unansweredQuestions.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Bạn còn {unansweredQuestions.length} câu chưa trả lời!
            </p>
          </div>
        )}

        {assessment.questions.map((question, index) => {
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
                } rounded-full mr-2 shrink-0 font-semibold`}>
                  {index + 1}
                </span>
                <span>{question.questionText}</span>
                {isUnanswered && (
                  <span className="ml-2 text-yellow-600 text-sm font-normal">
                    (Chưa trả lời)
                  </span>
                )}
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
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center justify-center"
        >
          <span>Gửi câu trả lời</span>
          {unansweredQuestions.length > 0 && (
            <span className="ml-2 bg-white text-blue-500 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
              {unansweredQuestions.length}
            </span>
          )}
        </button>
      </div>
      <Footer />
    </>
  );
}

export default Assist;
