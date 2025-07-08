import React, { useEffect, useState } from 'react';
import api from '../../config/axios';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
function CoursesListPage() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [completedCourses, setCompletedCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const COURSES_PER_PAGE = 5;
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // Lấy thông tin user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await api.get('profile');
        if (res.status === 200 && res.data) {
          setUser(res.data);

          // Lấy danh sách khóa học đã hoàn thành
          if (res.data.userId) {
            try {
              const completedRes = await api.get(`quiz/completed/${res.data.userId}`);
              if (Array.isArray(completedRes.data)) {
                setCompletedCourses(completedRes.data);
              }
            } catch (err) {
              console.error('Failed to fetch completed courses:', err);
              toast.error('Không thể tải khóa học đã hoàn thành');
            }
            try {

              const enrolledRes = await api.get('/enrollments/my-courses');
              if (Array.isArray(enrolledRes.data)) {
                setEnrolledCourses(enrolledRes.data.map((course) => course.id));
              }
            } catch (err) {
              console.error('Failed to fetch enrolled courses:', err);
              toast.error('Không thể tải khóa học đã tham gia');
            }
          }
        }
      } catch (err) {
        setUser(null);
        console.error('Failed to fetch user profile:', err);
        toast.error('Không thể tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleStartCourse = async (courseId) => {
    if (!user || !user.userId) {
      toast.error('Bạn cần đăng nhập để bắt đầu học');
      return;
    }

    try {
      // Gọi API để enroll
      const res = await api.post(`/enrollments/enroll?userId=${user.userId}&courseId=${courseId}`);
      if (res.status === 200) {
        toast.success('Đã đăng ký khóa học thành công');
        // Điều hướng sau khi enroll thành công
        navigate(`/course/${courseId}`);
      } else {
        toast.error('Đăng ký khóa học thất bại');
      }
    } catch (error) {
      console.error('Enroll error:', error);
      toast.error('Đã xảy ra lỗi khi đăng ký khóa học');
    }
  };


  // Tính nhóm tuổi
  const getUserAgeGroup = () => {
    if (user && user.dateOfBirth) {
      const birth = new Date(user.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age < 18 ? 'Teenagers' : 'Adults';
    }
    return '';
  };

  const userAgeGroup = getUserAgeGroup();

  // Fetch courses with debounce for search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const fetchCourses = async () => {
        setLoading(true);
        try {
          let url = 'http://localhost:8080/api/courses/list';
          if (search.trim() !== '') {
            url = `http://localhost:8080/api/courses/search?name=${encodeURIComponent(search.trim())}`;
          }

          const token = localStorage.getItem('token');

          const res = await api.get(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: '*/*',
            },
          });

          if (res.status === 200 && Array.isArray(res.data)) {
            setCourses(res.data);
            setCurrentPage(1);
          } else {
            setCourses([]);
          }
        } catch (error) {
          console.error('Fetch error:', error);
          setCourses([]);
          toast.error('Không thể tải danh sách khóa học');
        } finally {
          setLoading(false);
        }
      };

      fetchCourses();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Lọc theo các tiêu chí
  const getFilteredCourses = () => {
    let filtered = [...courses];

    // Lọc theo nhóm tuổi nếu người dùng có thông tin
    if (userAgeGroup && activeFilter === 'recommended') {
      filtered = filtered.filter(course => course.targetAgeGroup === userAgeGroup);
    }

    // Lọc theo khóa học đã hoàn thành
    if (activeFilter === 'completed') {
      filtered = filtered.filter(course => completedCourses.includes(course.id));
    }

    // Lọc theo khóa học chưa hoàn thành
    if (activeFilter === 'notCompleted') {
      filtered = filtered.filter(course => !completedCourses.includes(course.id));
    }
    if (activeFilter === 'enrolled') {
      filtered = filtered.filter(course => enrolledCourses.includes(course.id));
    }

    return filtered;
  };

  const filteredCourses = getFilteredCourses();

  // Phân trang
  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * COURSES_PER_PAGE,
    currentPage * COURSES_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 py-16 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Giáo dục phòng chống<br className="hidden sm:block" /> ma túy
            </h1>
            <p className="text-white/90 text-lg mb-6">
              Bộ tài liệu giáo dục tương tác này được thiết kế để bạn có thể học hỏi về sự thật về ma túy theo nhịp độ riêng. Tìm hiểu ma túy là gì, chúng được làm từ gì, tác động ngắn hạn và dài hạn của chúng, và xem những câu chuyện thực tế từ người thật về mỗi loại ma túy phổ biến.
            </p>
            <div className="inline-block">
              <a href="#course-list" className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-6 py-3 rounded-lg font-semibold shadow-lg transition hover:shadow-xl">
                Khám phá khóa học
              </a>
            </div>
          </div>
          <div className="md:w-2/5 flex justify-center">
            <img
              src="https://res.cloudinary.com/dwjtg28ti/image/upload/v1751184828/raw_wdvcwx.png"
              alt="Giáo dục phòng chống ma túy"
              className="w-full max-w-md h-auto object-contain rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-12 px-4" id="course-list">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Content - Course List */}
          <div className="w-full md:w-2/3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Danh sách khóa học</h2>

              {/* Filter buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}
                  className={`px-4 py-2 text-sm rounded-full ${activeFilter === 'all'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => { setActiveFilter('recommended'); setCurrentPage(1); }}
                  className={`px-4 py-2 text-sm rounded-full ${activeFilter === 'recommended'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Phù hợp với bạn
                </button>
                <button
                  onClick={() => { setActiveFilter('completed'); setCurrentPage(1); }}
                  className={`px-4 py-2 text-sm rounded-full ${activeFilter === 'completed'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Đã hoàn thành
                </button>
                <button
                  onClick={() => { setActiveFilter('notCompleted'); setCurrentPage(1); }}
                  className={`px-4 py-2 text-sm rounded-full ${activeFilter === 'notCompleted'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Chưa hoàn thành
                </button>
                <button
                  onClick={() => { setActiveFilter('enrolled'); setCurrentPage(1); }}
                  className={`px-4 py-2 text-sm rounded-full ${activeFilter === 'enrolled'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Đã tham gia
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm khóa học..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {search && (
                  <button
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearch('')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Course List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : paginatedCourses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy khóa học nào</h3>
                <p className="text-gray-500">
                  {search ? 'Không có kết quả phù hợp với từ khóa tìm kiếm của bạn.' : 'Hiện tại không có khóa học nào trong danh mục này.'}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {paginatedCourses.map(course => (
                  <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                    <div className="p-6">
                      <div className="flex items-center mb-2">
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mr-2 ${completedCourses.includes(course.id)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'}`}
                        >
                          {completedCourses.includes(course.id) ? 'Đã hoàn thành' : 'Khả dụng'}
                        </span>
                        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {course.targetAgeGroup === 'Teenagers' ? 'Thanh thiếu niên' : 'Người trưởng thành'}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-blue-700 mb-2">{course.name}</h3>
                      <p className="text-gray-700 mb-4">{course.description}</p>

                      <div className="flex flex-wrap gap-4 mb-4 text-gray-600 text-sm">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span><b>Loại:</b> {course.type}</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span><b>Ngày bắt đầu:</b> {new Date(course.startDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span><b>Ngày kết thúc:</b> {new Date(course.endDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>

                      {completedCourses.includes(course.id) ? (
                        <div className="flex items-center space-x-4">
                          <button className="px-6 py-2 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed" disabled>
                            Đã hoàn thành
                          </button>
                          <Link to={`/course/${course.id}`} className="text-blue-600 hover:text-blue-800">
                            Xem lại khóa học
                          </Link>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartCourse(course.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition shadow-sm hover:shadow-md"
                        >
                          Bắt đầu học ngay
                        </button>

                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="inline-flex rounded-md shadow">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border ${currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            } text-sm font-medium`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      (pageNum === currentPage - 2 && currentPage > 3) ||
                      (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span
                          key={pageNum}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-1/3 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
              <h3 className="text-xl font-bold text-blue-700 mb-4">Về khóa học của chúng tôi</h3>
              <div className="text-gray-700 mb-4">
                Các khóa học này được thiết kế để cung cấp thông tin chính xác, khoa học về ma túy và tác hại của chúng. Bạn sẽ học được:
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Tác động của ma túy đối với cơ thể và não bộ</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Các dấu hiệu sử dụng ma túy</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Cách phòng ngừa và từ chối ma túy</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Các lựa chọn hỗ trợ cho người đang gặp vấn đề</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-blue-800">Học ngay hôm nay!</h3>
              </div>
              <div className="text-gray-700 mb-4">
                Đăng ký các khóa học miễn phí và tự trang bị kiến thức về ma túy để bảo vệ bản thân và người thân!
              </div>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xl text-purple-500">📝</span>
                <span className="text-gray-700">Theo dõi tiến trình học thông qua các bài kiểm tra sau mỗi bài học.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl text-blue-600">💬</span>
                <span className="text-gray-700">Tham gia cộng đồng những người đang nỗ lực xây dựng một thế giới không ma túy!</span>
              </div>
            </div>

            {/* Thống kê */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê khóa học</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{courses.length}</p>
                  <p className="text-gray-600 text-sm">Tổng khóa học</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{completedCourses.length}</p>
                  <p className="text-gray-600 text-sm">Đã hoàn thành</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg col-span-2">
                  <p className="text-2xl font-bold text-purple-700">
                    {completedCourses.length > 0 && courses.length > 0
                      ? Math.round((completedCourses.length / courses.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-gray-600 text-sm">Tiến độ học tập</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default CoursesListPage;