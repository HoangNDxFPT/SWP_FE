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
  const COURSES_PER_PAGE = 5; // Sửa lại thành 5 khóa học mỗi trang
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseStatuses, setCourseStatuses] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [courseToBeCancelled, setCourseToBeCancelled] = useState(null);
  // Thêm state để lưu quiz results
  const [quizResults, setQuizResults] = useState([]);

  // Lấy thông tin user và các khóa học đã đăng ký
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await api.get('profile');
        if (res.status === 200 && res.data) {
          setUser(res.data);

          if (res.data.userId) {
            try {
              // Lấy danh sách khóa học đã đăng ký
              const enrolledRes = await api.get(`/enrollments/user/${res.data.userId}`);
              
              // Lấy kết quả quiz để tính trạng thái completed
              const quizResultsRes = await api.get('/quiz-result/my-results');

              if (Array.isArray(enrolledRes.data)) {
                const enrolledIds = [];
                const statuses = {};
                const completed = [];

                // Xử lý dữ liệu từ API enrollments
                enrolledRes.data.forEach(item => {
                  enrolledIds.push(item.courseId);
                  statuses[item.courseId] = item.status;

                  // Nếu khóa học đã hoàn thành theo enrollment, thêm vào danh sách completed
                  if (item.status === "Completed") {
                    completed.push(item.courseId);
                  }
                });

                // Kiểm tra quiz results để cập nhật trạng thái completed
                if (Array.isArray(quizResultsRes.data)) {
                  setQuizResults(quizResultsRes.data);
                  
                  // Group quiz results by course name
                  const courseQuizResults = {};
                  quizResultsRes.data.forEach(result => {
                    if (!courseQuizResults[result.courseName]) {
                      courseQuizResults[result.courseName] = [];
                    }
                    courseQuizResults[result.courseName].push(result);
                  });

                  // Kiểm tra từng khóa học đã enroll xem có pass quiz không
                  courses.forEach(course => {
                    if (enrolledIds.includes(course.id)) {
                      const courseResults = courseQuizResults[course.name];
                      
                      if (courseResults && courseResults.length > 0) {
                        // Tìm kết quả tốt nhất
                        const bestResult = Math.max(
                          ...courseResults.map(r => (r.score / r.totalQuestions) * 100)
                        );
                        
                        // Nếu đạt 80% trở lên và chưa có status Completed, cập nhật
                        if (bestResult >= 80 && statuses[course.id] !== 'Completed') {
                          statuses[course.id] = 'Completed';
                          if (!completed.includes(course.id)) {
                            completed.push(course.id);
                          }
                        }
                      }
                    }
                  });
                }

                setEnrolledCourses(enrolledIds);
                setCourseStatuses(statuses);
                setCompletedCourses(completed);

                console.log('Đã tải thông tin khóa học:', {
                  enrolledIds,
                  statuses,
                  completedCourses: completed
                });
              }
            } catch (err) {
              console.error('Lỗi khi tải thông tin khóa học đã đăng ký:', err);
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
  }, [courses]); // Thêm courses vào dependency để re-run khi courses load xong

  // 1. Fetch tất cả khóa học khi component mount
  useEffect(() => {
    const fetchAllCourses = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');

        const res = await api.get('/courses/list', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: '*/*',
          },
        });

        if (res.status === 200 && Array.isArray(res.data)) {
          setCourses(res.data);
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

    fetchAllCourses();
  }, []); // Chỉ gọi một lần khi component mount

  // 2. Lọc khóa học theo tên (client-side) khi search thay đổi
  useEffect(() => {
    // Đặt lại trang hiện tại mỗi khi tìm kiếm
    setCurrentPage(1);
  }, [search]);

  // Bắt đầu học khóa học
  const handleStartCourse = async (courseId) => {
    if (!user || !user.userId) {
      toast.error('Bạn cần đăng nhập để bắt đầu học');
      navigate('/login');
      return;
    }

    try {
      console.log(`Đăng ký khóa học ${courseId} cho người dùng ${user.userId}`);

      // Gọi API đăng ký khóa học với tham số đúng cấu trúc
      const res = await api.post(`/enrollments/enroll`, null, {
        params: {
          userId: user.userId,
          courseId: courseId
        }
      });

      if (res.status === 200) {
        toast.success('Đã đăng ký khóa học thành công');

        // Cập nhật state
        setEnrolledCourses(prev => [...prev, courseId]);
        setCourseStatuses(prev => ({ ...prev, [courseId]: 'InProgress' }));

        // Chuyển đến trang chi tiết khóa học
        navigate(`/course/${courseId}`);
      } else {
        toast.error('Đăng ký khóa học thất bại');
      }
    } catch (error) {
      console.error('Enroll error:', error);

      if (error.response && error.response.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }

      toast.error('Đã xảy ra lỗi khi đăng ký khóa học');
    }
  };

  // Hiển thị modal xác nhận hủy khóa học
  const handleCancelCourse = (courseId) => {
    if (!user || !user.userId) {
      toast.error('Bạn cần đăng nhập để thực hiện thao tác này');
      return;
    }

    setCourseToBeCancelled(courseId);
    setShowCancelModal(true);
  };

  // Xác nhận hủy đăng ký khóa học
  const confirmCancelCourse = async () => {
    try {
      // Gọi API để hủy đăng ký với phương thức PUT
      const res = await api.put(`/enrollments/unenroll`, null, {
        params: {
          userId: user.userId,
          courseId: courseToBeCancelled
        }
      });

      if (res.status === 200) {
        toast.success('Đã hủy đăng ký khóa học thành công');

        // Cập nhật trạng thái
        setCourseStatuses(prev => ({
          ...prev,
          [courseToBeCancelled]: 'Cancelled'
        }));

        setShowCancelModal(false);
        setCourseToBeCancelled(null);
      } else {
        toast.error('Hủy đăng ký khóa học thất bại');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Đã xảy ra lỗi khi hủy đăng ký khóa học');
    }
  };

  // Thêm hàm xử lý đăng ký lại khóa học
  const handleReEnrollCourse = async (courseId) => {
    if (!user || !user.userId) {
      toast.error('Bạn cần đăng nhập để đăng ký lại khóa học');
      navigate('/login');
      return;
    }

    try {
      console.log(`Đăng ký lại khóa học ${courseId} cho người dùng ${user.userId}`);

      // Gọi API đăng ký lại khóa học
      const res = await api.post(`/enrollments/enrollment/re-enroll`, null, {
        params: {
          courseId: courseId
        }
      });

      if (res.status === 200) {
        toast.success('Đăng ký lại khóa học thành công');

        // Cập nhật state
        setCourseStatuses(prev => ({ ...prev, [courseId]: 'InProgress' }));

        // Chuyển đến trang chi tiết khóa học
        navigate(`/course/${courseId}`);
      } else {
        toast.error('Đăng ký lại khóa học thất bại');
      }
    } catch (error) {
      console.error('Re-enroll error:', error);

      if (error.response && error.response.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }

      toast.error('Đã xảy ra lỗi khi đăng ký lại khóa học');
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

  // 3. Thay đổi hàm lọc để bao gồm cả lọc theo tên (search)
  const getFilteredCourses = () => {
    let filtered = [...courses];

    // Lọc theo search nếu có
    if (search.trim() !== '') {
      const searchTerm = search.trim().toLowerCase();
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm) ||
        (course.description && course.description.toLowerCase().includes(searchTerm))
      );
    }

    // Lọc theo trạng thái khóa học
    switch (activeFilter) {
      case 'recommended':
        if (userAgeGroup) {
          filtered = filtered.filter(course => course.targetAgeGroup === userAgeGroup);
        }
        break;
      case 'completed':
        filtered = filtered.filter(course => courseStatuses[course.id] === 'Completed' || completedCourses.includes(course.id));
        break;
      case 'enrolled':
        filtered = filtered.filter(course =>
          enrolledCourses.includes(course.id) &&
          courseStatuses[course.id] === 'InProgress'
        );
        break;
      case 'cancelled':
        filtered = filtered.filter(course => courseStatuses[course.id] === 'Cancelled');
        break;
      default:
        // 'all' - không cần lọc thêm
        break;
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

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Get status label in Vietnamese
  const getStatusLabel = (course) => {
    // Kiểm tra quiz results trước
    const courseResults = quizResults.filter(r => r.courseName === course.name);
    if (courseResults.length > 0) {
      const bestResult = Math.max(
        ...courseResults.map(r => (r.score / r.totalQuestions) * 100)
      );
      if (bestResult >= 80) {
        return 'Đã hoàn thành';
      }
    }

    // Fallback về status từ enrollment
    const status = courseStatuses[course.id];
    if (status === 'Completed' || completedCourses.includes(course.id)) {
      return 'Đã hoàn thành';
    } else if (status === 'InProgress') {
      return 'Đang học';
    } else if (status === 'Cancelled') {
      return 'Đã hủy';
    } else {
      return 'Chưa đăng ký';
    }
  };

  // Cập nhật hàm getStatusColorClass tương tự
  const getStatusColorClass = (course) => {
    // Kiểm tra quiz results trước
    const courseResults = quizResults.filter(r => r.courseName === course.name);
    if (courseResults.length > 0) {
      const bestResult = Math.max(
        ...courseResults.map(r => (r.score / r.totalQuestions) * 100)
      );
      if (bestResult >= 80) {
        return 'bg-green-100 text-green-800';
      }
    }

    // Fallback về status từ enrollment
    const status = courseStatuses[course.id];
    if (status === 'Completed' || completedCourses.includes(course.id)) {
      return 'bg-green-100 text-green-800';
    } else if (status === 'InProgress') {
      return 'bg-blue-100 text-blue-800';
    } else if (status === 'Cancelled') {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  // Thêm hàm để refresh trạng thái khi quay lại từ trang khác
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.userId) {
        // Refresh quiz results khi user quay lại trang
        refreshCourseStatuses();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Hàm refresh trạng thái khóa học
  const refreshCourseStatuses = async () => {
    if (!user?.userId) return;

    try {
      const quizResultsRes = await api.get('/quiz-result/my-results');
      
      if (Array.isArray(quizResultsRes.data)) {
        setQuizResults(quizResultsRes.data);
        
        // Cập nhật trạng thái completed dựa trên quiz results
        const updatedStatuses = { ...courseStatuses };
        const updatedCompleted = [...completedCourses];
        
        const courseQuizResults = {};
        quizResultsRes.data.forEach(result => {
          if (!courseQuizResults[result.courseName]) {
            courseQuizResults[result.courseName] = [];
          }
          courseQuizResults[result.courseName].push(result);
        });

        courses.forEach(course => {
          if (enrolledCourses.includes(course.id)) {
            const courseResults = courseQuizResults[course.name];
            
            if (courseResults && courseResults.length > 0) {
              const bestResult = Math.max(
                ...courseResults.map(r => (r.score / r.totalQuestions) * 100)
              );
              
              if (bestResult >= 80 && updatedStatuses[course.id] !== 'Completed') {
                updatedStatuses[course.id] = 'Completed';
                if (!updatedCompleted.includes(course.id)) {
                  updatedCompleted.push(course.id);
                }
              }
            }
          }
        });

        setCourseStatuses(updatedStatuses);
        setCompletedCourses(updatedCompleted);
        
        console.log('Đã refresh trạng thái khóa học:', {
          updatedStatuses,
          updatedCompleted
        });
      }
    } catch (error) {
      console.error('Error refreshing course statuses:', error);
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
              Khóa học phòng chống<br className="hidden sm:block" /> ma túy
            </h1>
            <p className="text-white/90 text-lg mb-6">
              Bộ tài liệu giáo dục tương tác được thiết kế để nâng cao nhận thức về ma túy và tác hại của chúng
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
              alt="Khóa học phòng chống ma túy"
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
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Danh sách khóa học</h2>

              {/* Filter buttons - Container tối ưu hơn, tự động điều chỉnh kích thước */}
              <div className="inline-flex items-center flex-wrap justify-center sm:justify-end border border-gray-200 rounded-full bg-gray-100 p-1.5 shadow-sm w-full sm:w-auto">
                <button
                  onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors m-0.5 ${activeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => { setActiveFilter('recommended'); setCurrentPage(1); }}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors m-0.5 ${activeFilter === 'recommended'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Phù hợp
                </button>
                <button
                  onClick={() => { setActiveFilter('completed'); setCurrentPage(1); }}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors m-0.5 ${activeFilter === 'completed'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Hoàn thành
                </button>
                <button
                  onClick={() => { setActiveFilter('enrolled'); setCurrentPage(1); }}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors m-0.5 ${activeFilter === 'enrolled'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Đang học
                </button>
                <button
                  onClick={() => { setActiveFilter('cancelled'); setCurrentPage(1); }}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors m-0.5 ${activeFilter === 'cancelled'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Đã hủy
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
                      <div className="flex items-center mb-3">
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mr-2 ${getStatusColorClass(course)}`}>
                          {getStatusLabel(course)}
                        </span>
                        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {course.targetAgeGroup === 'Teenagers' ? 'Thanh thiếu niên' : 'Người trưởng thành'}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-blue-700 mb-3">{course.name}</h3>
                      <p className="text-gray-700 mb-4">{course.description}</p>

                      <div className="flex flex-wrap gap-4 mb-4 text-gray-600 text-sm">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span><b>Bắt đầu:</b> {formatDate(course.startDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span><b>Kết thúc:</b> {formatDate(course.endDate)}</span>
                        </div>
                        {course.durationInMinutes > 0 && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span><b>Thời gian:</b> {course.durationInMinutes} phút</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/3 h-48 rounded-lg overflow-hidden">
                          <img
                            src={course.url || "https://res.cloudinary.com/dwjtg28ti/image/upload/v1751184828/raw_wdvcwx.png"}
                            alt={course.name}
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://res.cloudinary.com/dwjtg28ti/image/upload/v1751184828/raw_wdvcwx.png";
                            }}
                          />
                        </div>
                        <div className="w-full md:w-2/3 flex flex-col">
                          <div className="flex-grow">
                            <h4 className="font-semibold mb-2 text-gray-800">Giới thiệu khóa học</h4>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                              {course.description || "Khóa học này cung cấp kiến thức và kỹ năng để phòng chống và nhận biết các vấn đề liên quan đến ma túy, giúp bạn và cộng đồng xây dựng môi trường sống lành mạnh."}
                            </p>
                          </div>
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3 mt-auto">
                            {courseStatuses[course.id] === 'InProgress' ? (
                              <>
                                <Link
                                  to={`/course/${course.id}`}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                                >
                                  Tiếp tục học
                                </Link>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleCancelCourse(course.id);
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
                                >
                                  Hủy đăng ký
                                </button>
                              </>
                            ) : courseStatuses[course.id] === 'Completed' || completedCourses.includes(course.id) ? (
                              <Link
                                to={`/course/${course.id}`}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
                              >
                                Xem lại
                              </Link>
                            ) : courseStatuses[course.id] === 'Cancelled' ? (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleReEnrollCourse(course.id);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                              >
                                Đăng ký lại
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleStartCourse(course.id);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                              >
                                Bắt đầu học
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
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
            {/* About Courses Box */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
              <h3 className="text-xl font-bold text-blue-700 mb-4">Về khóa học phòng chống ma túy</h3>
              <div className="text-gray-700 mb-4">
                Các khóa học được thiết kế bởi chuyên gia để nâng cao nhận thức về ma túy và cách phòng tránh. Khi tham gia, bạn sẽ được:
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Kiến thức chính xác và cập nhật về các loại ma túy</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Kỹ năng nhận biết và từ chối ma túy hiệu quả</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Bài học tương tác và kiểm tra kiến thức</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Chứng nhận hoàn thành khóa học</span>
                </li>
              </ul>
            </div>

            {/* Start Learning Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-blue-800">Bắt đầu học ngay!</h3>
              </div>
              <div className="text-gray-700 mb-4">
                Hãy tham gia các khóa học để trang bị kiến thức và kỹ năng cần thiết trong việc phòng chống ma túy và bảo vệ bản thân!
              </div>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xl text-purple-500">📚</span>
                <span className="text-gray-700">Học mọi lúc, mọi nơi với nội dung được thiết kế phù hợp với độ tuổi.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl text-blue-600">🏆</span>
                <span className="text-gray-700">Nhận chứng nhận hoàn thành và chia sẻ kiến thức với bạn bè, gia đình.</span>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê khóa học</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{courses.length}</p>
                  <p className="text-gray-600 text-sm">Tổng số khóa học</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">
                    {enrolledCourses.filter(id => courseStatuses[id] === 'InProgress').length}
                  </p>
                  <p className="text-gray-600 text-sm">Đang học</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700">
                    {completedCourses.length}
                  </p>
                  <p className="text-gray-600 text-sm">Đã hoàn thành</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-purple-700">
                    {userAgeGroup ? courses.filter(course => course.targetAgeGroup === userAgeGroup).length : 0}
                  </p>
                  <p className="text-gray-600 text-sm">Phù hợp với bạn</p>
                </div>
              </div>
            </div>

            {/* FAQs Box */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Câu hỏi thường gặp</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">Các khóa học có tính phí không?</h4>
                  <p className="text-gray-600 text-sm">Không, tất cả khóa học đều miễn phí và được phát triển nhằm mục đích giáo dục cộng đồng.</p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">Tôi có thể học trong bao lâu?</h4>
                  <p className="text-gray-600 text-sm">Bạn có thể học theo tốc độ của riêng mình, không có giới hạn thời gian.</p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">Làm thế nào để nhận chứng nhận?</h4>
                  <p className="text-gray-600 text-sm">Hoàn thành tất cả bài học và bài kiểm tra trong khóa học để nhận chứng nhận.</p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">Tôi có thể đăng ký nhiều khóa học không?</h4>
                  <p className="text-gray-600 text-sm">Có, bạn có thể đăng ký và học nhiều khóa học cùng lúc.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Xác nhận hủy đăng ký</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn hủy đăng ký khóa học này? Tiến độ học tập sẽ bị mất và bạn sẽ cần đăng ký lại để tiếp tục.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmCancelCourse}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default CoursesListPage;