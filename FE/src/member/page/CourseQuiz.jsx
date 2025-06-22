import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';

function CourseQuiz() {
  const [selected, setSelected] = useState({});
  const [course, setCourse] = useState(null);
  const [quizList, setQuizList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const courseId = localStorage.getItem('course_id');
    if (!courseId) return;

    // 🔧 FIXED: Corrected endpoint to 'courses' (plural)
    api.get(`courses/${courseId}`)
      .then(res => setCourse(res.data))
      .catch(err => console.error('Failed to fetch course:', err));

    api.get(`quiz/course/${courseId}`)
      .then(res => {
        const parsed = res.data.map(q => ({
          ...q,
          answer: Array.isArray(q.answer) ? q.answer : JSON.parse(q.answer || '[]'),
        }));
        setQuizList(parsed);
      })
      .catch(err => console.error('Failed to fetch quiz:', err));
  }, []);

  const handleSelect = (quizId, idx) => {
    setSelected(prev => ({ ...prev, [quizId]: idx }));
  };

const handleSubmit = async () => {
  const correctCount = quizList.reduce((acc, quiz) => {
    return selected[quiz.id] === quiz.correct ? acc + 1 : acc;
  }, 0);

  const courseId = localStorage.getItem('course_id');
  if (!courseId) {
    alert("Course information is missing. Please try again.");
    return;
  }

  try {
    const userRes = await api.get('profile');
    const userId = userRes.data?.userId;

    if (!userId) {
      alert("Failed to identify user.");
      return;
    }

    const payload = {
      score: correctCount,
      totalQuestions: quizList.length,
      user: { id: userId },
      course: { id: Number(courseId) },
    };

    const resultRes = await api.post('quiz-result', payload);
    const resultId = resultRes.data?.id;

    if (resultId) {
      navigate(`/quiz-result/${resultId}`);
    } else {
      alert("Quiz submitted, but no result ID returned.");
    }
  } catch (err) {
    console.error('Error during quiz submission:', err);
    alert("There was an error submitting your quiz.");
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-100 to-white py-10 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-semibold text-cyan-700 mb-6">
          {course?.name?.toUpperCase() || "Loading course..."}
        </h2>
        <p className="mb-8 text-gray-700">
          Check your understanding of vocabulary before starting this course.
        </p>

        {quizList.map(quiz => (
          <div key={quiz.id} className="mb-10 text-left">
            <h3 className="text-xl font-bold text-center mb-4">{quiz.question}</h3>
            <form className="flex flex-col gap-4 items-start max-w-2xl mx-auto">
              {quiz.answer.map((ans, idx) => (
                <label key={idx} className="flex items-center gap-3 text-lg cursor-pointer">
                  <input
                    type="radio"
                    name={`quiz_${quiz.id}`}
                    checked={selected[quiz.id] === idx}
                    onChange={() => handleSelect(quiz.id, idx)}
                    className="accent-cyan-600"
                  />
                  <span>{`${String.fromCharCode(65 + idx)}. ${ans}`}</span>
                </label>
              ))}
            </form>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={quizList.length === 0 || Object.keys(selected).length !== quizList.length}
          className="mt-10 px-10 py-3 text-xl font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded disabled:opacity-50"
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
}

export default CourseQuiz;