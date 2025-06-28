import React, { useEffect, useState } from 'react';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

function AssessmentHistory() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/assessments/my-history');
        if (res.status === 200) {
          setAssessments(res.data);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        toast.error('Không thể tải lịch sử đánh giá!');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div className="text-center mt-10">Đang tải lịch sử đánh giá...</div>;
  }

  if (assessments.length === 0) {
    return <div className="text-center mt-10 text-gray-600">Bạn chưa làm bài đánh giá nào.</div>;
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Lịch sử đánh giá của bạn</h1>
        <table className="min-w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Loại đánh giá</th>
              <th className="border px-4 py-2">Ngày tạo</th>
              <th className="border px-4 py-2">Trạng thái</th>
              <th className="border px-4 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((item) => (
              <tr key={item.id} className="text-center">
                <td className="border px-4 py-2">{item.id}</td>
                <td className="border px-4 py-2">{item.type}</td>
                <td className="border px-4 py-2">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
                <td className="border px-4 py-2">
                  {item.submitted ? (
                    <span className="text-green-600 font-semibold">Đã nộp</span>
                  ) : (
                    <span className="text-yellow-500 font-semibold">Chưa nộp</span>
                  )}
                </td>
                <td className="border px-4 py-2">
                  {item.submitted ? (
                    <Link
                      to={`/assessment-result/${item.id}`}
                      className="text-blue-500 hover:underline"
                    >
                      Xem kết quả
                    </Link>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </>
  );
}

export default AssessmentHistory;
