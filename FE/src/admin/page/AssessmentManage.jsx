import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ASSESSMENT_TYPES = [
  { value: "ASSIST", label: "ASSIST Assessment" },
  { value: "CRAFFT", label: "CRAFFT Assessment" }
];

export default function AssessmentManage() {
  const [assessmentType, setAssessmentType] = useState('ASSIST');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const QUESTIONS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

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

  // Fetch questions when assessment type changes
  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line
  }, [assessmentType]);

  // Fetch questions using async/await pattern
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
  useEffect(() => {
    setCurrentPage(1);
  }, [assessmentType, questions.length]);

  // Tính toán danh sách câu hỏi hiển thị theo trang
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = questions.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE,
    currentPage * QUESTIONS_PER_PAGE
  );

  return (
    <div className="w-full transition-all duration-300">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Quản lý câu hỏi đánh giá
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Tạo và quản lý câu hỏi cho các bộ công cụ đánh giá tâm lý
        </p>
      </div>

      {/* Control Panel */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <span className="text-gray-700 mr-4">Loại đánh giá:</span>
          <div className="inline-flex rounded-md shadow-sm">
            {ASSESSMENT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setAssessmentType(type.value)}
                className={`px-5 py-2 text-sm ${assessmentType === type.value
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  } ${type.value === 'ASSIST'
                    ? 'rounded-l-md border border-gray-300'
                    : 'rounded-r-md border-t border-r border-b border-gray-300'
                  }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          onClick={() => {
            resetQuestionForm();
            setShowCreateModal(true);
          }}
        >
          <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Thêm câu hỏi mới
        </button>
      </div>

      {/* Questions List - Điều chỉnh grid columns dựa trên trạng thái sidebar */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : paginatedQuestions.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg px-4 py-6 md:px-6 md:py-8 text-center border border-gray-200">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="mt-4 text-xl font-medium text-gray-900">Không có câu hỏi nào</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Chưa có câu hỏi nào cho loại đánh giá này. Hãy thêm câu hỏi đầu tiên để bắt đầu.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                resetQuestionForm();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Thêm câu hỏi
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {paginatedQuestions.map((question, index) => (
            <div key={question.id} className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                    Câu hỏi #{index + 1}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      className="text-gray-400 hover:text-gray-600 p-1"
                      onClick={() => openEditModal(question)}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      className="text-red-400 hover:text-red-600 p-1"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {question.questionText}
                </h2>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Các đáp án ({question.answers?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {question.answers && question.answers.slice(0, 2).map((answer, idx) => (
                      <div
                        key={answer.id || idx}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                      >
                        <p className="text-sm text-gray-800 truncate">
                          {answer.answerText || answer.text}
                        </p>
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {answer.score} điểm
                        </span>
                      </div>
                    ))}
                    {question.answers && question.answers.length > 2 && (
                      <button
                        onClick={() => {
                          setSelectedQuestion(question);
                          setShowQuestionDetail(true);
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 inline-flex items-center"
                      >
                        <span>Xem tất cả {question.answers.length} đáp án</span>
                        <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  ID: {question.id}
                </div>
                <button
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  onClick={() => {
                    setSelectedQuestion(question);
                    setShowQuestionDetail(true);
                  }}
                >
                  Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-6">
          <button
            className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Trước
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              className={`px-3 py-1 rounded border ${currentPage === idx + 1 ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Sau
          </button>
        </div>
      )}

      {/* Modal tạo câu hỏi */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Thêm câu hỏi mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-4">
              {/* Question form fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung câu hỏi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={currentQuestion.questionText}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi..."
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại đánh giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentQuestion.assessmentType}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, assessmentType: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
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
                    value={currentQuestion.questionOrder}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionOrder: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  />
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-4 -mx-6 px-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-800">
                    Danh sách đáp án ({currentQuestion.answers.length})
                  </h3>
                  <button
                    onClick={() => {
                      setCurrentAnswer({ answerText: '', score: 0 });
                      setEditingAnswerIndex(null);
                      setShowAnswerModal(true);
                    }}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Thêm đáp án
                  </button>
                </div>

                {/* Answers list */}
                {currentQuestion.answers.length === 0 ? (
                  <div className="bg-gray-50 rounded-md text-center p-4">
                    <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có đáp án nào</h3>
                    <p className="mt-1 text-xs text-gray-500">Thêm ít nhất một đáp án để tiếp tục.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentQuestion.answers.map((answer, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100">
                        <div className="flex-1 pr-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{answer.answerText || answer.text}</span>
                            <span className="text-sm text-indigo-600 font-medium">{answer.score} điểm</span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditAnswer(index)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRemoveAnswer(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateQuestion}
                disabled={loading || !currentQuestion.questionText.trim() || currentQuestion.answers.length === 0}
                className={`px-4 py-1.5 rounded-md text-sm font-medium text-white ${loading || !currentQuestion.questionText.trim() || currentQuestion.answers.length === 0
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
              >
                {loading ? 'Đang tạo...' : 'Tạo câu hỏi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa câu hỏi */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Sửa câu hỏi</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form content identical to create modal */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung câu hỏi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={currentQuestion.questionText}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi..."
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại đánh giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentQuestion.assessmentType}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, assessmentType: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
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
                    value={currentQuestion.questionOrder}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionOrder: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                  />
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-4 -mx-6 px-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-800">
                    Danh sách đáp án ({currentQuestion.answers.length})
                  </h3>
                  <button
                    onClick={() => {
                      setCurrentAnswer({ answerText: '', score: 0 });
                      setEditingAnswerIndex(null);
                      setShowAnswerModal(true);
                    }}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Thêm đáp án
                  </button>
                </div>

                {/* Answers list */}
                {currentQuestion.answers.length === 0 ? (
                  <div className="bg-gray-50 rounded-md text-center p-4">
                    <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có đáp án nào</h3>
                    <p className="mt-1 text-xs text-gray-500">Thêm ít nhất một đáp án để tiếp tục.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentQuestion.answers.map((answer, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100">
                        <div className="flex-1 pr-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{answer.answerText || answer.text}</span>
                            <span className="text-sm text-indigo-600 font-medium">{answer.score} điểm</span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditAnswer(index)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => answer.id ? handleDeleteAnswer(answer.id) : handleRemoveAnswer(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateQuestion}
                disabled={loading || !currentQuestion.questionText.trim() || currentQuestion.answers.length === 0}
                className={`px-4 py-1.5 rounded-md text-sm font-medium text-white ${loading || !currentQuestion.questionText.trim() || currentQuestion.answers.length === 0
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm/sửa đáp án */}
      {showAnswerModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {editingAnswerIndex !== null ? 'Sửa đáp án' : 'Thêm đáp án'}
              </h3>
              <button
                onClick={() => setShowAnswerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung đáp án <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentAnswer.answerText || currentAnswer.text || ''}
                  onChange={(e) => setCurrentAnswer({
                    ...currentAnswer,
                    answerText: e.target.value,
                    text: e.target.value
                  })}
                  placeholder="Nhập nội dung đáp án..."
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm số <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={currentAnswer.score}
                    onChange={(e) => setCurrentAnswer({
                      ...currentAnswer,
                      score: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Điểm số này sẽ được dùng để tính toán kết quả đánh giá
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-2">
              <button
                onClick={() => setShowAnswerModal(false)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddAnswer}
                disabled={!(currentAnswer.answerText || currentAnswer.text)?.trim()}
                className={`px-4 py-1.5 rounded-md text-sm font-medium text-white ${!(currentAnswer.answerText || currentAnswer.text)?.trim()
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
              >
                {editingAnswerIndex !== null ? 'Cập nhật' : 'Thêm đáp án'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết câu hỏi */}
      {showQuestionDetail && selectedQuestion && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Chi tiết câu hỏi</h3>
              <button
                onClick={() => setShowQuestionDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 p-4 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium text-indigo-600 mb-1">
                      Câu hỏi #{selectedQuestion.questionOrder} | Loại: {selectedQuestion.assessmentType}
                    </div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedQuestion.questionText}
                    </h2>
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    ID: {selectedQuestion.id}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Danh sách đáp án ({selectedQuestion.answers?.length || 0})
                </h4>
                {selectedQuestion.answers && selectedQuestion.answers.length > 0 ? (
                  <div className="space-y-2 mt-3">
                    {selectedQuestion.answers.map((answer, index) => (
                      <div key={answer.id || index} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium mr-2">
                              {index + 1}
                            </span>
                            <span className="text-sm">{answer.answerText || answer.text}</span>
                          </div>
                          <span className="ml-2 px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {answer.score} điểm
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 text-center py-6 px-4 rounded-md">
                    <p className="text-gray-500">Không có đáp án nào cho câu hỏi này.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-between">
              <button
                onClick={() => {
                  setShowQuestionDetail(false);
                  openEditModal(selectedQuestion);
                }}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={() => setShowQuestionDetail(false)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
