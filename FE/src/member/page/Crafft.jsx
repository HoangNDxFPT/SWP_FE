import React, { useEffect, useState } from 'react';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Crafft() {
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const startAssessment = async () => {
      try {
        const res = await api.post('/assessments/start?type=CRAFFT');
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
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    const payload = Object.keys(answers).map(questionId => ({
      questionId: parseInt(questionId),
      answerId: answers[questionId],
    }));

    try {
      const res = await api.post(`/assessments/submit?assessmentId=${assessment.assessmentId}`, payload);
      if (res.status === 200) {
        toast.success('Gửi câu trả lời thành công!');
        console.log('Submit response:', res.data);
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
        {assessment.questions.map(question => (
          <div key={question.id} className="mb-6">
            <div className="font-semibold mb-2">{question.questionText}</div>
            <div className="flex flex-col gap-2">
              {question.answers.map(answer => (
                <label key={answer.id} className="flex items-center gap-2">
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
        ))}

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

export default Crafft;
