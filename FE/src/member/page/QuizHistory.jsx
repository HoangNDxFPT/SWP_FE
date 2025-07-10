import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

function QuizHistory() {
  const [loading, setLoading] = useState(true);
  const [quizResults, setQuizResults] = useState([]);
  const [groupedResults, setGroupedResults] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'submittedAt', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all quiz results
  useEffect(() => {
    const fetchQuizResults = async () => {
      try {
        setLoading(true);
        const response = await api.get('/quiz-result/my-results');
        if (response.status === 200 && Array.isArray(response.data)) {
          setQuizResults(response.data);
          
          // Group results by course
          const grouped = response.data.reduce((acc, result) => {
            const courseId = result.course?.id;
            if (courseId) {
              if (!acc[courseId]) {
                acc[courseId] = {
                  courseInfo: result.course,
                  results: []
                };
              }
              acc[courseId].results.push(result);
            }
            return acc;
          }, {});
          
          // Sort each course's results by submission date (newest first)
          Object.keys(grouped).forEach(courseId => {
            grouped[courseId].results.sort((a, b) => 
              new Date(b.submittedAt) - new Date(a.submittedAt)
            );
          });
          
          setGroupedResults(grouped);
        }
      } catch (error) {
        console.error('Error fetching quiz results:', error);
        toast.error('Không thể tải kết quả bài kiểm tra');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, []);

  // Calculate performance metrics for a course
  const calculateCourseMetrics = (results) => {
    if (!results || results.length === 0) return { attempts: 0 };
    
    const attempts = results.length;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const totalQuestions = results.reduce((sum, result) => sum + result.totalQuestions, 0);
    const averageScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    
    // Find best result based on percentage
    const bestResult = results.reduce((best, current) => {
      const currentPercentage = (current.score / current.totalQuestions) * 100;
      const bestPercentage = best ? (best.score / best.totalQuestions) * 100 : 0;
      return currentPercentage > bestPercentage ? current : best;
    }, null);
    
    // Find latest result
    const latestResult = results[0]; // Already sorted
    
    return {
      attempts,
      averageScore,
      bestScore: bestResult ? Math.round((bestResult.score / bestResult.totalQuestions) * 100) : 0,
      latestScore: latestResult ? Math.round((latestResult.score / latestResult.totalQuestions) * 100) : 0,
      bestResult,
      latestResult
    };
  };

  // Check if passed (80% or higher)
  const isPassed = (result) => {
    const percentage = (result.score / result.totalQuestions) * 100;
    return percentage >= 80;
  };

  // Sort filtered results
  const sortedResults = () => {
    if (!selectedCourse || !groupedResults[selectedCourse]?.results) return [];
    
    const { key, direction } = sortConfig;
    const resultsToSort = [...groupedResults[selectedCourse].results];
    
    return resultsToSort.sort((a, b) => {
      if (key === 'submittedAt') {
        return direction === 'asc' 
          ? new Date(a.submittedAt) - new Date(b.submittedAt)
          : new Date(b.submittedAt) - new Date(a.submittedAt);
      }
      
      if (key === 'score') {
        const scoreA = (a.score / a.totalQuestions) * 100;
        const scoreB = (b.score / b.totalQuestions) * 100;
        return direction === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
      
      return 0;
    });
  };

  // Handle sort
  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (name) => {
    if (sortConfig.key !== name) {
      return <FaSort className="ml-1 text-gray-400 text-xs" />;
    }
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="ml-1 text-blue-600 text-xs" /> 
      : <FaSortDown className="ml-1 text-blue-600 text-xs" />;
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Filtered courses based on search term
  const filteredCourses = Object.entries(groupedResults).filter(([_, courseData]) => {
    if (!searchTerm.trim()) return true;
    
    const courseName = courseData.courseInfo.name.toLowerCase();
    return courseName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Title & Search */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Lịch sử làm bài kiểm tra</h1>
              <p className="text-gray-600 mt-1">Xem lại tất cả các bài kiểm tra bạn đã làm</p>
            </div>
            <div className="mt-4 md:mt-0 w-full md:w-64">
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tìm kiếm khóa học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải lịch sử bài kiểm tra...</p>
            </div>
          ) : quizResults.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có bài kiểm tra nào</h3>
              <p className="text-gray-500 mb-4">
                Bạn chưa làm bài kiểm tra nào cho khóa học. Hãy tham gia một khóa học và hoàn thành bài kiểm tra để xem kết quả tại đây.
              </p>
              <Link
                to="/courseList"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Khám phá khóa học
              </Link>
            </div>
          ) : (
            <>
              {filteredCourses.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Không tìm thấy khóa học nào khớp với từ khóa "{searchTerm}".
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Course Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredCourses.map(([courseId, courseData]) => {
                  const metrics = calculateCourseMetrics(courseData.results);
                  return (
                    <div 
                      key={courseId}
                      className={`bg-white rounded-xl shadow-md overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                        selectedCourse === courseId ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedCourse(selectedCourse === courseId ? null : courseId)}
                    >
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">{courseData.courseInfo.name}</h3>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-1">Số lần làm:</span>
                            <span className="font-medium text-blue-800">{metrics.attempts}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-1">Điểm cao nhất:</span>
                            <span className={`font-medium ${metrics.bestScore >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                              {metrics.bestScore}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div
                            className={`h-2 rounded-full ${metrics.bestScore >= 80 ? 'bg-green-600' : 'bg-yellow-500'}`}
                            style={{ width: `${metrics.bestScore}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                          <div className="text-sm text-gray-500">
                            Lần cuối: {metrics.latestResult ? formatDate(metrics.latestResult.submittedAt).split(',')[0] : 'N/A'}
                          </div>
                          <div className={`text-sm font-medium ${selectedCourse === courseId ? 'text-blue-600' : 'text-gray-600'}`}>
                            {selectedCourse === courseId ? 'Đang xem' : 'Nhấn để xem chi tiết'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Selected Course Details */}
              {selectedCourse && groupedResults[selectedCourse] && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white">
                    <h2 className="text-xl font-bold">{groupedResults[selectedCourse].courseInfo.name}</h2>
                    <p className="opacity-90 text-sm">
                      {groupedResults[selectedCourse].results.length} lần làm bài kiểm tra
                    </p>
                  </div>
                  
                  <div className="p-6">
                    {/* Performance Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <div className="text-sm text-blue-700 mb-1">Số lần làm bài</div>
                        <div className="text-3xl font-bold text-blue-900">
                          {groupedResults[selectedCourse].results.length}
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                        <div className="text-sm text-green-700 mb-1">Điểm cao nhất</div>
                        <div className="text-3xl font-bold text-green-800">
                          {calculateCourseMetrics(groupedResults[selectedCourse].results).bestScore}%
                        </div>
                      </div>
                      
                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                        <div className="text-sm text-indigo-700 mb-1">Điểm trung bình</div>
                        <div className="text-3xl font-bold text-indigo-800">
                          {calculateCourseMetrics(groupedResults[selectedCourse].results).averageScore}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Results Table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                              </th>
                              <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => requestSort('submittedAt')}
                              >
                                <div className="flex items-center">
                                  Ngày làm bài
                                  {getSortIcon('submittedAt')}
                                </div>
                              </th>
                              <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => requestSort('score')}
                              >
                                <div className="flex items-center">
                                  Kết quả
                                  {getSortIcon('score')}
                                </div>
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trạng thái
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Hành động
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sortedResults().map((result, index) => (
                              <tr key={result.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(result.submittedAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="text-sm font-medium text-gray-900 mr-2">
                                      {result.score}/{result.totalQuestions}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      ({Math.round((result.score / result.totalQuestions) * 100)}%)
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {isPassed(result) ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      <FaCheckCircle className="mr-1" /> Đạt yêu cầu
                                    </span>
                                  ) : (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                      <FaTimesCircle className="mr-1" /> Chưa đạt
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                  <Link
                                    to={`/quiz-result/${result.id}`}
                                    className="text-blue-600 hover:text-blue-900 flex items-center justify-end"
                                  >
                                    <FaInfoCircle className="mr-1" /> Chi tiết
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Attempt Again Button */}
                    <div className="mt-6 flex justify-end">
                      <Link
                        to={`/quiz/${selectedCourse}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Làm lại bài kiểm tra
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default QuizHistory;