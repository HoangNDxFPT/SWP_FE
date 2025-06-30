import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ASSESSMENT_TYPES = [
  { value: "ASSIST", label: "ASSIST" },
  { value: "CRAFFT", label: "CRAFFT" }
];

export default function AssessmentManage() {
  const [assessmentType, setAssessmentType] = useState('ASSIST');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState({
    assessmentType: 'ASSIST',
    questionText: '',
    questionOrder: 1,
    answers: []
  });
  const [currentAnswer, setCurrentAnswer] = useState({
    answerText: '',
    score: 0
  });
  const [editingAnswerIndex, setEditingAnswerIndex] = useState(null);

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showQuestionDetail, setShowQuestionDetail] = useState(false);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line
  }, [assessmentType]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const [questionsResponse, answersResponse] = await Promise.all([
        api.get('/admin/assessment-questions/not-deleted'),
        api.get('/admin/assessment-answers/not-deleted')
      ]);
      const filteredQuestions = questionsResponse.data.filter(
        question => question.assessmentType === assessmentType
      );
      const answersByQuestionId = {};
      answersResponse.data.forEach(answer => {
        const questionId = answer.question?.id;
        if (questionId) {
          if (!answersByQuestionId[questionId]) {
            answersByQuestionId[questionId] = [];
          }
          answersByQuestionId[questionId].push(answer);
        }
      });
      const questionsWithAnswers = filteredQuestions.map(question => ({
        ...question,
        answers: answersByQuestionId[question.id] || []
      }));
      setQuestions(questionsWithAnswers);
    } catch (error) {
      toast.error('Không thể tải câu hỏi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!currentQuestion.questionText?.trim()) {
      toast.error('Nội dung câu hỏi không được để trống');
      return;
    }
    if (currentQuestion.answers.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 đáp án');
      return;
    }
    try {
      setLoading(true);
      const questionData = {
        assessmentType: currentQuestion.assessmentType,
        questionText: currentQuestion.questionText,
        questionOrder: currentQuestion.questionOrder
      };
      const response = await api.post('/admin/assessment-questions', questionData);
      const newQuestionId = response.data.id;
      for (const answer of currentQuestion.answers) {
        await api.post('/admin/assessment-answers', {
          question: { id: newQuestionId },
          answerText: answer.answerText || answer.text,
          score: answer.score
        });
      }
      toast.success('Tạo câu hỏi thành công');
      setShowCreateModal(false);
      resetQuestionForm();
      fetchQuestions();
    } catch (error) {
      toast.error('Tạo câu hỏi thất bại');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!currentQuestion.questionText?.trim()) {
      toast.error('Nội dung câu hỏi không được để trống');
      return;
    }
    if (currentQuestion.answers.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 đáp án');
      return;
    }
    try {
      setLoading(true);
      const questionData = {
        id: currentQuestion.id,
        assessmentType: currentQuestion.assessmentType,
        questionText: currentQuestion.questionText,
        questionOrder: currentQuestion.questionOrder
      };
      await api.put(`/admin/assessment-questions/${currentQuestion.id}`, questionData);
      const answersData = currentQuestion.answers.map(answer => ({
        id: answer.id || null,
        question: { id: currentQuestion.id },
        answerText: answer.answerText || answer.text,
        score: answer.score
      }));
      await api.put(`/admin/assessment-answers/questions/${currentQuestion.id}/answers`, answersData);
      toast.success('Cập nhật thành công');
      setShowEditModal(false);
      resetQuestionForm();
      fetchQuestions();
    } catch (error) {
      toast.error('Cập nhật thất bại');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      try {
        setLoading(true);
        await api.delete(`/admin/assessment-questions/${id}`);
        toast.success('Đã xóa câu hỏi');
        fetchQuestions();
      } catch (error) {
        toast.error('Xóa thất bại');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (window.confirm('Bạn có chắc muốn xóa đáp án này?')) {
      try {
        setLoading(true);
        await api.delete(`/admin/assessment-answers/${answerId}`);
        const updatedAnswers = currentQuestion.answers.filter(
          answer => answer.id !== answerId
        );
        setCurrentQuestion({
          ...currentQuestion,
          answers: updatedAnswers
        });
        toast.success('Đã xóa đáp án');
      } catch (error) {
        toast.error('Xóa đáp án thất bại');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const openEditModal = async (question) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/assessment-questions/${question.id}`);
      if (!response || !response.data) throw new Error("Không lấy được dữ liệu");
      const answersResponse = await api.get(`/admin/assessment-answers/not-deleted?question.id=${question.id}`);
      const answers = answersResponse.data.filter(answer =>
        answer.question && answer.question.id === question.id
      ) || [];
      const questionData = { ...response.data, answers: answers };
      setCurrentQuestion(questionData);
      setShowEditModal(true);
    } catch (error) {
      toast.error('Không thể tải chi tiết câu hỏi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnswer = () => {
    if (!(currentAnswer.answerText || currentAnswer.text)?.trim()) {
      toast.error('Nội dung đáp án không được để trống');
      return;
    }
    const updatedAnswers = [...currentQuestion.answers];
    if (editingAnswerIndex !== null) {
      updatedAnswers[editingAnswerIndex] = currentAnswer;
    } else {
      updatedAnswers.push(currentAnswer);
    }
    setCurrentQuestion({
      ...currentQuestion,
      answers: updatedAnswers
    });
    setShowAnswerModal(false);
    setCurrentAnswer({ answerText: '', text: '', score: 0 });
    setEditingAnswerIndex(null);
  };

  const handleEditAnswer = (index) => {
    setCurrentAnswer({ ...currentQuestion.answers[index] });
    setEditingAnswerIndex(index);
    setShowAnswerModal(true);
  };

  const handleRemoveAnswer = (index) => {
    const updatedAnswers = [...currentQuestion.answers];
    updatedAnswers.splice(index, 1);
    setCurrentQuestion({
      ...currentQuestion,
      answers: updatedAnswers
    });
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      assessmentType: assessmentType,
      questionText: '',
      questionOrder: 1,
      answers: []
    });
  };

  return (
    <div className="container mx-auto px-4 pb-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-3xl font-bold mb-8 text-blue-900 text-center">Quản lý câu hỏi đánh giá</h1>

      {/* Bộ lọc và nút thêm */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <label className="text-base font-medium">Loại đánh giá:</label>
          <select
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value)}
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ASSESSMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center shadow"
          onClick={() => {
            resetQuestionForm();
            setShowCreateModal(true);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Thêm câu hỏi
        </button>
      </div>

      {/* Bảng câu hỏi */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có câu hỏi nào cho loại đánh giá này.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-blue-900">
              <tr>
                <th className="w-[5%] px-4 py-2 text-left text-xs font-semibold text-white">ID</th>
                <th className="w-[50%] px-4 py-2 text-left text-xs font-semibold text-white">Nội dung câu hỏi</th>
                <th className="w-[30%] px-4 py-2 text-left text-xs font-semibold text-white">Đáp án</th>
                <th className="w-[15%] px-4 py-2 text-left text-xs font-semibold text-white">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map((question) => (
                <tr key={question.id} className="hover:bg-blue-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{question.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="max-h-20 overflow-y-auto break-words">
                      {question.questionText.length > 60
                        ? `${question.questionText.substring(0, 60)}... `
                        : question.questionText}
                      {question.questionText.length > 60 && (
                        <button
                          className="text-blue-500 hover:underline ml-1 text-xs"
                          onClick={() => {
                            setSelectedQuestion(question);
                            setShowQuestionDetail(true);
                          }}
                        >
                          Xem đầy đủ
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {question.answers && question.answers.length > 0 ? (
                      <>
                        <ul className="list-disc list-inside space-y-1">
                          {question.answers.slice(0, 1).map((answer) => (
                            <li key={answer.id}>
                              <span className="font-medium">
                                {(answer.answerText || answer.text)?.length > 30
                                  ? `${(answer.answerText || answer.text)?.substring(0, 30)}...`
                                  : answer.answerText || answer.text}
                              </span>
                              <span className="text-blue-600 ml-1">(Điểm: {answer.score})</span>
                            </li>
                          ))}
                        </ul>
                        {question.answers.length > 2 && (
                          <button
                            className="text-blue-500 text-xs mt-1 flex items-center"
                            onClick={() => {
                              setSelectedQuestion(question);
                              setShowQuestionDetail(true);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Xem tất cả {question.answers.length} đáp án
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400 italic">Chưa có đáp án</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(question)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal tạo câu hỏi */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold">Thêm câu hỏi mới</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung câu hỏi <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  value={currentQuestion.questionText}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại đánh giá <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={currentQuestion.assessmentType}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, assessmentType: e.target.value })}
                >
                  {ASSESSMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thứ tự <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={currentQuestion.questionOrder}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionOrder: parseInt(e.target.value) || 1 })}
                  placeholder="Nhập thứ tự"
                  min="1"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Đáp án <span className="text-red-500">*</span>
                  </label>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center"
                    onClick={() => {
                      setCurrentAnswer({ answerText: '', score: 0 });
                      setEditingAnswerIndex(null);
                      setShowAnswerModal(true);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Thêm đáp án
                  </button>
                </div>
                {currentQuestion.answers.length === 0 ? (
                  <p className="text-sm text-gray-500 py-1.5">Chưa có đáp án nào</p>
                ) : (
                  <div className="bg-gray-50 rounded p-2 space-y-1.5">
                    {currentQuestion.answers.map((answer, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-1.5 last:border-b-0 last:pb-0">
                        <div>
                          <p className="font-medium text-sm">{answer.answerText || answer.text}</p>
                          <p className="text-xs text-blue-600">Điểm: {answer.score}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            onClick={() => handleEditAnswer(index)}
                          >
                            Sửa
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 text-xs"
                            onClick={() => handleRemoveAnswer(index)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1.5 rounded"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                  onClick={handleCreateQuestion}
                  disabled={loading}
                >
                  {loading ? 'Đang tạo...' : 'Tạo câu hỏi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa câu hỏi */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold">Sửa câu hỏi</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung câu hỏi <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                  value={currentQuestion.questionText}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại đánh giá <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={currentQuestion.assessmentType}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, assessmentType: e.target.value })}
                >
                  {ASSESSMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thứ tự <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={currentQuestion.questionOrder}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionOrder: parseInt(e.target.value) || 1 })}
                  placeholder="Nhập thứ tự"
                  min="1"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Đáp án <span className="text-red-500">*</span>
                  </label>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center"
                    onClick={() => {
                      setCurrentAnswer({ answerText: '', score: 0 });
                      setEditingAnswerIndex(null);
                      setShowAnswerModal(true);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Thêm đáp án
                  </button>
                </div>
                {currentQuestion.answers.length === 0 ? (
                  <p className="text-sm text-gray-500 py-1.5">Chưa có đáp án nào</p>
                ) : (
                  <div className="bg-gray-50 rounded p-2 space-y-1.5">
                    {currentQuestion.answers.map((answer, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-1.5 last:border-b-0 last:pb-0">
                        <div>
                          <p className="font-medium text-sm">{answer.answerText || answer.text}</p>
                          <p className="text-xs text-blue-600">Điểm: {answer.score}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            onClick={() => handleEditAnswer(index)}
                          >
                            Sửa
                          </button>
                          {answer.id ? (
                            <button
                              className="text-red-600 hover:text-red-800 text-xs"
                              onClick={() => handleDeleteAnswer(answer.id)}
                            >
                              Xóa
                            </button>
                          ) : (
                            <button
                              className="text-red-600 hover:text-red-800 text-xs"
                              onClick={() => handleRemoveAnswer(index)}
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1.5 rounded"
                  onClick={() => setShowEditModal(false)}
                >
                  Hủy
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                  onClick={handleUpdateQuestion}
                  disabled={loading}
                >
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal đáp án */}
      {showAnswerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold">
                {editingAnswerIndex !== null ? 'Sửa đáp án' : 'Thêm đáp án'}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAnswerModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung đáp án <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={currentAnswer.answerText || currentAnswer.text || ''}
                  onChange={(e) => setCurrentAnswer({
                    ...currentAnswer,
                    answerText: e.target.value,
                    text: e.target.value
                  })}
                  placeholder="Nhập nội dung đáp án"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={currentAnswer.score}
                  onChange={(e) => setCurrentAnswer({
                    ...currentAnswer,
                    score: parseInt(e.target.value) || 0
                  })}
                  placeholder="Nhập điểm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Điểm này sẽ dùng để tính kết quả đánh giá
                </p>
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1.5 rounded"
                  onClick={() => setShowAnswerModal(false)}
                >
                  Hủy
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                  onClick={handleAddAnswer}
                >
                  {editingAnswerIndex !== null ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết câu hỏi */}
      {showQuestionDetail && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Chi tiết câu hỏi</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowQuestionDetail(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Nội dung:</h4>
                <p className="text-gray-900 border-l-4 border-blue-500 pl-2 py-1.5 bg-blue-50 rounded">
                  {selectedQuestion.questionText}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Đáp án ({selectedQuestion.answers?.length || 0}):
                </h4>
                {selectedQuestion.answers && selectedQuestion.answers.length > 0 ? (
                  <div className="bg-gray-50 rounded p-2 space-y-1.5">
                    {selectedQuestion.answers.map((answer, index) => (
                      <div key={answer.id || index} className="border-b border-gray-200 pb-1.5 last:border-b-0 last:pb-0">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{answer.answerText || answer.text}</p>
                            <p className="text-xs text-blue-600">Điểm: {answer.score}</p>
                          </div>
                          <div className="text-xs text-gray-500">#{index + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Chưa có đáp án cho câu hỏi này</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                onClick={() => setShowQuestionDetail(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
