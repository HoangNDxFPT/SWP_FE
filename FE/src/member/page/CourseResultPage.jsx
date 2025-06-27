import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

function CourseResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    api.get(`quiz-result/${id}`)
      .then(res => {
        if (res.status === 200) {
          setResult(res.data);
        } else {
          setError('Không thể lấy kết quả bài kiểm tra.');
        }
      })
      .catch(err => {
        console.error('Error fetching quiz result:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu.');
      });
  }, [id]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-white to-cyan-100 py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-cyan-700 mb-6">Quiz Result</h2>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          {result ? (
            <div className="bg-white rounded shadow-md p-6 text-left">
              <p><strong>Course:</strong> {result.course.name}</p>
              <p><strong>User:</strong> {result.user.fullName}</p>
              <p><strong>Score:</strong> {result.score} / {result.totalQuestions}</p>
              <p><strong>Submitted At:</strong> {new Date(result.submittedAt).toLocaleString()}</p>

              <Link
                to="/courseList"
                className="inline-block mt-6 px-6 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded"
              >
                Back to Courses
              </Link>
            </div>
          ) : (
            !error && <p className="text-gray-600">Loading result...</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default CourseResultPage;