import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CourseEnrollmentManage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Filter mode: 'course' or 'user'
  const [filterMode, setFilterMode] = useState('course');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Quiz result modal states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuizResult, setSelectedQuizResult] = useState(null);
  const [allQuizResults, setAllQuizResults] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  useEffect(() => {
    // Fetch courses and users when component mounts
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchCourses(),
          fetchUsers()
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        // Reset loading state after initial load
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Watch for changes in filter mode, selected course or selected user
  useEffect(() => {
    if (filterMode === 'course' && selectedCourseId) {
      fetchEnrollmentsByCourse(selectedCourseId);
    } else if (filterMode === 'user' && selectedUserId) {
      fetchEnrollmentsByUser(selectedUserId);
    } else {
      // Clear enrollments when no selection
      setEnrollments([]);
    }
  }, [filterMode, selectedCourseId, selectedUserId]);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/list');
      setCourses(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách khóa học');
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/profile/all');
      // Chỉ lấy người dùng có role là MEMBER
      const memberUsers = response.data.filter(user => user.role === 'MEMBER');
      setUsers(memberUsers);
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
      console.error(error);
    }
  };

  const fetchEnrollmentsByCourse = async (courseId) => {
    try {
      setLoading(true);
      const response = await api.get(`/enrollments/course/${courseId}`);
      setEnrollments(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách đăng ký khóa học');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentsByUser = async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/enrollments/user/${userId}`);
      setEnrollments(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách đăng ký của người dùng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'InProgress': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterEnrollments = () => {
    if (!statusFilter) return enrollments;
    return enrollments.filter(enrollment => enrollment.status === statusFilter);
  };

  const filteredEnrollments = filterEnrollments();
  
  // Calculate statistics
  const getStatusCount = (status) => {
    return enrollments.filter(e => e.status === status).length;
  };

  const formatStatus = (status) => {
    switch(status) {
      case 'InProgress': return 'Đang học';
      case 'Completed': return 'Đã hoàn thành';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Fetch all quiz results for specific user and course
  const fetchAllQuizResultsForUserCourse = async (userId, courseId) => {
    try {
      // Lấy tất cả quiz results từ API
      const response = await api.get('/quiz-result');
      if (response.data && Array.isArray(response.data)) {
        // Filter kết quả theo userId và courseId
        const userCourseResults = response.data.filter(result => 
          result.user && result.user.id == userId && 
          result.course && result.course.id == courseId
        );
        
        if (userCourseResults.length > 0) {
          // Sắp xếp theo thời gian submittedAt giảm dần
          const sortedResults = userCourseResults.sort((a, b) => 
            new Date(b.submittedAt) - new Date(a.submittedAt)
          );
          return sortedResults;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Lỗi khi lấy kết quả quiz:', error);
      return [];
    }
  };

  // Get quiz summary for table display
  const getQuizSummary = async (userId, courseId) => {
    try {
      const results = await fetchAllQuizResultsForUserCourse(userId, courseId);
      if (results.length === 0) return null;
      
      const latestResult = results[0];
      const bestResult = results.reduce((best, current) => 
        (current.score / current.totalQuestions) > (best.score / best.totalQuestions) ? current : best
      );
      
      return {
        totalAttempts: results.length,
        latestScore: latestResult.score,
        latestTotal: latestResult.totalQuestions,
        latestPercentage: Math.round((latestResult.score / latestResult.totalQuestions) * 100),
        bestPercentage: Math.round((bestResult.score / bestResult.totalQuestions) * 100),
        latestPassed: (latestResult.score / latestResult.totalQuestions) >= 0.8,
        bestPassed: (bestResult.score / bestResult.totalQuestions) >= 0.8
      };
    } catch (error) {
      console.error('Lỗi khi lấy tóm tắt quiz:', error);
      return null;
    }
  };

  // Open quiz result modal
  const handleViewQuizResult = async (enrollment) => {
    try {
      setQuizLoading(true);
      setShowQuizModal(true);
      setSelectedQuizResult(null);
      setAllQuizResults([]);
      setQuizQuestions([]);
      setUserAnswers([]);
      setSelectedEnrollment(enrollment);
      
      const quizResults = await fetchAllQuizResultsForUserCourse(enrollment.userId, enrollment.courseId);
      
      if (quizResults.length > 0) {
        setAllQuizResults(quizResults);
        setSelectedQuizResult(quizResults[0]); // Set latest result as default
        
        // Lấy chi tiết câu hỏi quiz
        try {
          const quizRes = await api.get(`/quiz/course/${enrollment.courseId}`);
          if (quizRes.status === 200 && Array.isArray(quizRes.data)) {
            const parsedQuizzes = quizRes.data.map(q => ({
              ...q,
              answer: Array.isArray(q.answer) ? q.answer : JSON.parse(q.answer || '[]'),
            }));
            setQuizQuestions(parsedQuizzes);
          }
        } catch (err) {
          console.error('Lỗi khi lấy câu hỏi quiz:', err);
        }
        
        // Lấy câu trả lời của user cho result đã chọn
        await loadUserAnswers(quizResults[0].id);
      } else {
        toast.info('Người dùng chưa làm bài kiểm tra cho khóa học này');
      }
    } catch (error) {
      console.error('Lỗi khi xem kết quả quiz:', error);
      toast.error('Không thể tải kết quả quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  // Load user answers for specific quiz result
  const loadUserAnswers = async (resultId) => {
    try {
      const answersRes = await api.get(`/quiz/result/${resultId}`);
      if (answersRes.status === 200 && Array.isArray(answersRes.data)) {
        const answersMap = {};
        answersRes.data.forEach(answer => {
          answersMap[answer.questionId] = answer.selectedAnswer;
        });
        setUserAnswers(answersMap);
      }
    } catch (err) {
      console.error('Lỗi khi lấy câu trả lời:', err);
      setUserAnswers({});
    }
  };

  // Handle selecting different quiz attempt
  const handleSelectQuizAttempt = async (result) => {
    setSelectedQuizResult(result);
    setUserAnswers({});
    await loadUserAnswers(result.id);
  };

  // Calculate percentage for quiz result
  const calculatePercentage = (result) => {
    if (!result) return 0;
    return Math.round((result.score / result.totalQuestions) * 100);
  };

  // Check if passed
  const isPassed = (result) => {
    const percentage = calculatePercentage(result);
    return percentage >= 80;
  };

  // Quiz Summary Cell Component
  const QuizSummaryCell = ({ enrollment }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const loadSummary = async () => {
        setLoading(true);
        const summaryData = await getQuizSummary(enrollment.userId, enrollment.courseId);
        setSummary(summaryData);
        setLoading(false);
      };
      loadSummary();
    }, [enrollment.userId, enrollment.courseId]);

    if (loading) {
      return (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-500">Đang tải...</span>
        </div>
      );
    }

    if (!summary) {
      return (
        <button
          onClick={() => handleViewQuizResult(enrollment)}
          className="text-gray-500 hover:text-blue-600 text-sm inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Chưa làm bài
        </button>
      );
    }

    return (
      <div className="text-sm">
        <button
          onClick={() => handleViewQuizResult(enrollment)}
          className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center mb-1"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Xem chi tiết
        </button>
        <div className="space-y-1">
          <div className="flex items-center">
            <span className="text-gray-600">Lần gần nhất:</span>
            <span className={`ml-1 font-medium ${summary.latestPassed ? 'text-green-600' : 'text-red-600'}`}>
              {summary.latestPercentage}%
            </span>
            <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${summary.latestPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {summary.latestPassed ? 'Đậu' : 'Rớt'}
            </span>
          </div>
          {summary.totalAttempts > 1 && (
            <div className="flex items-center">
              <span className="text-gray-600">Tốt nhất:</span>
              <span className={`ml-1 font-medium ${summary.bestPassed ? 'text-green-600' : 'text-red-600'}`}>
                {summary.bestPercentage}%
              </span>
            </div>
          )}
          <div className="text-gray-500 text-xs">
            {summary.totalAttempts} lần làm bài
          </div>
        </div>
      </div>
    );
  };

  return (
      <div className="container mx-auto px-4 py-6">
        <ToastContainer position="top-right" autoClose={3000} />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quản lý đăng ký khóa học</h1>
        </div>
        
        {/* Filter options */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-medium mb-4">Bộ lọc</h2>
          
          {/* Filter mode toggle */}
          <div className="flex gap-4 mb-4 border-b pb-4">
            <div 
              className={`cursor-pointer px-4 py-2 rounded-lg ${filterMode === 'course' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => {
                setFilterMode('course');
                setSelectedUserId('');
                setEnrollments([]);
              }}
            >
              Lọc theo khóa học
            </div>
            
            <div 
              className={`cursor-pointer px-4 py-2 rounded-lg ${filterMode === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => {
                setFilterMode('user');
                setSelectedCourseId('');
                setEnrollments([]);
              }}
            >
              Lọc theo người dùng
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterMode === 'course' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn khóa học</label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="">Chọn khóa học</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name || course.title}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn người dùng</label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Chọn người dùng</option>
                  {users.map(user => (
                    <option key={user.userId} value={user.userId}>
                      {user.fullName || user.userName || user.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="InProgress">Đang học</option>
                <option value="Completed">Đã hoàn thành</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button 
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              onClick={() => {
                if (filterMode === 'course') {
                  setSelectedCourseId('');
                } else {
                  setSelectedUserId('');
                }
                setStatusFilter('');
                setEnrollments([]);
              }}
            >
              Đặt lại bộ lọc
            </button>
          </div>
        </div>
        
        {/* Enrollments Table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (filterMode === 'course' && !selectedCourseId) || (filterMode === 'user' && !selectedUserId) ? (
          <div className="bg-white rounded-lg shadow p-5 text-center">
            <p className="text-gray-500">
              Vui lòng chọn {filterMode === 'course' ? 'khóa học' : 'người dùng'} để xem danh sách đăng ký.
            </p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-5 text-center">
            <p className="text-gray-500">
              Không tìm thấy đăng ký nào {statusFilter && 'với trạng thái đã chọn'}.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">ID người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Tên người dùng</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-semibold text-white">ID khóa học</th> */}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Tên khóa học</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Ngày đăng ký</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Kết quả Quiz</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment, index) => (
                  <tr key={index} className="hover:bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">{enrollment.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{enrollment.userName}</td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">{enrollment.courseId}</td> */}
                    <td className="px-6 py-4 whitespace-nowrap">{enrollment.courseName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(enrollment.status)}`}>
                        {formatStatus(enrollment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <QuizSummaryCell enrollment={enrollment} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Quiz Result Modal */}
        {showQuizModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
                <h2 className="text-xl font-bold">Kết quả Quiz</h2>
                <button
                  onClick={() => setShowQuizModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {quizLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : selectedQuizResult ? (
                  <div>
                    {/* Quiz Attempts Navigation */}
                    {allQuizResults.length > 1 && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Chọn lần làm bài ({allQuizResults.length} lần):
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {allQuizResults.map((result, index) => (
                            <button
                              key={result.id}
                              onClick={() => handleSelectQuizAttempt(result)}
                              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                selectedQuizResult.id === result.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              Lần {index + 1}
                              <div className="text-xs mt-1">
                                {calculatePercentage(result)}% - {new Date(result.submittedAt).toLocaleDateString('vi-VN')}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Result Summary */}
                    <div className={`p-6 rounded-lg mb-6 ${isPassed(selectedQuizResult) ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex flex-col md:flex-row justify-between items-center">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">
                            {isPassed(selectedQuizResult) ? 'Đậu' : 'Rớt'} - {calculatePercentage(selectedQuizResult)}%
                            {allQuizResults.length > 1 && (
                              <span className="text-base font-normal text-gray-600 ml-2">
                                (Lần {allQuizResults.findIndex(r => r.id === selectedQuizResult.id) + 1}/{allQuizResults.length})
                              </span>
                            )}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {selectedQuizResult.score}/{selectedQuizResult.totalQuestions} câu đúng
                          </p>
                          <p className="text-sm text-gray-500">
                            Ngày làm bài: {new Date(selectedQuizResult.submittedAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {allQuizResults.length > 1 && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600">Điểm tốt nhất: </span>
                              <span className="font-medium text-green-600">
                                {Math.max(...allQuizResults.map(r => calculatePercentage(r)))}%
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 md:mt-0">
                          <div className={`text-5xl font-bold ${isPassed(selectedQuizResult) ? 'text-green-600' : 'text-red-600'}`}>
                            {calculatePercentage(selectedQuizResult)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Questions and Answers */}
                    {quizQuestions.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Chi tiết từng câu hỏi</h4>
                        <div className="space-y-6">
                          {quizQuestions.map((question, index) => {
                            const userAnswerIndex = userAnswers[question.id];
                            const isCorrect = userAnswerIndex === question.correct;
                            
                            return (
                              <div key={question.id} className="border rounded-lg p-4">
                                <div className="flex items-start mb-3">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-1 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {isCorrect ? '✓' : '✗'}
                                  </div>
                                  <div className="flex-grow">
                                    <h5 className="font-semibold text-gray-800 mb-2">
                                      {index + 1}. {question.question}
                                    </h5>
                                    
                                    <div className="space-y-2">
                                      {question.answer.map((ans, idx) => (
                                        <div 
                                          key={idx} 
                                          className={`p-2 rounded border ${
                                            idx === question.correct
                                              ? 'bg-green-50 border-green-300'
                                              : userAnswerIndex === idx 
                                                ? (isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300')
                                                : 'border-gray-200'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span>
                                              <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                                              {ans}
                                            </span>
                                            
                                            {idx === question.correct && (
                                              <span className="text-green-600 text-sm font-medium">Đáp án đúng</span>
                                            )}
                                            
                                            {userAnswerIndex === idx && idx !== question.correct && (
                                              <span className="text-red-600 text-sm font-medium">Lựa chọn của bạn</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có kết quả quiz</h3>
                    <p className="text-gray-500">Người dùng chưa làm bài kiểm tra cho khóa học này.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setShowQuizModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Statistics Section */}
       {/* Statistics Section */}
{enrollments.length > 0 && (
  <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
    <h2 className="text-lg font-medium mb-3">Thống kê</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
        <div className="text-sm text-gray-500">Tổng số đăng ký</div>
        <div className="text-xl font-semibold">{enrollments.length}</div>
      </div>
      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
        <div className="text-sm text-gray-500">Đã hoàn thành</div>
        <div className="text-xl font-semibold">
          {getStatusCount('Completed')}
        </div>
      </div>
      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
        <div className="text-sm text-gray-500">Đang học</div>
        <div className="text-xl font-semibold">
          {getStatusCount('InProgress')}
        </div>
      </div>
      <div className="bg-red-50 p-3 rounded-lg border border-red-100">
        <div className="text-sm text-gray-500">Đã hủy</div>
        <div className="text-xl font-semibold">
          {getStatusCount('Cancelled')}
        </div>
      </div>
    </div>

    {filterMode === 'user' && selectedUserId && enrollments.length > 0 && (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="font-medium mb-2">Tiến độ học tập:</div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
          <div
            className="bg-blue-600 h-4 rounded-full"
            style={{
              width: `${Math.round(
                (getStatusCount('Completed') / enrollments.length) * 100
              )}%`,
            }}
          ></div>
        </div>
        <div className="text-sm text-gray-500">
          {Math.round(
            (getStatusCount('Completed') / enrollments.length) * 100
          )}
          % khóa học đã hoàn thành
        </div>
      </div>
    )}
  </div>
)}

      </div>
  );
}

export default CourseEnrollmentManage;