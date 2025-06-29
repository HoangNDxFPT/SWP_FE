import React, { useEffect, useState } from 'react';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function AssessmentHistory() {
  const navigate = useNavigate();
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        // Sử dụng endpoint mới để lấy tất cả kết quả
        const res = await api.get('/assessment-results/me');
        if (res.status === 200) {
          setAssessmentResults(res.data);
        }
      } catch (err) {
        console.error('Error fetching results:', err);
        toast.error('Không thể tải kết quả đánh giá!');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  // Hàm xử lý khi nhấn vào nút xem kết quả
  const handleViewResult = (assessmentResultId) => {
    if (expandedRow === assessmentResultId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(assessmentResultId);
    }
  };

  // Hàm tạo class cho mức độ rủi ro
  const getRiskLevelClass = (level) => {
    switch (level) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Đang tải lịch sử đánh giá...</div>;
  }

  if (assessmentResults.length === 0) {
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
              <th className="border px-4 py-2">Ngày nộp</th>
              <th className="border px-4 py-2">Mức độ rủi ro</th>
              <th className="border px-4 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {assessmentResults.map((result) => (
              <React.Fragment key={result.assessmentResultId}>
                <tr className={`text-center ${expandedRow === result.assessmentResultId ? 'bg-blue-50' : ''}`}>
                  <td className="border px-4 py-2">{result.assessmentResultId}</td>
                  <td className="border px-4 py-2">{result.assessmentType}</td>
                  <td className="border px-4 py-2">
                    {new Date(result.submittedAt).toLocaleString()}
                  </td>
                  <td className="border px-4 py-2">
                    <span className={`font-semibold ${getRiskLevelClass(result.riskLevel)}`}>
                      {result.riskLevel}
                    </span>
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => handleViewResult(result.assessmentResultId)}
                      className="text-blue-500 hover:underline cursor-pointer flex items-center justify-center mx-auto"
                    >
                      <span>{expandedRow === result.assessmentResultId ? 'Ẩn kết quả' : 'Xem kết quả'}</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 ml-1 transition-transform ${expandedRow === result.assessmentResultId ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
                {expandedRow === result.assessmentResultId && (
                  <tr>
                    <td colSpan="5" className="border px-0 py-0">
                      <div className="p-4 bg-gray-50">
                        <div className="p-4">
                          <div className="flex justify-between mb-4">
                            <h3 className="text-xl font-bold">Kết quả đánh giá: {result.assessmentType}</h3>
                            <span className="text-gray-600">
                              {new Date(result.submittedAt).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded shadow-sm">
                              <span className="text-gray-600">Điểm số:</span>
                              <span className="font-bold ml-2">{result.score}</span>
                            </div>
                            <div className="bg-white p-3 rounded shadow-sm">
                              <span className="text-gray-600">Mức độ rủi ro:</span>
                              <span className={`font-bold ml-2 ${getRiskLevelClass(result.riskLevel)}`}>
                                {result.riskLevel}
                              </span>
                            </div>
                          </div>

                          <div className={`p-4 mb-4 rounded-lg ${
                            result.riskLevel === 'LOW' ? 'bg-green-50 border border-green-200' : 
                            result.riskLevel === 'MEDIUM' ? 'bg-yellow-50 border border-yellow-200' : 
                            'bg-red-50 border border-red-200'
                          }`}>
                            <p className={`${
                              result.riskLevel === 'LOW' ? 'text-green-800' : 
                              result.riskLevel === 'MEDIUM' ? 'text-yellow-800' : 
                              'text-red-800'
                            }`}>
                              <strong>{
                                result.riskLevel === 'LOW' ? 'Rủi ro thấp: ' : 
                                result.riskLevel === 'MEDIUM' ? 'Rủi ro trung bình: ' : 
                                'Rủi ro cao: '
                              }</strong>
                              {result.recommendation}
                            </p>
                          </div>

                          {result.recommendedCourses?.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold mb-2">Khóa học khuyến nghị:</h4>
                              <ul className="list-disc pl-5">
                                {result.recommendedCourses.map((course) => (
                                  <li key={course.id} className="mb-2">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <strong>{course.name}</strong> - {course.description} (Độ tuổi: {course.targetAgeGroup})
                                      </div>
                                      <button
                                        onClick={() => navigate(`/course/${course.id}`)}
                                        className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 transition"
                                      >
                                        Xem
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex justify-end mt-4">
                            <button
                              onClick={() => navigate(`/assessment-result/${result.assessmentResultId}`)}
                              className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 transition mr-2"
                            >
                              Xem chi tiết đầy đủ
                            </button>
                            <button
                              onClick={() => setExpandedRow(null)}
                              className="bg-gray-500 text-white text-sm px-3 py-1 rounded hover:bg-gray-700 transition"
                            >
                              Đóng
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </>
  );
}

export default AssessmentHistory;
