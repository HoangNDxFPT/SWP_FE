import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaCheckCircle, FaTimesCircle, FaEye, FaSearch, FaClock, FaTrophy } from 'react-icons/fa';

function QuizHistory() {
  const [loading, setLoading] = useState(true);
  const [quizResults, setQuizResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all quiz results
  useEffect(() => {
    const fetchQuizResults = async () => {
      try {
        setLoading(true);
        const response = await api.get('/quiz-result/my-results');
        
        if (response.status === 200 && Array.isArray(response.data)) {
          // Sort by submission date (newest first)
          const sortedResults = response.data.sort((a, b) => 
            new Date(b.submittedAt) - new Date(a.submittedAt)
          );
          setQuizResults(sortedResults);
          setFilteredResults(sortedResults);
        }
      } catch (error) {
        console.error('Error fetching quiz results:', error);
        toast.error('Không thể tải lịch sử bài kiểm tra');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, []);

  // Filter results based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredResults(quizResults);
    } else {
      const filtered = quizResults.filter(result =>
        result.courseName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  }, [searchTerm, quizResults]);

  // Check if passed (80% or higher)
  const isPassed = (result) => {
    const percentage = (result.score / result.totalQuestions) * 100;
    return percentage >= 80;
  };

  // Calculate percentage
  const getPercentage = (result) => {
    return Math.round((result.score / result.totalQuestions) * 100);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get stats
  const getStats = () => {
    const totalAttempts = quizResults.length;
    const passedAttempts = quizResults.filter(isPassed).length;
    const avgScore = quizResults.length > 0 
      ? Math.round(quizResults.reduce((sum, result) => sum + getPercentage(result), 0) / quizResults.length)
      : 0;
    const bestScore = quizResults.length > 0 
      ? Math.max(...quizResults.map(getPercentage))
      : 0;

    return { totalAttempts, passedAttempts, avgScore, bestScore };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-medium text-gray-700">Đang tải lịch sử bài kiểm tra...</h2>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Lịch sử làm bài kiểm tra</h1>
            <p className="text-gray-600">Theo dõi tiến độ và kết quả của bạn</p>
          </div>

          {quizResults.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Chưa có bài kiểm tra nào</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Bạn chưa làm bài kiểm tra nào. Hãy tham gia khóa học và hoàn thành bài kiểm tra để xem kết quả tại đây.
              </p>
              <Link
                to="/courseList"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaSearch className="mr-2" />
                Khám phá khóa học
              </Link>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FaClock className="text-blue-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Tổng số lần làm</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalAttempts}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <FaCheckCircle className="text-green-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Số lần đạt</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.passedAttempts}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <FaTrophy className="text-yellow-600 text-xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Điểm cao nhất</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.bestScore}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <svg className="text-purple-600 text-xl w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Điểm trung bình</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.avgScore}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tìm kiếm theo tên khóa học..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Kết quả bài kiểm tra ({filteredResults.length})
                  </h2>
                </div>

                {filteredResults.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">Không tìm thấy kết quả nào khớp với "{searchTerm}"</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Khóa học
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày làm bài
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kết quả
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredResults.map((result) => (
                          <tr key={result.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                {result.courseName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(result.submittedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900 mr-2">
                                  {result.score}/{result.totalQuestions}
                                </span>
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                  getPercentage(result) >= 80
                                    ? 'bg-green-100 text-green-800'
                                    : getPercentage(result) >= 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {getPercentage(result)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isPassed(result) ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <FaCheckCircle className="mr-1" />
                                  Đạt yêu cầu
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <FaTimesCircle className="mr-1" />
                                  Chưa đạt
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <Link
                                to={`/quiz-result/${result.id}`}
                                className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                <FaEye className="mr-1" />
                                Xem chi tiết
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Info Note */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="flex-shrink-0 w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Lưu ý:</strong> Để làm lại bài kiểm tra, vui lòng truy cập vào khóa học tương ứng từ danh sách khóa học. 
                      Bạn cần đạt tối thiểu 80% để hoàn thành khóa học.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default QuizHistory;