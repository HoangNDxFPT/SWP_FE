import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

function AssessmentResult() {
  const { assessmentResultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`assessment-results/${assessmentResultId}`);
        if (res.status === 200) {
          setResult(res.data);
        }
      } catch (err) {
        console.error('Error fetching assessment result:', err);
        toast.error('Không thể tải kết quả đánh giá!');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [assessmentResultId]);

  if (loading) {
    return <div className="text-center mt-10">Đang tải kết quả...</div>;
  }

  if (!result) {
    return <div className="text-center mt-10 text-red-500">Không có dữ liệu kết quả.</div>;
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-4">Kết quả đánh giá: {result.assessmentType}</h1>

        <div className="mb-4">
          <strong>Ngày gửi:</strong> {new Date(result.submittedAt).toLocaleString()}
        </div>

        <div className="mb-4">
          <strong>Điểm số:</strong> {result.score}
        </div>

        <div className="mb-4">
          <strong>Mức độ rủi ro:</strong> <span className="font-semibold text-blue-600">{result.riskLevel}</span>
        </div>

        <div className="mb-4">
          <strong>Khuyến nghị:</strong>
          <p className="mt-1">{result.recommendation}</p>
        </div>

        {result.answers.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Chi tiết câu trả lời:</h2>
            <ul className="list-disc pl-5">
              {result.answers.map((answer) => (
                <li key={answer.questionId}>
                  <strong>Câu hỏi:</strong> {answer.questionText}<br />
                  <strong>Trả lời:</strong> {answer.answerText}<br />
                  <strong>Điểm:</strong> {answer.score}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.recommendedCourses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Khóa học khuyến nghị:</h2>
            <ul className="list-disc pl-5">
              {result.recommendedCourses.map((course) => (
                <li key={course.id}>
                  <strong>{course.name}</strong> - {course.description} (Độ tuổi: {course.targetAgeGroup})
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Quay về trang chủ
        </button>
      </div>
      <Footer />
    </>
  );
}

export default AssessmentResult;
