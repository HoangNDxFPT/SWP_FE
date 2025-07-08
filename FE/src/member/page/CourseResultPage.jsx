import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';

function CourseResultPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams(); // ID của quiz result
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizResult = async () => {
      try {
        const response = await api.get(`quiz-result/${id}`);
        if (response.status === 200 && response.data) {
          setResult(response.data);
        } else {
          toast.error('Không thể tải kết quả bài kiểm tra');
        }
      } catch (error) {
        console.error('Lỗi khi tải kết quả:', error);
        toast.error('Đã xảy ra lỗi khi tải kết quả bài kiểm tra');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResult();
  }, [id]);

  const handleReturnToCourse = () => {
    if (result && result.course && result.course.id) {
      navigate(`/course/${result.course.id}`);
    } else {
      navigate('/courseList');
    }
  };

  const passRate = 70; // Tỷ lệ đạt là 70%
  const scorePercentage = result ? (result.score / result.totalQuestions) * 100 : 0;
  const isPassed = scorePercentage >= passRate;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-grow py-10 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className={`p-6 text-center text-white ${isPassed ? 'bg-green-600' : 'bg-orange-500'}`}>
            <h1 className="text-3xl font-bold mb-2">Kết quả bài kiểm tra</h1>
            <p className="text-lg opacity-90">
              {result?.course?.name || 'Khóa học'}
            </p>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-gray-200 mb-4">
                <span className="text-4xl font-bold">
                  {scorePercentage.toFixed(0)}%
                </span>
              </div>

              <h2 className={`text-2xl font-bold ${isPassed ? 'text-green-600' : 'text-orange-500'}`}>
                {isPassed ? 'Chúc mừng! Bạn đã đạt' : 'Bạn chưa đạt yêu cầu'}
              </h2>

              <p className="text-gray-600 mt-2">
                Bạn đã trả lời đúng {result?.score} trên {result?.totalQuestions} câu hỏi
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between text-sm font-medium">
                  <span>Điểm số của bạn</span>
                  <span>{result?.score}/{result?.totalQuestions}</span>
                </div>
                <div className="w-full bg-gray-300 h-2 mt-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isPassed ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${scorePercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between text-sm font-medium">
                  <span>Yêu cầu để đạt</span>
                  <span>{passRate}%</span>
                </div>
                <div className="w-full bg-gray-300 h-2 mt-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${passRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              {isPassed ? (
                <p className="text-green-600 mb-6">
                  Bạn đã hoàn thành khóa học này. Hãy tiếp tục khám phá các khóa học khác!
                </p>
              ) : (
                <p className="text-orange-600 mb-6">
                  Bạn cần đạt ít nhất 70% câu trả lời đúng để hoàn thành khóa học. Hãy ôn tập lại và thử lại!
                </p>
              )}

              <button
                onClick={handleReturnToCourse}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                {isPassed ? 'Quay lại khóa học' : 'Học lại khóa học'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default CourseResultPage;