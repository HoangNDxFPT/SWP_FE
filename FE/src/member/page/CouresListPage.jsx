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
              // Lấy danh sách khóa học đã đăng ký và trạng thái
              const enrolledRes = await api.get(`/enrollments/user/${res.data.userId}`);
              
              if (Array.isArray(enrolledRes.data)) {
                const enrolledIds = [];
                const statuses = {};
                const completed = [];
                
                // Xử lý dữ liệu từ API
                enrolledRes.data.forEach(item => {
                  enrolledIds.push(item.courseId);
                  statuses[item.courseId] = item.status;
                  
                  // Nếu khóa học đã hoàn thành, thêm vào danh sách completed
                  if (item.status === "Completed") {
                    completed.push(item.courseId);
                  }
                });
                
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
  }, []);

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
        setCourseStatuses(prev => ({...prev, [courseId]: 'InProgress'}));
        
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
        setCourseStatuses(prev => ({...prev, [courseId]: 'InProgress'}));
        
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
    
    // Lọc theo trạng thái khóa học (giữ nguyên code cũ)
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
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Get status label in Vietnamese
  const getStatusLabel = (course) => {
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

  // Get status color class
  const getStatusColorClass = (course) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 py-12 px-4 shadow-md">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Khóa học phòng chống ma túy
          </h1>
          <p className="text-white/90 text-lg max-w-3xl mx-auto mb-6">
            Bộ tài liệu giáo dục tương tác được thiết kế để nâng cao nhận thức về ma túy và tác hại của chúng
          </p>
          <div className="flex justify-center">
            <div className="relative max-w-md w-full">
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full p-3 pl-10 rounded-lg shadow-sm focus:outline-none"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-full ${activeFilter === 'all'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => { setActiveFilter('recommended'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-full ${activeFilter === 'recommended'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Phù hợp với bạn
          </button>
          <button
            onClick={() => { setActiveFilter('completed'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-full ${activeFilter === 'completed'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Đã hoàn thành
          </button>
          <button
            onClick={() => { setActiveFilter('enrolled'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-full ${activeFilter === 'enrolled'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Đang học
          </button>
          <button
            onClick={() => { setActiveFilter('cancelled'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-full ${activeFilter === 'cancelled'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Đã hủy
          </button>
        </div>

        {/* Courses List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-auto">
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
              <div 
                key={course.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300"
              >
                <div className="md:flex">
                  {/* Course Image */}
                  <div className="md:w-1/3 h-48 md:h-auto">
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
                  
                  {/* Course Content */}
                  <div className="p-6 md:w-2/3">
                    <div className="flex flex-wrap items-start justify-between mb-2">
                      {/* Course Status */}
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-2 mr-2 ${getStatusColorClass(course)}`}>
                        {getStatusLabel(course)}
                      </span>
                      
                      {/* Target Age Group */}
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mb-2">
                        {course.targetAgeGroup === 'Teenagers' ? 'Thanh thiếu niên' : 'Người trưởng thành'}
                      </span>
                    </div>
                    
                    {/* Course Name */}
                    <h3 className="text-xl font-bold text-blue-700 mb-2">{course.name}</h3>
                    
                    {/* Course Date */}
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(course.startDate)} - {formatDate(course.endDate)}</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {/* Nút tùy theo trạng thái khóa học */}
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
                      
                      <Link 
                        to={`/course/${course.id}`}
                        className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-10">
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