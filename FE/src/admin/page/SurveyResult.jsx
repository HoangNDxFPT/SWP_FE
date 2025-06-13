import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../config/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function SurveyResult() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [surveyData, setSurveyData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  
  // Màu sắc cho biểu đồ
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    // Fetch courses và survey data khi component mount
    fetchCourses();
    fetchSurveyResults();
  }, []);

  // Lọc kết quả khảo sát khi selectedCourse thay đổi
  useEffect(() => {
    fetchSurveyResults(selectedCourse);
  }, [selectedCourse]);

  // Lấy danh sách khóa học
  const fetchCourses = async () => {
    try {
      const response = await api.get('courses');
      setCourses(response.data || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      toast.error("Failed to load courses: " + (error.response?.data?.message || error.message));
    }
  };

  // Lấy kết quả khảo sát
  const fetchSurveyResults = async (courseId = 'all') => {
    setLoading(true);
    try {
      // Gọi API lấy kết quả khảo sát
      // Giả sử API endpoint là 'quiz-results' hoặc 'survey-results'
      const endpoint = courseId === 'all' ? 'quiz-results' : `quiz-results?courseId=${courseId}`;
      
      // Vì chưa có API thực, chúng ta sẽ mô phỏng dữ liệu
      // Trong dự án thực, thay thế đoạn mô phỏng này bằng API call
      // const response = await api.get(endpoint);
      
      // Mô phỏng dữ liệu
      const mockData = generateMockData(courseId);
      setTimeout(() => {
        setSurveyData(mockData);
        setLoading(false);
      }, 800);
      
    } catch (error) {
      console.error("Failed to fetch survey results:", error);
      setError("Failed to load survey results. Please try again.");
      toast.error("Failed to load survey results: " + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  // Hàm tạo dữ liệu mô phỏng (xóa đi khi có API thực)
  const generateMockData = (courseId) => {
    // Dữ liệu từ file data.json
    const quizQuestions = [
      {
        id: 1,
        course_id: 1,
        question: "The word culture means:",
        answer: [
          "A part of society that is above the common working class",
          "The beliefs and activities that are common to members of a group",
          "An education in a university or college that extends over many years and results in extensive knowledge of a subject",
          "A chemical formula used to make drugs"
        ],
        correct: 1
      },
      {
        id: 2,
        course_id: 1,
        question: "What is the main effect of drugs on the brain?",
        answer: [
          "They improve memory",
          "They disrupt normal brain function",
          "They make you smarter",
          "They have no effect"
        ],
        correct: 1
      }
    ];
    
    // Tạo dữ liệu ngẫu nhiên cho từng câu hỏi
    const results = quizQuestions
      .filter(q => courseId === 'all' || q.course_id.toString() === courseId)
      .map(question => {
        const totalResponses = Math.floor(Math.random() * 100) + 50;
        const correctAnswerIndex = question.correct;
        
        // Tạo phân bố câu trả lời
        const answerDistribution = question.answer.map((answer, index) => {
          let percent;
          if (index === correctAnswerIndex) {
            // Câu đúng có tỉ lệ cao hơn
            percent = Math.floor(Math.random() * 30) + 40; // 40-70%
          } else {
            percent = Math.floor(Math.random() * 20) + 5; // 5-25%
          }
          return {
            answer: answer,
            count: Math.floor(totalResponses * percent / 100),
            isCorrect: index === correctAnswerIndex
          };
        });
        
        // Điều chỉnh tổng số để đúng với totalResponses
        const currentTotal = answerDistribution.reduce((sum, item) => sum + item.count, 0);
        const diff = totalResponses - currentTotal;
        answerDistribution[0].count += diff;
        
        return {
          questionId: question.id,
          question: question.question,
          totalResponses: totalResponses,
          answers: answerDistribution
        };
      });
    
    // Thêm một số thống kê tổng hợp
    const overallStats = {
      totalParticipants: Math.floor(Math.random() * 200) + 100,
      averageScore: Math.floor(Math.random() * 40) + 60,
      completionRate: Math.floor(Math.random() * 30) + 70
    };
    
    return {
      questions: results,
      stats: overallStats
    };
  };

  // Xử lý đổi khóa học được chọn
  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
  };
  
  // Tạo dữ liệu cho biểu đồ tròn
  const preparePieChartData = (question) => {
    return question.answers.map(answer => ({
      name: answer.answer.length > 20 ? answer.answer.substring(0, 20) + '...' : answer.answer,
      value: answer.count,
      isCorrect: answer.isCorrect
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded-lg">
        <p>{error}</p>
        <button
          onClick={() => fetchSurveyResults(selectedCourse)}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Survey & Quiz Results</h1>
      
      {/* Filter lọc theo khóa học */}
      <div className="mb-6">
        <label className="mr-2 font-semibold">Select Course:</label>
        <select
          className="border rounded px-3 py-2"
          value={selectedCourse}
          onChange={handleCourseChange}
        >
          <option value="all">All Courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center transition-transform hover:scale-105">
          <div className="text-5xl mb-3 text-blue-600 font-bold">{surveyData.stats?.totalParticipants || 0}</div>
          <div className="text-gray-700 font-semibold">Total Participants</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center transition-transform hover:scale-105">
          <div className="text-5xl mb-3 text-green-600 font-bold">{surveyData.stats?.averageScore || 0}%</div>
          <div className="text-gray-700 font-semibold">Average Score</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center transition-transform hover:scale-105">
          <div className="text-5xl mb-3 text-orange-600 font-bold">{surveyData.stats?.completionRate || 0}%</div>
          <div className="text-gray-700 font-semibold">Completion Rate</div>
        </div>
      </div>
      
      {/* Kết quả chi tiết từng câu hỏi */}
      <div className="space-y-8">
        {surveyData.questions?.map((question, index) => (
          <div key={question.questionId} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">
              Question {index + 1}: {question.question}
            </h3>
            <p className="text-gray-600 mb-3">
              Total responses: <span className="font-semibold">{question.totalResponses}</span>
            </p>
            
            {/* Biểu đồ tròn */}
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={preparePieChartData(question)}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {preparePieChartData(question).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isCorrect ? '#4CAF50' : COLORS[index % COLORS.length]} 
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Bảng chi tiết */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer Choice</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {question.answers.map((answer, idx) => (
                    <tr 
                      key={idx} 
                      className={answer.isCorrect ? "bg-green-50" : ""}
                    >
                      <td className="px-4 py-2 whitespace-normal">
                        {answer.isCorrect && <span className="inline-block mr-2 text-green-600">✓</span>}
                        {answer.answer}
                      </td>
                      <td className="px-4 py-2 text-right">{answer.count}</td>
                      <td className="px-4 py-2 text-right">
                        {((answer.count / question.totalResponses) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {surveyData.questions?.length === 0 && (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No survey data available for the selected course.</p>
        </div>
      )}
      
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}

export default SurveyResult;
