import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';

function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [progress, setProgress] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);

  // Lấy thông tin user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('profile');
        if (res.status === 200 && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    fetchUser();
  }, []);

  // Lấy thông tin khóa học và bài học
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        
        // Lấy thông tin chi tiết khóa học
        const courseRes = await api.get(`/courses/${id}`);
        if (courseRes.status === 200) {
          setCourse(courseRes.data);
        }
        
        // Lấy danh sách bài học của khóa học
        const lessonsRes = await api.get(`/lessons/course/${id}`);
        if (lessonsRes.status === 200 && Array.isArray(lessonsRes.data)) {
          // Sắp xếp bài học theo thứ tự
          const sortedLessons = lessonsRes.data.sort((a, b) => a.lessonOrder - b.lessonOrder);
          setLessons(sortedLessons);
          
          // Nếu có bài học, đặt bài học đầu tiên là bài học hiện tại
          if (sortedLessons.length > 0) {
            setCurrentLesson(sortedLessons[0]);
          }
        }
        
        // Lấy danh sách bài quiz của khóa học
        const quizzesRes = await api.get(`/quiz/course/${id}`);
        if (quizzesRes.status === 200 && Array.isArray(quizzesRes.data) && quizzesRes.data.length > 0) {
          setQuiz(quizzesRes.data[0]); // Chỉ lấy bài kiểm tra đầu tiên
        }
        
        // Nếu user đã đăng nhập, lấy thông tin tiến độ học tập
        if (user?.userId) {
          try {
            // Lấy thông tin tiến độ các bài học đã hoàn thành
            const progressRes = await api.get(`/progress/user/${user.userId}`);
            
            if (progressRes.status === 200 && Array.isArray(progressRes.data)) {
              // Lọc các bài học thuộc khóa học hiện tại
              const courseProgress = progressRes.data.filter(
                progress => progress.lesson.course.id === Number(id)
              );
              
              // Lấy danh sách ID của các bài học đã hoàn thành
              const completedLessonIds = courseProgress.map(progress => progress.lesson.id);
              
              // Lưu trữ trực tiếp vào state mới
              setCompletedLessons(completedLessonIds);
              
              // Tính toán tiến độ học tập
              const totalLessons = lessonsRes.data.length + (quiz ? 1 : 0);
              if (totalLessons > 0) {
                setProgress(Math.round((completedLessonIds.length / totalLessons) * 100));
              }
              
              // Vẫn có thể lưu thông tin enrollment nếu cần
              try {
                const enrollmentRes = await api.get(`/enrollments/status`, {
                  params: {
                    userId: user.userId,
                    courseId: id
                  }
                });
                
                if (enrollmentRes.status === 200) {
                  // Kết hợp thông tin từ cả hai API
                  setEnrollment({
                    ...enrollmentRes.data,
                    completedLessons: completedLessonIds
                  });
                }
              } catch (enrollErr) {
                console.error('Failed to fetch enrollment status:', enrollErr);
              }
            }
          } catch (err) {
            console.error('Failed to fetch progress:', err);
          }
        }
      } catch (err) {
        console.error('Failed to fetch course details:', err);
        toast.error('Không thể tải thông tin khóa học');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchCourseDetails();
    }
  }, [id, user]);

  // Xử lý khi chọn bài học
  const handleSelectLesson = (lesson) => {
    setCurrentLesson(lesson);
    setActiveTab('content');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Xử lý khi bắt đầu làm quiz
  const handleStartQuiz = () => {
    if (course && course.id) {
      navigate(`/quiz/${course.id}`);
    } else {
      toast.error('Không thể bắt đầu bài kiểm tra. Vui lòng thử lại sau.');
    }
  };

  // Đánh dấu bài học đã hoàn thành
  const handleMarkComplete = async () => {
    if (!user?.userId || !currentLesson?.id) {
      toast.error('Bạn cần đăng nhập để đánh dấu bài học hoàn thành');
      return;
    }

    try {
      setLoadingProgress(true);
      
      // Gọi API đánh dấu bài học hoàn thành
      const res = await api.post('/progress/complete', null, {
        params: {
          userId: user.userId,
          lessonId: currentLesson.id
        }
      });
      
      if (res.status === 200) {
        toast.success('Đã đánh dấu bài học hoàn thành');
        
        // Lấy danh sách bài học đã hoàn thành sử dụng API đúng
        const progressRes = await api.get(`/progress/user/${user.userId}`);
        
        if (progressRes.status === 200 && Array.isArray(progressRes.data)) {
          // Lọc các bài học thuộc khóa học hiện tại
          const courseProgress = progressRes.data.filter(
            progress => progress.lesson.course.id === Number(id)
          );
          
          // Tạo một mảng chỉ chứa ID của các bài học đã hoàn thành
          const completedLessonIds = courseProgress.map(progress => progress.lesson.id);
          
          // Cập nhật state mới
          setCompletedLessons(completedLessonIds);
          
          // Tính toán lại tiến độ học tập
          const completedCount = completedLessonIds.length;
          const totalLessons = lessons.length + (quiz ? 1 : 0);
          if (totalLessons > 0) {
            setProgress(Math.round((completedCount / totalLessons) * 100));
          }
        }
        
        // Tự động chuyển đến bài học tiếp theo nếu có
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        if (currentIndex < lessons.length - 1) {
          setCurrentLesson(lessons[currentIndex + 1]);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
      toast.error('Không thể đánh dấu bài học hoàn thành');
    } finally {
      setLoadingProgress(false);
    }
  };

  // Hàm kiểm tra bài học đã hoàn thành mới
  const isLessonCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
  };

  // Chuyển đổi URL YouTube thành dạng nhúng
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    
    try {
      // Xử lý các định dạng URL YouTube khác nhau
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
      
      if (url.includes('youtube.com/embed/')) {
        return url;
      }
      
      if (url.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(url)) {
        return `https://www.youtube.com/embed/${url}`;
      }
    } catch (err) {
      console.error("Lỗi xử lý URL YouTube:", err);
    }
    
    return url;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow">
        <div className="max-w-6xl mx-auto py-8 px-4">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700 mb-4"></div>
              <p className="text-gray-600">Đang tải thông tin khóa học...</p>
            </div>
          ) : course ? (
            <>
              {/* Course Header */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-6">
                  <h1 className="text-3xl font-bold mb-3">{course.name}</h1>
                  <p className="text-blue-100 mb-4">{course.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    {/* <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-blue-100">Tiến độ khóa học</span>
                      <span className="text-sm font-medium text-blue-100">{progress}%</span>
                    </div> */}
                    {/* <div className="w-full bg-blue-800 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-yellow-400 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div> */}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-2/3">
                      {/* Course Meta */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span><b>Bài học:</b> {lessons.length}</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span><b>Bài kiểm tra:</b> {quiz ? 1 : 0}</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span><b>Nhóm tuổi:</b> {course.targetAgeGroup === 'Teenagers' ? 'Thanh thiếu niên' : 'Người trưởng thành'}</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span><b>Ngày bắt đầu:</b> {new Date(course.startDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span><b>Ngày kết thúc:</b> {new Date(course.endDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Course Image */}
                    <div className="w-full md:w-1/3 flex justify-center md:justify-end">
                      {course.url && course.url !== 'no' && course.url !== 'none' ? (
                        <img 
                          src={course.url} 
                          alt={course.name} 
                          className="w-full max-w-xs h-auto object-cover rounded-lg shadow-md"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://res.cloudinary.com/dwjtg28ti/image/upload/v1751184828/raw_wdvcwx.png";
                          }}
                        />
                      ) : (
                        <img 
                          src="https://res.cloudinary.com/dwjtg28ti/image/upload/v1751184828/raw_wdvcwx.png" 
                          alt={course.name} 
                          className="w-full max-w-xs h-auto object-cover rounded-lg shadow-md"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Tabs */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="border-b border-gray-200">
                  <nav className="flex flex-wrap">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-6 py-3 text-sm font-medium transition ${
                        activeTab === 'overview'
                          ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Tổng quan
                    </button>
                    <button
                      onClick={() => setActiveTab('content')}
                      className={`px-6 py-3 text-sm font-medium transition ${
                        activeTab === 'content'
                          ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Nội dung bài học
                    </button>
                    <button
                      onClick={() => setActiveTab('quizzes')}
                      className={`px-6 py-3 text-sm font-medium transition ${
                        activeTab === 'quizzes'
                          ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Bài kiểm tra
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="animate-fadeIn">
                      <h2 className="text-xl font-bold text-gray-800 mb-4">Giới thiệu khóa học</h2>
                      <div className="prose max-w-none text-gray-700">
                        <p className="mb-4">{course.description}</p>
                        <p>Khóa học này gồm {lessons.length} bài học và {quiz ? 1 : 0} bài kiểm tra. Hãy hoàn thành tất cả các bài học và bài kiểm tra để có được chứng nhận hoàn thành khóa học.</p>
                        
                        <h3 className="text-lg font-semibold mt-6 mb-3">Bạn sẽ học được gì?</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-5">
                          <li className="flex items-start">
                            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Hiểu biết chính xác về các loại ma túy và tác hại của chúng</span>
                          </li>
                          <li className="flex items-start">
                            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Nhận biết dấu hiệu sử dụng ma túy ở người thân và bạn bè</span>
                          </li>
                          <li className="flex items-start">
                            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Kỹ năng từ chối ma túy khi bị dụ dỗ</span>
                          </li>
                          <li className="flex items-start">
                            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Cách hỗ trợ người thân đang gặp vấn đề về ma túy</span>
                          </li>
                          <li className="flex items-start">
                            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Các nguồn lực và dịch vụ hỗ trợ trong cộng đồng</span>
                          </li>
                        </ul>
                        
                        <div className="mt-8 flex justify-center">
                          <button 
                            onClick={() => {
                              setActiveTab('content');
                              if (lessons.length > 0) {
                                setCurrentLesson(lessons[0]);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition shadow-sm hover:shadow-md flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Bắt đầu học ngay
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content Tab */}
                  {activeTab === 'content' && (
                    <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn">
                      {/* Lesson Content */}
                      <div className="w-full lg:w-2/3">
                        {currentLesson ? (
                          <>
                            <div className="flex justify-between items-center mb-4">
                              <h2 className="text-xl font-bold text-gray-800">{currentLesson.title}</h2>
                              
                              {isLessonCompleted(currentLesson.id) && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Đã hoàn thành
                                </span>
                              )}
                            </div>
                            
                            {/* Video từ materialUrl */}
                            {currentLesson.materialUrl && (
                              <div className="mb-6 rounded-lg overflow-hidden shadow-md">
                                <div className="relative pt-[56.25%]"> {/* 16:9 Aspect Ratio */}
                                  <iframe
                                    src={getYoutubeEmbedUrl(currentLesson.materialUrl)}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                                    title={currentLesson.title}
                                  ></iframe>
                                </div>
                              </div>
                            )}
                            
                            {/* Lesson Content */}
                            <div className="prose max-w-none text-gray-700 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                              <div dangerouslySetInnerHTML={{ __html: currentLesson.content }}></div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="mt-8 flex justify-between items-center">
                              <button
                                onClick={() => {
                                  const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
                                  if (currentIndex > 0) {
                                    setCurrentLesson(lessons[currentIndex - 1]);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }
                                }}
                                disabled={lessons.findIndex(l => l.id === currentLesson.id) === 0}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Bài trước
                              </button>
                              
                              {isLessonCompleted(currentLesson.id) ? (
                                <div className="flex items-center text-green-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>Bài học đã hoàn thành</span>
                                </div>
                              ) : (
                                <button
                                  onClick={handleMarkComplete}
                                  disabled={loadingProgress}
                                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition disabled:opacity-70"
                                >
                                  {loadingProgress ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Đang xử lý...
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Đánh dấu hoàn thành
                                    </>
                                  )}
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
                                  if (currentIndex < lessons.length - 1) {
                                    setCurrentLesson(lessons[currentIndex + 1]);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  } else if (quiz) {
                                    setActiveTab('quizzes');
                                  }
                                }}
                                disabled={lessons.findIndex(l => l.id === currentLesson.id) === lessons.length - 1 && !quiz}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                Bài tiếp theo
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-500">Chưa có bài học nào cho khóa học này</p>
                            <Link 
                              to="/courseList" 
                              className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                              </svg>
                              Quay lại danh sách khóa học
                            </Link >
                          </div>
                        )}
                      </div>
                      
                      {/* Lesson List */}
                      <div className="w-full lg:w-1/3">
                        <div className="sticky top-4">
                          <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                            <div className="p-4 border-b border-gray-200 bg-gray-100 rounded-t-lg">
                              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Danh sách bài học
                              </h3>
                            </div>
                            <div className="p-4 max-h-[500px] overflow-y-auto">
                              <div className="space-y-2">
                                {lessons.length > 0 ? (
                                  lessons.map((lesson, index) => {
                                    const completed = isLessonCompleted(lesson.id);
                                    return (
                                      <button
                                        key={lesson.id}
                                        onClick={() => handleSelectLesson(lesson)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                                          currentLesson?.id === lesson.id
                                            ? 'bg-blue-100 border border-blue-200'
                                            : completed
                                              ? 'bg-green-50 hover:bg-green-100 border border-green-100'
                                              : 'bg-white hover:bg-gray-100 border border-gray-200'
                                        }`}
                                      >
                                        <div className="flex items-center">
                                          <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                                            completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                                          } text-sm`}>
                                            {completed ? (
                                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                            ) : (
                                              index + 1
                                            )}
                                          </span>
                                          <div className="text-left">
                                            <span className={`block ${currentLesson?.id === lesson.id ? 'font-medium' : ''} ${completed ? 'text-green-700' : ''}`}>
                                              {lesson.title}
                                            </span>
                                            <span className="text-xs text-gray-500">Bài {index + 1}</span>
                                          </div>
                                        </div>
                                        {currentLesson?.id === lesson.id && (
                                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                        )}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <p className="text-gray-500 text-center py-4">Không có bài học nào</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {quiz && (
                            <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                              <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Bài kiểm tra
                              </h4>
                              <p className="text-sm text-yellow-700 mb-3">
                                Hoàn thành các bài học để mở khóa bài kiểm tra cuối khóa.
                              </p>
                              <button 
                                onClick={() => setActiveTab('quizzes')}
                                className="w-full text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-3 rounded transition flex items-center justify-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                                Xem bài kiểm tra
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quizzes Tab */}
                  {activeTab === 'quizzes' && (
                    <div className="animate-fadeIn">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Bài kiểm tra</h2>
                        <button 
                          onClick={() => setActiveTab('content')}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Quay lại bài học
                        </button>
                      </div>
                      
                      {quiz ? (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition">
                          <div className="p-5">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800">Bài kiểm tra cuối khóa</h3>
                                <p className="text-gray-600 mt-1">{course?.name}</p>
                                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Thời gian: {quiz.timeLimit || 'Không giới hạn'}</span>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Số câu hỏi: {quiz.questionCount || '?'}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={handleStartQuiz}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium transition flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Làm bài kiểm tra
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <p className="text-gray-600 mb-2">Chưa có bài kiểm tra cho khóa học này</p>
                          <p className="text-gray-500 text-sm">Hãy hoàn thành các bài học trước khi làm bài kiểm tra.</p>
                          <button
                            onClick={() => setActiveTab('content')}
                            className="mt-4 text-blue-600 hover:text-blue-800 inline-flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Quay lại bài học
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy khóa học</h3>
              <p className="text-gray-500 mb-4">
                Khóa học bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
              </p>
              <Link
                to="/courseList"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay lại danh sách khóa học
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      {/* Add this to your CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default CourseDetailPage;