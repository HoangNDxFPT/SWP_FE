import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CourseEnrollmentManage() {
  // Main data states
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'course', 'user'
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quiz result modal states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuizResult, setSelectedQuizResult] = useState(null);
  const [allQuizResults, setAllQuizResults] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch all enrollments, courses, and users in parallel
        const [enrollmentsRes, coursesRes, usersRes] = await Promise.all([
          api.get('/enrollments/all-enrollments'),
          api.get('/courses/list'),
          api.get('/profile/all')
        ]);

        if (enrollmentsRes.data && Array.isArray(enrollmentsRes.data)) {
          setAllEnrollments(enrollmentsRes.data);
          setFilteredEnrollments(enrollmentsRes.data);
        }
        
        if (coursesRes.data) {
          setCourses(coursesRes.data);
        }
        
        if (usersRes.data) {
          // Filter to only include MEMBER role users
          const memberUsers = usersRes.data.filter(user => user.role === 'MEMBER');
          setUsers(memberUsers);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Apply filters whenever filter criteria changes
  useEffect(() => {
    if (!allEnrollments.length) return;
    
    let result = [...allEnrollments];
    
    // Filter by course
    if (selectedCourseId) {
      result = result.filter(enrollment => 
        String(enrollment.courseId) === String(selectedCourseId)
      );
    }
    
    // Filter by user
    if (selectedUserId) {
      result = result.filter(enrollment => 
        String(enrollment.userId) === String(selectedUserId)
      );
    }
    
    // Filter by status
    if (statusFilter) {
      result = result.filter(enrollment => enrollment.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(enrollment => 
        enrollment.userName?.toLowerCase().includes(query) ||
        enrollment.courseName?.toLowerCase().includes(query)
      );
    }
    
    setFilteredEnrollments(result);
  }, [allEnrollments, selectedCourseId, selectedUserId, statusFilter, searchQuery]);

  // Reset filters
  const handleResetFilters = () => {
    setSelectedCourseId('');
    setSelectedUserId('');
    setStatusFilter('');
    setSearchQuery('');
    setFilteredEnrollments(allEnrollments);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'InProgress': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatStatus = (status) => {
    switch(status) {
      case 'InProgress': return 'Đang học';
      case 'Completed': return 'Đã hoàn thành';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Calculate statistics
  const getStatusCount = (status) => {
    return filteredEnrollments.filter(e => e.status === status).length;
  };

  // Fetch all quiz results for specific user and course
  const fetchAllQuizResultsForUserCourse = async (userId, courseId) => {
    try {
      // Get all quiz results from API
      const response = await api.get('/quiz-result');
      if (response.data && Array.isArray(response.data)) {
        // Filter results by userId and courseId
        const userCourseResults = response.data.filter(result => 
          result.user && String(result.user.id) === String(userId) && 
          result.course && String(result.course.id) === String(courseId)
        );
        
        if (userCourseResults.length > 0) {
          // Sort by submittedAt in descending order
          return userCourseResults.sort((a, b) => 
            new Date(b.submittedAt) - new Date(a.submittedAt)
          );
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching quiz results:', error);
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
      , results[0]);
      
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
      console.error('Error getting quiz summary:', error);
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
      setUserAnswers({});
      setSelectedEnrollment(enrollment);
      
      const quizResults = await fetchAllQuizResultsForUserCourse(enrollment.userId, enrollment.courseId);
      
      if (quizResults.length > 0) {
        setAllQuizResults(quizResults);
        setSelectedQuizResult(quizResults[0]); // Set latest result as default
        
        // Get quiz questions
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
          console.error('Error fetching quiz questions:', err);
        }
        
        // Get user answers for selected result
        await loadUserAnswers(quizResults[0].id);
      } else {
        toast.info('Người dùng chưa làm bài kiểm tra cho khóa học này');
      }
    } catch (error) {
      console.error('Error viewing quiz result:', error);
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
      console.error('Error loading user answers:', err);
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
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Page Header - Adjusted for AdminLayout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đăng ký khóa học</h1>
        
        <div className="stats flex flex-wrap gap-2">
          <div className="stat bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 flex items-center">
            <span className="text-xs text-gray-500 mr-1">Tổng số:</span>
            <span className="font-semibold text-gray-800">{filteredEnrollments.length}</span>
          </div>
          <div className="stat bg-yellow-50 px-3 py-1.5 rounded-lg shadow-sm border border-yellow-100 flex items-center">
            <span className="text-xs text-yellow-700 mr-1">Đang học:</span>
            <span className="font-semibold text-yellow-800">{getStatusCount('InProgress')}</span>
          </div>
          <div className="stat bg-green-50 px-3 py-1.5 rounded-lg shadow-sm border border-green-100 flex items-center">
            <span className="text-xs text-green-700 mr-1">Hoàn thành:</span>
            <span className="font-semibold text-green-800">{getStatusCount('Completed')}</span>
          </div>
          <div className="stat bg-red-50 px-3 py-1.5 rounded-lg shadow-sm border border-red-100 flex items-center">
            <span className="text-xs text-red-700 mr-1">Đã hủy:</span>
            <span className="font-semibold text-red-800">{getStatusCount('Cancelled')}</span>
          </div>
        </div>
      </div>
      
      {/* Filter Section - Simplified */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Bộ lọc</h2>
          
          <button
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors flex items-center"
            onClick={handleResetFilters}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Đặt lại bộ lọc
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Box */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tìm theo tên người dùng, khóa học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery('')}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khóa học</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="">Tất cả khóa học</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name || course.title}
                </option>
              ))}
            </select>
          </div>
          
          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Người dùng</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Tất cả người dùng</option>
              {users.map(user => (
                <option key={user.userId} value={user.userId}>
                  {user.fullName || user.userName || user.email}
                </option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Filter Info */}
        <div className="mt-4 text-sm text-gray-600">
          {filteredEnrollments.length > 0 ? (
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
              <p>
                Hiển thị <span className="font-medium">{filteredEnrollments.length}</span> trên tổng số <span className="font-medium">{allEnrollments.length}</span> đăng ký
                {selectedCourseId && courses.find(c => String(c.id) === String(selectedCourseId)) && 
                  <> thuộc khóa học <span className="font-medium">{courses.find(c => String(c.id) === String(selectedCourseId)).name || courses.find(c => String(c.id) === String(selectedCourseId)).title}</span></>
                }
                {selectedUserId && users.find(u => String(u.userId) === String(selectedUserId)) && 
                  <> của người dùng <span className="font-medium">{users.find(u => String(u.userId) === String(selectedUserId)).fullName || users.find(u => String(u.userId) === String(selectedUserId)).userName}</span></>
                }
                {statusFilter && <> với trạng thái <span className="font-medium">{formatStatus(statusFilter)}</span></>}
                {searchQuery && <> chứa từ khóa <span className="font-medium">"{searchQuery}"</span></>}
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-100">
              <p>Không tìm thấy đăng ký nào phù hợp với bộ lọc hiện tại.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Enrollments Table */}
      {loading ? (
        <div className="flex justify-center py-12 bg-white rounded-lg shadow-sm">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-50"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-l-4 border-blue-600 absolute top-0 left-0" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy đăng ký nào</h3>
          <p className="text-gray-500 mb-4">Không có đăng ký khóa học nào phù hợp với tiêu chí tìm kiếm hiện tại.</p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Xóa bộ lọc và thử lại
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-700">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">ID người dùng</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Tên người dùng</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">ID khóa học</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Tên khóa học</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Ngày đăng ký</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Kết quả Quiz</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{enrollment.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{enrollment.userName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enrollment.courseId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{enrollment.courseName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
        </div>
      )}

      {/* User Progress Card - Only show when filtering by user */}
      {selectedUserId && filteredEnrollments.length > 0 && (
        <div className="mt-5 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Tiến độ học tập
          </h2>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="mb-3">
              <span className="text-gray-700 font-medium">
                {users.find(u => String(u.userId) === String(selectedUserId))?.fullName || 
                 users.find(u => String(u.userId) === String(selectedUserId))?.userName ||
                 'Người dùng'}
              </span>
              <span className="text-gray-500 ml-2">
                ({filteredEnrollments.length} khóa học đã đăng ký)
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((getStatusCount('Completed') / filteredEnrollments.length) * 100)}%`,
                }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-600">Đã hoàn thành:</span>
                <span className="ml-1 font-semibold text-blue-700">
                  {getStatusCount('Completed')}/{filteredEnrollments.length} khóa học
                </span>
              </div>
              <div>
                <span className="text-gray-600">Tỉ lệ hoàn thành:</span>
                <span className="ml-1 font-semibold text-blue-700">
                  {Math.round((getStatusCount('Completed') / filteredEnrollments.length) * 100)}%
                </span>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-center">
                <div className="text-green-700 text-sm mb-1">Đã hoàn thành</div>
                <div className="text-xl font-bold text-green-800">{getStatusCount('Completed')}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-center">
                <div className="text-yellow-700 text-sm mb-1">Đang học</div>
                <div className="text-xl font-bold text-yellow-800">{getStatusCount('InProgress')}</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                <div className="text-red-700 text-sm mb-1">Đã hủy</div>
                <div className="text-xl font-bold text-red-800">{getStatusCount('Cancelled')}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Quiz Result Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 flex justify-between items-center">
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
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-50"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-l-4 border-blue-600 absolute top-0 left-0" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                  </div>
                  <p className="mt-4 text-gray-600">Đang tải kết quả quiz...</p>
                </div>
              ) : selectedQuizResult ? (
                <div>
                  {/* Quiz User Info */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500 block mb-1">Người làm bài:</span>
                        <p className="text-gray-900 font-medium">{selectedEnrollment?.userName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 block mb-1">Khóa học:</span>
                        <p className="text-gray-900 font-medium">{selectedEnrollment?.courseName}</p>
                      </div>
                    </div>
                  </div>
                
                  {/* Quiz Attempts Navigation */}
                  {allQuizResults.length > 1 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Chọn lần làm bài ({allQuizResults.length} lần):
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {allQuizResults.map((result, index) => (
                          <button
                            key={result.id}
                            onClick={() => handleSelectQuizAttempt(result)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              selectedQuizResult.id === result.id
                                ? 'bg-blue-600 text-white shadow-sm'
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
                  <div className={`p-6 rounded-xl shadow-sm mb-6 ${isPassed(selectedQuizResult) ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
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
                      <h4 className="text-lg font-medium mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Chi tiết từng câu hỏi
                      </h4>
                      <div className="space-y-6">
                        {quizQuestions.map((question, index) => {
                          const userAnswerIndex = userAnswers[question.id];
                          const isCorrect = userAnswerIndex === question.correct;
                          
                          return (
                            <div key={question.id} className="border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-start">
                                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-3 mt-1 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                  {isCorrect ? '✓' : '✗'}
                                </div>
                                <div className="flex-grow">
                                  <h5 className="font-semibold text-gray-800 mb-3 text-lg">
                                    {index + 1}. {question.question}
                                  </h5>
                                  
                                  <div className="space-y-2.5 mt-4">
                                    {question.answer.map((ans, idx) => (
                                      <div 
                                        key={idx} 
                                        className={`p-3 rounded-lg ${
                                          idx === question.correct
                                            ? 'bg-green-50 border border-green-200'
                                            : userAnswerIndex === idx 
                                              ? (isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200')
                                              : 'bg-white border border-gray-200'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>
                                            <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                                            {ans}
                                          </span>
                                          
                                          {idx === question.correct && (
                                            <span className="text-green-600 text-sm font-medium flex items-center">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                              </svg>
                                              Đáp án đúng
                                            </span>
                                          )}
                                          
                                          {userAnswerIndex === idx && idx !== question.correct && (
                                            <span className="text-red-600 text-sm font-medium flex items-center">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                              Lựa chọn của người dùng
                                            </span>
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
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có kết quả quiz</h3>
                  <p className="text-gray-500 max-w-md mx-auto">Người dùng chưa làm bài kiểm tra cho khóa học này hoặc đã xảy ra lỗi khi tải dữ liệu.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
              <button
                onClick={() => setShowQuizModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CourseEnrollmentManage;