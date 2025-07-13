import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaPlay, FaCheck, FaArrowLeft, FaArrowRight, FaClock, FaQuestionCircle, FaEye, FaRedo } from 'react-icons/fa';

function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [user, setUser] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [activeTab, setActiveTab] = useState('lessons');
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch user profile
        const userRes = await api.get('/profile');
        if (userRes.status === 200) {
          setUser(userRes.data);
        }

        // Fetch course details
        const courseRes = await api.get(`/courses/${id}`);
        if (courseRes.status === 200) {
          setCourse(courseRes.data);
        }

        // Fetch lessons
        const lessonsRes = await api.get(`/lessons/course/${id}`);
        if (lessonsRes.status === 200 && Array.isArray(lessonsRes.data)) {
          const sortedLessons = lessonsRes.data.sort((a, b) => a.lessonOrder - b.lessonOrder);
          setLessons(sortedLessons);
          if (sortedLessons.length > 0) {
            setCurrentLesson(sortedLessons[0]);
          }
        }

        // Fetch quiz
        const quizRes = await api.get(`/quiz/course/${id}`);
        if (quizRes.status === 200 && Array.isArray(quizRes.data) && quizRes.data.length > 0) {
          setQuiz(quizRes.data[0]);
        }

        // Fetch progress if user is logged in
        if (userRes.data?.userId) {
          const progressRes = await api.get(`/progress/user/${userRes.data.userId}`);
          if (progressRes.status === 200 && Array.isArray(progressRes.data)) {
            const courseProgress = progressRes.data.filter(
              progress => progress.lesson.course.id === Number(id)
            );
            const completedIds = courseProgress.map(progress => progress.lesson.id);
            setCompletedLessons(completedIds);
          }
        }

        // Fetch quiz results luôn (không chỉ khi ở tab quiz-history)
        if (courseRes.data?.name) {
          try {
            const quizResultsRes = await api.get('/quiz-result/my-results');
            if (quizResultsRes.status === 200 && Array.isArray(quizResultsRes.data)) {
              const courseResults = quizResultsRes.data.filter(
                result => result.courseName === courseRes.data.name
              );
              setQuizResults(courseResults.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
            }
          } catch (quizError) {
            console.error('Error fetching quiz results:', quizError);
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Không thể tải thông tin khóa học');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Helper functions
  const isLessonCompleted = (lessonId) => completedLessons.includes(lessonId);

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
      if (url.includes('youtube.com/embed/')) return url;
      if (url.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(url)) {
        return `https://www.youtube.com/embed/${url}`;
      }
    } catch (err) {
      console.error("Error processing YouTube URL:", err);
    }
    return url;
  };

  const calculateProgress = () => {
    const totalItems = lessons.length + (quiz ? 1 : 0);
    if (totalItems === 0) return 0;
    
    let completed = completedLessons.length;
    
    // Debug quiz results
    console.log('Quiz results for progress calculation:', quizResults);
    console.log('Course name:', course?.name);
    
    const bestResult = quizResults.length > 0 
      ? Math.max(...quizResults.map(r => (r.score / r.totalQuestions) * 100))
      : 0;
      
    console.log('Best quiz result:', bestResult);
    
    if (bestResult >= 80) {
      completed += 1; // Quiz passed
      console.log('Quiz passed, adding 1 to completed');
    }
    
    const progress = Math.round((completed / totalItems) * 100);
    console.log(`Progress: ${completed}/${totalItems} = ${progress}%`);
    
    return progress;
  };

  // Event handlers
  const handleSelectLesson = (lesson) => {
    setCurrentLesson(lesson);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkComplete = async () => {
    if (!user?.userId || !currentLesson?.id) {
      toast.error('Bạn cần đăng nhập để đánh dấu bài học hoàn thành');
      return;
    }

    try {
      setLoadingProgress(true);
      const res = await api.post('/progress/complete', null, {
        params: { userId: user.userId, lessonId: currentLesson.id }
      });

      if (res.status === 200) {
        toast.success('Đã đánh dấu bài học hoàn thành');
        
        // Update completed lessons
        const progressRes = await api.get(`/progress/user/${user.userId}`);
        if (progressRes.status === 200) {
          const courseProgress = progressRes.data.filter(
            progress => progress.lesson.course.id === Number(id)
          );
          setCompletedLessons(courseProgress.map(progress => progress.lesson.id));
        }

        // Auto navigate to next lesson
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        if (currentIndex < lessons.length - 1) {
          setCurrentLesson(lessons[currentIndex + 1]);
        }
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error('Không thể đánh dấu bài học hoàn thành');
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleStartQuiz = () => {
    if (course?.id) {
      navigate(`/quiz/${course.id}`);
    } else {
      toast.error('Không thể bắt đầu bài kiểm tra');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải khóa học...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy khóa học</h3>
            <p className="text-gray-500 mb-4">Khóa học không tồn tại hoặc đã bị xóa.</p>
            <Link to="/courseList" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <FaArrowLeft className="mr-2" />
              Quay lại danh sách khóa học
            </Link>
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
          
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm">
              <li><Link to="/dashboard" className="text-blue-600 hover:text-blue-800">Trang chủ</Link></li>
              <li className="text-gray-400">/</li>
              <li><Link to="/courseList" className="text-blue-600 hover:text-blue-800">Khóa học</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-600">{course.name}</li>
            </ol>
          </nav>

          {/* Course Header */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-grow">
                  <h1 className="text-3xl font-bold mb-3">{course.name}</h1>
                  <p className="text-blue-100 mb-4">{course.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center">
                      <FaPlay className="mr-2" />
                      <span>{lessons.length} bài học</span>
                    </div>
                    <div className="flex items-center">
                      <FaQuestionCircle className="mr-2" />
                      <span>{quiz ? 1 : 0} bài kiểm tra</span>
                    </div>
                    <div className="flex items-center">
                      <FaClock className="mr-2" />
                      <span>{course.durationInMinutes || 30} phút</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm">Tiến độ: {calculateProgress()}%</span>
                    </div>
                  </div>
                </div>
                
                {course.url && course.url !== 'no' && (
                  <div className="w-full lg:w-64">
                    <img
                      src={course.url}
                      alt={course.name}
                      className="w-full h-32 lg:h-40 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = "https://res.cloudinary.com/dwjtg28ti/image/upload/v1751184828/raw_wdvcwx.png";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-4 bg-gray-50">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Hoàn thành {completedLessons.length}/{lessons.length} bài học
                {(() => {
                  const bestResult = quizResults.length > 0 
                    ? Math.max(...quizResults.map(r => (r.score / r.totalQuestions) * 100))
                    : 0;
                  return quiz && bestResult >= 80 ? " và bài kiểm tra" : 
                         quiz ? ` (bài kiểm tra: ${Math.round(bestResult)}%)` : "";
                })()}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('lessons')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'lessons'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Bài học ({lessons.length})
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'quiz'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Bài kiểm tra
                </button>
                <button
                  onClick={() => setActiveTab('quiz-history')}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === 'quiz-history'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Lịch sử ({quizResults.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Lessons Tab */}
              {activeTab === 'lessons' && (
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Lesson Content */}
                  <div className="w-full lg:w-2/3">
                    {currentLesson ? (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-bold text-gray-800">{currentLesson.title}</h2>
                          {isLessonCompleted(currentLesson.id) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FaCheck className="mr-1" />
                              Đã hoàn thành
                            </span>
                          )}
                        </div>

                        {/* Video */}
                        {currentLesson.materialUrl && (
                          <div className="mb-6 rounded-lg overflow-hidden shadow-md">
                            <div className="relative pt-[56.25%]">
                              <iframe
                                src={getYoutubeEmbedUrl(currentLesson.materialUrl)}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute top-0 left-0 w-full h-full"
                                title={currentLesson.title}
                              ></iframe>
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <div className="prose max-w-none bg-gray-50 p-6 rounded-lg">
                          <div dangerouslySetInnerHTML={{ __html: currentLesson.content }}></div>
                        </div>

                        {/* Navigation */}
                        <div className="mt-6 flex justify-between items-center">
                          <button
                            onClick={() => {
                              const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
                              if (currentIndex > 0) {
                                setCurrentLesson(lessons[currentIndex - 1]);
                              }
                            }}
                            disabled={lessons.findIndex(l => l.id === currentLesson.id) === 0}
                            className="flex items-center px-4 py-2 border rounded-md disabled:opacity-50"
                          >
                            <FaArrowLeft className="mr-2" />
                            Bài trước
                          </button>

                          {!isLessonCompleted(currentLesson.id) && (
                            <button
                              onClick={handleMarkComplete}
                              disabled={loadingProgress}
                              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70"
                            >
                              {loadingProgress ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <FaCheck className="mr-2" />
                              )}
                              Hoàn thành
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
                              if (currentIndex < lessons.length - 1) {
                                setCurrentLesson(lessons[currentIndex + 1]);
                              }
                            }}
                            disabled={lessons.findIndex(l => l.id === currentLesson.id) === lessons.length - 1}
                            className="flex items-center px-4 py-2 border rounded-md disabled:opacity-50"
                          >
                            Bài tiếp theo
                            <FaArrowRight className="ml-2" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-500">Chưa có bài học nào</p>
                      </div>
                    )}
                  </div>

                  {/* Lesson List */}
                  <div className="w-full lg:w-1/3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">Danh sách bài học</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {lessons.map((lesson, index) => (
                          <button
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson)}
                            className={`w-full flex items-center p-3 rounded-lg text-left transition ${
                              currentLesson?.id === lesson.id
                                ? 'bg-blue-100 border border-blue-200'
                                : isLessonCompleted(lesson.id)
                                ? 'bg-green-50 hover:bg-green-100'
                                : 'bg-white hover:bg-gray-100'
                            }`}
                          >
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 text-sm ${
                              isLessonCompleted(lesson.id) 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {isLessonCompleted(lesson.id) ? <FaCheck /> : index + 1}
                            </span>
                            <div className="flex-grow">
                              <div className="font-medium">{lesson.title}</div>
                              <div className="text-xs text-gray-500">Bài {index + 1}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Tab */}
              {activeTab === 'quiz' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Bài kiểm tra</h2>
                  {quiz ? (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Bài kiểm tra cuối khóa</h3>
                      <p className="text-gray-600 mb-4">Hoàn thành bài kiểm tra để nhận chứng nhận</p>
                      <button
                        onClick={handleStartQuiz}
                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <FaPlay className="mr-2" />
                        Làm bài kiểm tra
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Chưa có bài kiểm tra nào</p>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz History Tab */}
              {activeTab === 'quiz-history' && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Lịch sử làm bài</h2>
                  {quizResults.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm số</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kết quả</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {quizResults.map((result) => {
                            const percentage = Math.round((result.score / result.totalQuestions) * 100);
                            const passed = percentage >= 80;
                            
                            return (
                              <tr key={result.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {new Date(result.submittedAt).toLocaleString('vi-VN')}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  {result.score}/{result.totalQuestions} ({percentage}%)
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {passed ? <FaCheck className="mr-1" /> : '✗'}
                                    {passed ? 'Đạt' : 'Chưa đạt'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Link
                                    to={`/quiz-result/${result.id}`}
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                  >
                                    <FaEye className="mr-1" />
                                    Chi tiết
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      
                      {quiz && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={handleStartQuiz}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            <FaRedo className="mr-2" />
                            Làm lại bài kiểm tra
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">Chưa có lịch sử làm bài</p>
                      {quiz && (
                        <button
                          onClick={handleStartQuiz}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          <FaPlay className="mr-2" />
                          Bắt đầu làm bài
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default CourseDetailPage;