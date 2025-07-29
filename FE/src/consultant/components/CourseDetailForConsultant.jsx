import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

function CourseDetailForConsultant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);
      try {
        const courseRes = await api.get(`/courses/${id}`);
        setCourse(courseRes.data);
        const lessonsRes = await api.get(`/lessons/course/${id}`);
        setLessons(lessonsRes.data || []);
        const quizzesRes = await api.get(`/quiz/course/${id}`);
        setQuiz(Array.isArray(quizzesRes.data) ? quizzesRes.data[0] : null);
      } catch (err) {
        navigate('/consultant/courses');
        console.error('Error fetching course details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetails();
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-3xl mx-auto py-8 px-4">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700 mb-4"></div>
              <p className="text-gray-600">Đang tải thông tin khóa học...</p>
            </div>
          ) : course ? (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2 text-blue-800">{course.name}</h1>
                  <p className="text-gray-700 mb-4">{course.description}</p>
                  <div className="flex gap-3 mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {course.targetAgeGroup === 'Teenagers' ? 'Thanh thiếu niên' : 'Người trưởng thành'}
                    </span>
                    <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                      Bắt đầu: {new Date(course.startDate).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                      Kết thúc: {new Date(course.endDate).toLocaleDateString('vi-VN')}
                    </span>
                    {course.durationInMinutes > 0 && (
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        Thời gian: {course.durationInMinutes} phút
                      </span>
                    )}
                  </div>
                  <div className="mb-6">
                    <h2 className="text-lg font-bold mb-2 text-blue-700">Danh sách bài học</h2>
                    <ol className="space-y-3 pl-4">
                      {lessons.length > 0 ? lessons.map((lesson, idx) => (
                        <li key={lesson.id} className="flex items-start gap-2">
                          <span className="inline-block w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">{idx + 1}</span>
                          <div>
                            <div className="font-semibold">{lesson.title}</div>
                            <div className="text-xs text-gray-500">{lesson.summary || ''}</div>
                          </div>
                        </li>
                      )) : (
                        <li className="text-gray-500">Chưa có bài học</li>
                      )}
                    </ol>
                  </div>
                  
                </div>
                <div className="md:w-1/3 flex justify-center">
                  <img
                    src={course.url || "https://res.cloudinary.com/dwjtg28ti/image/upload/v1751184828/raw_wdvcwx.png"}
                    alt={course.name}
                    className="w-52 h-52 object-cover rounded-xl border shadow-lg"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <Link to="/consultant/courses" className="text-blue-600 hover:underline flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Quay lại danh sách
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy khóa học</h3>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CourseDetailForConsultant;
