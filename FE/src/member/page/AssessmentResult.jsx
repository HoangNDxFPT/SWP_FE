import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

function AssessmentResult() {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/assessment-results/${resultId}`);
        if (res.status === 200) {
          setResult(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch assessment result:', err);
        toast.error('Không thể tải kết quả đánh giá');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  if (loading) {
    return <div className="text-center mt-10">Đang tải kết quả...</div>;
  }

  if (!result) {
    return <div className="text-center mt-10 text-red-500">Không tìm thấy kết quả.</div>;
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-4">Kết quả Đánh giá</h1>

        <div className="mb-4">
          <p><strong>Loại:</strong> {result.assessmentType}</p>
          <p><strong>Điểm số:</strong> {result.score}</p>
          <p><strong>Cấp độ rủi ro:</strong> {result.riskLevel}</p>
          <p><strong>Khuyến nghị:</strong> {result.recommendation}</p>
          <p><strong>Thời gian nộp:</strong> {new Date(result.submittedAt).toLocaleString()}</p>
        </div>

        <h2 className="text-xl font-semibold mb-2">Chi tiết câu trả lời:</h2>
        <div className="space-y-4">
          {result.answers.map(answer => (
            <div key={answer.questionId} className="border p-4 rounded shadow">
              <p><strong>Câu hỏi:</strong> {answer.questionText}</p>
              <p><strong>Câu trả lời:</strong> {answer.answerText}</p>
              <p><strong>Điểm:</strong> {answer.score}</p>
            </div>
          ))}
        </div>

        {/* Nếu có course recommendation */}
        {result.recommendedCourses && result.recommendedCourses.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Khóa học được khuyến nghị:</h2>
            <ul className="list-disc pl-5">
              {result.recommendedCourses.map((course, index) => (
                <li key={index}>{course}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default AssessmentResult;

