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
  const [showAnswerDetails, setShowAnswerDetails] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        // Sửa đường dẫn API để truy vấn đúng endpoint
        const res = await api.get(`/assessment-results/${assessmentResultId}`);
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

  // Lấy thông tin nút chuyển hướng dựa trên mức độ rủi ro
  const getActionButtonInfo = () => {
    switch (result.riskLevel) {
      case 'LOW':
        return { show: false };
      case 'MEDIUM':
        return {
          show: true,
          text: 'Xem khóa học phù hợp',
          color: 'bg-blue-500 hover:bg-blue-700',
          action: () => navigate('/courseList')
        };
      case 'HIGH':
        return {
          show: true,
          text: 'Đặt lịch tư vấn ngay',
          color: 'bg-red-500 hover:bg-red-700',
          action: () => navigate('/consultantList')
        };
      default:
        return { show: false };
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

  // Hàm chuyển đổi hiển thị chi tiết câu trả lời
  const toggleAnswerDetails = () => {
    setShowAnswerDetails(!showAnswerDetails);
  };

  if (loading) {
    return <div className="text-center mt-10">Đang tải kết quả...</div>;
  }

  if (!result) {
    return <div className="text-center mt-10 text-red-500">Không có dữ liệu kết quả.</div>;
  }

  const actionButton = getActionButtonInfo();

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
          <strong>Mức độ rủi ro:</strong> <span className={`font-semibold ${getRiskLevelClass(result.riskLevel)}`}>{result.riskLevel}</span>
        </div>

        {/* Hiển thị thông báo và hướng dẫn dựa vào mức độ rủi ro */}
        <div className={`p-4 mb-6 rounded-lg ${
          result.riskLevel === 'LOW' ? 'bg-green-50 border border-green-200' : 
          result.riskLevel === 'MEDIUM' ? 'bg-yellow-50 border border-yellow-200' : 
          'bg-red-50 border border-red-200'
        }`}>
          {result.riskLevel === 'LOW' && (
            <p className="text-green-800">
              <strong>Rủi ro thấp:</strong> Bạn hiện không có dấu hiệu đáng lo ngại. Tuy nhiên, hãy chú ý theo dõi sức khỏe tâm thần và thể chất của mình.
            </p>
          )}
          
          {result.riskLevel === 'MEDIUM' && (
            <p className="text-yellow-800">
              <strong>Rủi ro trung bình:</strong> Có một số dấu hiệu cần được quan tâm. Chúng tôi khuyến nghị bạn tham gia các khóa học hỗ trợ để cải thiện tình trạng.
            </p>
          )}
          
          {result.riskLevel === 'HIGH' && (
            <p className="text-red-800">
              <strong>Rủi ro cao:</strong> Kết quả cho thấy bạn có thể cần được trợ giúp chuyên nghiệp. Chúng tôi khuyến nghị bạn đặt lịch tư vấn với chuyên gia càng sớm càng tốt.
            </p>
          )}
        </div>

        {result.recommendedCourses?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Khóa học khuyến nghị:</h2>
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

        {result.answers?.length > 0 && (
          <div className="mb-6">
            <button 
              onClick={toggleAnswerDetails}
              className="flex justify-between w-full items-center bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg transition"
            >
              <h2 className="text-xl font-semibold">Chi tiết câu trả lời</h2>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transition-transform duration-300 ${showAnswerDetails ? 'transform rotate-180' : ''}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {showAnswerDetails && (
              <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-white">
                <ul className="list-none pl-0">
                  {result.answers.map((answer, index) => (
                    <li key={answer.questionId} className="mb-4 pb-4 border-b border-gray-100 last:border-b-0">
                      <div className="font-medium text-gray-700 mb-2 flex items-start">
                        <span className="inline-flex justify-center items-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full mr-2 shrink-0 font-semibold">
                          {index + 1}
                        </span>
                        <span>{answer.questionText}</span>
                      </div>
                      <div className="pl-8">
                        <div><strong>Trả lời:</strong> {answer.answerText}</div>
                        <div><strong>Điểm:</strong> {answer.score}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-8">
          {/* Nút hành động dựa theo mức độ rủi ro */}
          {actionButton.show && (
            <button
              onClick={actionButton.action}
              className={`${actionButton.color} text-white px-4 py-2 rounded transition font-medium`}
            >
              {actionButton.text}
            </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AssessmentResult;
