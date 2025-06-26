import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Constants
 */
const ASSESSMENT_TYPES = [
    { value: "ASSIST", label: "ASSIST" },
    { value: "CRAFFT", label: "CRAFFT" }
];

/**
 * Assessment Management Component
 */
export default function AssessmentManage() {
    // ===== STATE MANAGEMENT =====
    // Main state
    const [assessmentType, setAssessmentType] = useState('ASSIST');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal visibility state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAnswerModal, setShowAnswerModal] = useState(false);

    // Current data state
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

    // New states for question detail view
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [showQuestionDetail, setShowQuestionDetail] = useState(false);

    // ===== EFFECTS =====
    // Load questions when assessment type changes
    useEffect(() => {
        fetchQuestions();
    }, [assessmentType]);

    // ===== API FUNCTIONS =====
    /**
     * Fetch questions and their answers by assessment type
     */
    const fetchQuestions = async () => {
        try {
            setLoading(true);
            // Fetch both questions and answers in parallel for better performance
            const [questionsResponse, answersResponse] = await Promise.all([
                api.get('/admin/assessment-questions/not-deleted'),
                api.get('/admin/assessment-answers/not-deleted')
            ]);

            // Filter questions by selected assessment type
            const filteredQuestions = questionsResponse.data.filter(
                question => question.assessmentType === assessmentType
            );

            // Group answers by question ID for efficient matching
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

            // Combine questions with their answers
            const questionsWithAnswers = filteredQuestions.map(question => ({
                ...question,
                answers: answersByQuestionId[question.id] || []
            }));

            setQuestions(questionsWithAnswers);
        } catch (error) {
            toast.error('Failed to fetch assessment questions');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Creates a new question with its answers
     */
    const handleCreateQuestion = async () => {
        // Validate inputs
        if (!currentQuestion.questionText?.trim()) {
            toast.error('Question text cannot be empty');
            return;
        }

        if (currentQuestion.answers.length === 0) {
            toast.error('Please add at least one answer option');
            return;
        }

        try {
            setLoading(true);

            // Create question data object
            const questionData = {
                assessmentType: currentQuestion.assessmentType,
                questionText: currentQuestion.questionText,
                questionOrder: currentQuestion.questionOrder
            };

            // Send create question request
            const response = await api.post('/admin/assessment-questions', questionData);
            const newQuestionId = response.data.id;

            // Create all answer options for the new question
            for (const answer of currentQuestion.answers) {
                await api.post('/admin/assessment-answers', {
                    question: {
                        id: newQuestionId
                    },
                    answerText: answer.answerText || answer.text,
                    score: answer.score
                });
            }

            toast.success('Question created successfully');
            setShowCreateModal(false);
            resetQuestionForm();
            fetchQuestions();
        } catch (error) {
            toast.error('Failed to create question');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Updates an existing question and its answers
     */
    const handleUpdateQuestion = async () => {
        // Validate inputs
        if (!currentQuestion.questionText?.trim()) {
            toast.error('Question text cannot be empty');
            return;
        }

        if (currentQuestion.answers.length === 0) {
            toast.error('Please add at least one answer option');
            return;
        }

        try {
            setLoading(true);

            // Update question
            const questionData = {
                id: currentQuestion.id,
                assessmentType: currentQuestion.assessmentType,
                questionText: currentQuestion.questionText,
                questionOrder: currentQuestion.questionOrder
            };

            await api.put(`/admin/assessment-questions/${currentQuestion.id}`, questionData);

            // Prepare answer data for bulk update
            const answersData = currentQuestion.answers.map(answer => ({
                id: answer.id || null,
                question: {
                    id: currentQuestion.id
                },
                answerText: answer.answerText || answer.text,
                score: answer.score
            }));

            // Update all answers in one API call
            await api.put(`/admin/assessment-answers/questions/${currentQuestion.id}/answers`, answersData);

            toast.success('Question and answers updated successfully');
            setShowEditModal(false);
            resetQuestionForm();
            fetchQuestions();
        } catch (error) {
            toast.error('Failed to update question: ' + (error.message || "Unknown error"));
            console.error("Error updating question:", error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Deletes a question
     */
    const handleDeleteQuestion = async (id) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                setLoading(true);
                await api.delete(`/admin/assessment-questions/${id}`);
                toast.success('Question deleted successfully');
                fetchQuestions();
            } catch (error) {
                toast.error('Failed to delete question');
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
    };

    /**
     * Deletes an answer
     */
    const handleDeleteAnswer = async (answerId) => {
        if (window.confirm('Are you sure you want to delete this answer?')) {
            try {
                setLoading(true);
                await api.delete(`/admin/assessment-answers/${answerId}`);

                // Update UI after successful deletion
                const updatedAnswers = currentQuestion.answers.filter(
                    answer => answer.id !== answerId
                );

                setCurrentQuestion({
                    ...currentQuestion,
                    answers: updatedAnswers
                });

                toast.success('Answer deleted successfully');
            } catch (error) {
                toast.error('Failed to delete answer');
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
    };

    // ===== UI HANDLER FUNCTIONS =====
    /**
     * Opens edit modal and loads question details
     */
    const openEditModal = async (question) => {
        try {
            setLoading(true);
            
            // Fetch question details
            const response = await api.get(`/admin/assessment-questions/${question.id}`);

            if (!response || !response.data) {
                throw new Error("Invalid response from API");
            }

            // Fetch answers for this question using not-deleted filter
            const answersResponse = await api.get(`/admin/assessment-answers/not-deleted?question.id=${question.id}`);
            const answers = answersResponse.data.filter(answer => 
                answer.question && answer.question.id === question.id
            ) || [];

            // Prepare question data with answers
            const questionData = {
                ...response.data,
                answers: answers
            };

            setCurrentQuestion(questionData);
            setShowEditModal(true);
        } catch (error) {
            toast.error('Failed to load question details: ' + (error.message || "Unknown error"));
            console.error("Error loading question:", error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Adds a new answer or updates existing one
     */
    const handleAddAnswer = () => {
        if (!(currentAnswer.answerText || currentAnswer.text)?.trim()) {
            toast.error('Answer text cannot be empty');
            return;
        }

        const updatedAnswers = [...currentQuestion.answers];

        if (editingAnswerIndex !== null) {
            // Update existing answer
            updatedAnswers[editingAnswerIndex] = currentAnswer;
        } else {
            // Add new answer
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

    /**
     * Prepares for editing an answer
     */
    const handleEditAnswer = (index) => {
        setCurrentAnswer({ ...currentQuestion.answers[index] });
        setEditingAnswerIndex(index);
        setShowAnswerModal(true);
    };

    /**
     * Removes an answer from the UI (not from database)
     */
    const handleRemoveAnswer = (index) => {
        const updatedAnswers = [...currentQuestion.answers];
        updatedAnswers.splice(index, 1);
        setCurrentQuestion({
            ...currentQuestion,
            answers: updatedAnswers
        });
    };

    /**
     * Resets the question form to default values
     */
    const resetQuestionForm = () => {
        setCurrentQuestion({
            assessmentType: assessmentType,
            questionText: '',
            questionOrder: 1,
            answers: []
        });
    };

    // ===== COMPONENT RENDERING =====
    return (
        <div className="container mx-auto px-4 pb-6">
            <ToastContainer position="top-right" autoClose={3000} />
            <h1 className="text-2xl font-bold mb-5">Assessment Management</h1>

            {/* Assessment Type Selector and Add Question Button */}
            <div className="mb-5 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium">Assessment Type:</label>
                    <select
                        value={assessmentType}
                        onChange={(e) => setAssessmentType(e.target.value)}
                        className="border rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {ASSESSMENT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center"
                    onClick={() => {
                        resetQuestionForm();
                        setShowCreateModal(true);
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Question
                </button>
            </div>

            {/* Loading spinner, empty state, or data table */}
            {loading && !showCreateModal && !showEditModal ? (
                <div className="flex justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : questions.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-5 text-center">
                    <p className="text-gray-500">No questions found for {assessmentType} assessment.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 table-fixed">
                        <thead className="bg-blue-900">
                            <tr>
                                <th className="w-[5%] px-4 py-2 text-left text-xs font-semibold text-white">ID</th>
                                <th className="w-[55%] px-4 py-2 text-left text-xs font-semibold text-white">Question</th>
                                <th className="w-[25%] px-4 py-2 text-left text-xs font-semibold text-white">Answer Options</th>
                                <th className="w-[15%] px-4 py-2 text-left text-xs font-semibold text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {questions.map((question) => (
                                <tr key={question.id} className="hover:bg-blue-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{question.id}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        <div className="max-h-20 overflow-y-auto break-words">
                                            {question.questionText.length > 50 
                                                ? `${question.questionText.substring(0, 50)}... ` 
                                                : question.questionText}
                                            {question.questionText.length > 50 && (
                                                <button 
                                                    className="text-blue-500 hover:underline ml-1 text-xs"
                                                    onClick={() => {
                                                        setSelectedQuestion(question);
                                                        setShowQuestionDetail(true);
                                                    }}
                                                >
                                                    View full text
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {question.answers && question.answers.length > 0 ? (
                                            <>
                                                <div className="max-h-20 overflow-y-auto">
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {question.answers.slice(0,1).map((answer) => (
                                                            <li key={answer.id} className="mb-0.5">
                                                                <div className="inline-block">
                                                                    <span className="font-medium">
                                                                        {(answer.answerText || answer.text)?.length > 30 
                                                                            ? `${(answer.answerText || answer.text)?.substring(0, 30)}...` 
                                                                            : (answer.answerText || answer.text)}
                                                                    </span>
                                                                    <span className="text-blue-600 ml-1">(Score: {answer.score})</span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                
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
                                                        Show all {question.answers.length} answers
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-gray-400 italic">No answers</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openEditModal(question)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuestion(question.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Question Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xl font-bold">Add New Assessment Question</h2>
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
                                    Question Text <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full border rounded px-3 py-2"
                                    rows="3"
                                    value={currentQuestion.questionText}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                                    placeholder="Enter question text"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assessment Type <span className="text-red-500">*</span>
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
                                    Question Order <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="w-full border rounded px-3 py-2"
                                    value={currentQuestion.questionOrder}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionOrder: parseInt(e.target.value) || 1 })}
                                    placeholder="Enter question order"
                                    min="1"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Answer Options <span className="text-red-500">*</span>
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
                                        Add Answer
                                    </button>
                                </div>

                                {currentQuestion.answers.length === 0 ? (
                                    <p className="text-sm text-gray-500 py-1.5">No answers added yet</p>
                                ) : (
                                    <div className="bg-gray-50 rounded p-2 space-y-1.5">
                                        {currentQuestion.answers.map((answer, index) => (
                                            <div key={index} className="flex justify-between items-center border-b pb-1.5 last:border-b-0 last:pb-0">
                                                <div>
                                                    <p className="font-medium text-sm">{answer.answerText || answer.text}</p>
                                                    <p className="text-xs text-blue-600">Score: {answer.score}</p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                                        onClick={() => handleEditAnswer(index)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="text-red-600 hover:text-red-800 text-xs"
                                                        onClick={() => handleRemoveAnswer(index)}
                                                    >
                                                        Remove
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
                                    Cancel
                                </button>
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                                    onClick={handleCreateQuestion}
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Question'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Question Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xl font-bold">Edit Assessment Question</h2>
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
                                    Question Text <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full border rounded px-3 py-2"
                                    rows="3"
                                    value={currentQuestion.questionText}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                                    placeholder="Enter question text"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assessment Type <span className="text-red-500">*</span>
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
                                    Question Order <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="w-full border rounded px-3 py-2"
                                    value={currentQuestion.questionOrder}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionOrder: parseInt(e.target.value) || 1 })}
                                    placeholder="Enter question order"
                                    min="1"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Answer Options <span className="text-red-500">*</span>
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
                                        Add Answer
                                    </button>
                                </div>

                                {currentQuestion.answers.length === 0 ? (
                                    <p className="text-sm text-gray-500 py-1.5">No answers added yet</p>
                                ) : (
                                    <div className="bg-gray-50 rounded p-2 space-y-1.5">
                                        {currentQuestion.answers.map((answer, index) => (
                                            <div key={index} className="flex justify-between items-center border-b pb-1.5 last:border-b-0 last:pb-0">
                                                <div>
                                                    <p className="font-medium text-sm">{answer.answerText || answer.text}</p>
                                                    <p className="text-xs text-blue-600">Score: {answer.score}</p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                                        onClick={() => handleEditAnswer(index)}
                                                    >
                                                        Edit
                                                    </button>
                                                    {answer.id ? (
                                                        <button
                                                            className="text-red-600 hover:text-red-800 text-xs"
                                                            onClick={() => handleDeleteAnswer(answer.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="text-red-600 hover:text-red-800 text-xs"
                                                            onClick={() => handleRemoveAnswer(index)}
                                                        >
                                                            Remove
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
                                    Cancel
                                </button>
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                                    onClick={handleUpdateQuestion}
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Question'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Answer Modal */}
            {showAnswerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-md">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-xl font-bold">
                                {editingAnswerIndex !== null ? 'Edit Answer' : 'Add Answer'}
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
                                    Answer Text <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={currentAnswer.answerText || currentAnswer.text || ''}
                                    onChange={(e) => setCurrentAnswer({
                                        ...currentAnswer,
                                        answerText: e.target.value,
                                        text: e.target.value // Giữ cả hai để đảm bảo tương thích
                                    })}
                                    placeholder="Enter answer text"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Score <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="w-full border rounded px-3 py-2"
                                    value={currentAnswer.score}
                                    onChange={(e) => setCurrentAnswer({ 
                                        ...currentAnswer, 
                                        score: parseInt(e.target.value) || 0 
                                    })}
                                    placeholder="Enter score value"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    This score will be used to calculate assessment results
                                </p>
                            </div>

                            <div className="flex justify-end space-x-2 pt-3">
                                <button
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1.5 rounded"
                                    onClick={() => setShowAnswerModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                                    onClick={handleAddAnswer}
                                >
                                    {editingAnswerIndex !== null ? 'Update Answer' : 'Add Answer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Detail Modal */}
            {showQuestionDetail && selectedQuestion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-medium">Question Detail</h3>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setShowQuestionDetail(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Question:</h4>
                                <p className="text-gray-900 border-l-4 border-blue-500 pl-2 py-1.5 bg-blue-50 rounded">
                                    {selectedQuestion.questionText}
                                </p>
                            </div>
                            
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">
                                    Answer Options ({selectedQuestion.answers?.length || 0}):
                                </h4>
                                {selectedQuestion.answers && selectedQuestion.answers.length > 0 ? (
                                    <div className="bg-gray-50 rounded p-2 space-y-1.5">
                                        {selectedQuestion.answers.map((answer, index) => (
                                            <div key={answer.id || index} className="border-b border-gray-200 pb-1.5 last:border-b-0 last:pb-0">
                                                <div className="flex justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{answer.answerText || answer.text}</p>
                                                        <p className="text-xs text-blue-600">Score: {answer.score}</p>
                                                    </div>
                                                    <div className="text-xs text-gray-500">#{index + 1}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No answers available for this question</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                            <button 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                                onClick={() => setShowQuestionDetail(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
