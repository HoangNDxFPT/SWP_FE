import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

export default function AssessmentResultManage() {
  const [assessments, setAssessments] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userResults, setUserResults] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailResult, setDetailResult] = useState(null);

  // Bộ lọc
  const [filterType, setFilterType] = useState("");
  const [filterRiskLevel, setFilterRiskLevel] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Thêm state mới cho việc lọc bài toàn cục
  const [filterGlobalType, setFilterGlobalType] = useState("");

  // Lấy tất cả bài khảo sát đã hoàn thành
  useEffect(() => {
    const fetchAssessments = async () => {
      setLoading(true);
      try {
        const res = await api.get("/assessments/all");
        const completed = (res.data || []).filter(a => a.submitted);
        setAssessments(completed);
        // Lấy danh sách user duy nhất từ các bài đã hoàn thành
        const uniqueUsers = [];
        const userMap = {};
        completed.forEach(a => {
          if (a.member && !userMap[a.member.id]) {
            userMap[a.member.id] = true;
            uniqueUsers.push(a.member);
          }
        });
        setUsers(uniqueUsers);
      } catch (e) {
        console.error("Lỗi khi tải dữ liệu:", e);
        setAssessments([]);
      }
      setLoading(false);
    };
    fetchAssessments();
  }, []);

  // Lấy kết quả của user khi chọn
  useEffect(() => {
    if (!selectedUser) {
      setUserResults([]);
      return;
    }
    const fetchUserResults = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/assessment-results/user/${selectedUser}`);
        setUserResults(res.data || []);
      } catch (e) {
        console.error("Lỗi khi tải kết quả người dùng:", e);
        setUserResults([]);
      }
      setLoading(false);
    };
    fetchUserResults();
  }, [selectedUser]);

  const formatDate = (date) => {
    if (!date) return "";
    try {
      return format(parseISO(date), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch {
      return date;
    }
  };

  const showDetail = (result) => {
    setDetailResult(result);
    setShowDetailModal(true);
  };

  // Lọc kết quả theo bộ lọc
  const filterResults = () => {
    let filtered = [...userResults];
    
    if (filterType) {
      filtered = filtered.filter(r => r.assessmentType === filterType);
    }
    
    if (filterRiskLevel) {
      filtered = filtered.filter(r => r.riskLevel === filterRiskLevel);
    }
    
    if (filterDateFrom) {
      filtered = filtered.filter(r => {
        const resultDate = new Date(r.submittedAt).toISOString().split('T')[0];
        return resultDate >= filterDateFrom;
      });
    }
    
    if (filterDateTo) {
      filtered = filtered.filter(r => {
        const resultDate = new Date(r.submittedAt).toISOString().split('T')[0];
        return resultDate <= filterDateTo;
      });
    }
    
    return filtered;
  };

  const resetFilters = () => {
    setFilterType("");
    setFilterRiskLevel("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const filteredResults = filterResults();

  // Thêm hàm lọc
  const getFilteredAssessments = () => {
    if (!filterGlobalType) return assessments;
    return assessments.filter(a => a.type === filterGlobalType);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-blue-900 text-center">Quản lý kết quả & thống kê Assessment</h1>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 flex items-center">
          <div className="flex-shrink-0 bg-white rounded-full h-16 w-16 flex items-center justify-center mr-4 shadow">
            <span className="text-2xl font-bold text-blue-700">{assessments.length}</span>
          </div>
          <div>
            <div className="text-lg text-white font-semibold">Tổng số bài khảo sát</div>
            <div className="text-blue-100">Chỉ tính bài đã hoàn thành</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-xl shadow-lg p-6 flex items-center">
          <div className="flex-shrink-0 bg-white rounded-full h-16 w-16 flex items-center justify-center mr-4 shadow">
            <span className="text-2xl font-bold text-green-700">{users.length}</span>
          </div>
          <div>
            <div className="text-lg text-white font-semibold">Số người đã làm khảo sát</div>
            <div className="text-green-100">Không trùng lặp</div>
          </div>
        </div>
      </div>

      {/* Danh sách user */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Xem kết quả theo người dùng</h2>
        <select
          className="border border-blue-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-blue-400"
          value={selectedUser || ""}
          onChange={e => setSelectedUser(e.target.value)}
        >
          <option key="empty-option" value="">-- Chọn người dùng --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.fullName} ({u.email})
            </option>
          ))}
        </select>

        {/* Bộ lọc tìm kiếm */}
        {selectedUser && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3 text-blue-700">Bộ lọc kết quả</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm mb-1">Loại đánh giá</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option key="filter-all-type" value="">Tất cả</option>
                  <option key="filter-assist" value="ASSIST">ASSIST</option>
                  <option key="filter-crafft" value="CRAFFT">CRAFFT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Mức độ rủi ro</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={filterRiskLevel}
                  onChange={(e) => setFilterRiskLevel(e.target.value)}
                >
                  <option key="filter-all-risk" value="">Tất cả</option>
                  <option key="filter-low" value="LOW">Thấp</option>
                  <option key="filter-medium" value="MEDIUM">Trung bình</option>
                  <option key="filter-high" value="HIGH">Cao</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Từ ngày</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2" 
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Đến ngày</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  min={filterDateFrom}
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button 
                onClick={resetFilters}
                className="mr-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        )}

        {/* Kết quả của user */}
        {selectedUser && (
          <div>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold mb-2 text-blue-700">Kết quả của người dùng:</h3>
              <div className="text-sm text-gray-500">
                {filteredResults.length} kết quả được tìm thấy
              </div>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                <div className="mt-2 text-blue-600">Đang tải...</div>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Không có kết quả.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Loại</th>
                      <th className="px-4 py-2 text-left">Điểm</th>
                      <th className="px-4 py-2 text-left">Mức rủi ro</th>
                      <th className="px-4 py-2 text-left">Khuyến nghị</th>
                      <th className="px-4 py-2 text-left">Ngày nộp</th>
                      <th className="px-4 py-2 text-left">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map(r => (
                      <tr key={r.assessmentResultId} className="hover:bg-blue-50 transition">
                        <td className="px-4 py-2">{r.assessmentResultId}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold
                            ${r.assessmentType === "ASSIST" ? "bg-blue-200 text-blue-800" : "bg-purple-200 text-purple-800"}`}>
                            {r.assessmentType}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-bold">{r.score}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${r.riskLevel === "HIGH" ? "bg-red-100 text-red-700" :
                              r.riskLevel === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                                "bg-green-100 text-green-700"}`}>
                            {r.riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-2 max-w-[200px] truncate">{r.recommendation}</td>
                        <td className="px-4 py-2">{formatDate(r.submittedAt)}</td>
                        <td className="px-4 py-2">
                          <button 
                            onClick={() => showDetail(r)} 
                            className="text-blue-600 hover:underline"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Biểu đồ thống kê */}
      {selectedUser && userResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold mb-4">Phân bố mức độ rủi ro</h3>
            <div className="h-64">
              <Pie 
                data={{
                  labels: ['Thấp', 'Trung bình', 'Cao'],
                  datasets: [{
                    data: [
                      filteredResults.filter(r => r.riskLevel === 'LOW').length,
                      filteredResults.filter(r => r.riskLevel === 'MEDIUM').length,
                      filteredResults.filter(r => r.riskLevel === 'HIGH').length
                    ],
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
                  }]
                }}
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold mb-4">Số lượng bài đánh giá theo loại</h3>
            <div className="h-64">
              <Bar 
                data={{
                  labels: ['ASSIST', 'CRAFFT'],
                  datasets: [{
                    label: 'Số lượng',
                    data: [
                      filteredResults.filter(r => r.assessmentType === 'ASSIST').length,
                      filteredResults.filter(r => r.assessmentType === 'CRAFFT').length
                    ],
                    backgroundColor: ['#3B82F6', '#8B5CF6']
                  }]
                }}
                options={{
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Danh sách tất cả bài khảo sát */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-blue-800">Tất cả bài khảo sát đã hoàn thành</h2>
            <select
              className="border border-gray-300 rounded px-3 py-1 text-sm"
              value={filterGlobalType}
              onChange={e => setFilterGlobalType(e.target.value)}
            >
              <option value="">Tất cả loại</option>
              <option value="ASSIST">ASSIST</option>
              <option value="CRAFFT">CRAFFT</option>
            </select>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Xuất Excel
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            <div className="mt-2 text-blue-600">Đang tải...</div>
          </div>
        ) : getFilteredAssessments().length === 0 ? (
          <div className="text-center py-8 text-gray-500">Không có bài đánh giá nào phù hợp.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Loại</th>
                  <th className="px-4 py-2 text-left">Người làm</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Ngày tạo</th>
                  <th className="px-4 py-2 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAssessments().map(a => (
                  <tr key={a.id} className="hover:bg-green-50 transition">
                    <td className="px-4 py-2">{a.id}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold
                        ${a.type === "ASSIST" ? "bg-blue-200 text-blue-800" : "bg-purple-200 text-purple-800"}`}>
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-2">{a.member?.fullName}</td>
                    <td className="px-4 py-2">{a.member?.email}</td>
                    <td className="px-4 py-2">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-2">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                        Đã nộp
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chi tiết kết quả đánh giá */}
      {showDetailModal && detailResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Chi tiết kết quả đánh giá</h3>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-medium">{detailResult.assessmentResultId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Loại đánh giá</p>
                    <p className="font-medium">{detailResult.assessmentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Điểm số</p>
                    <p className="font-medium text-lg">{detailResult.score}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mức độ rủi ro</p>
                    <p className="font-medium text-lg">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold
                        ${detailResult.riskLevel === "HIGH" ? "bg-red-100 text-red-700" :
                          detailResult.riskLevel === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                            "bg-green-100 text-green-700"}`}>
                        {detailResult.riskLevel === "LOW" ? "Thấp" : 
                         detailResult.riskLevel === "MEDIUM" ? "Trung bình" : "Cao"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <h4 className="font-semibold mb-2">Khuyến nghị</h4>
              <p className="bg-yellow-50 p-3 rounded mb-4 text-gray-800">{detailResult.recommendation}</p>
              
              {/* Khóa học được đề xuất */}
              {detailResult.recommendedCourses && detailResult.recommendedCourses.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Khóa học được đề xuất</h4>
                  <div className="bg-blue-50 p-3 rounded">
                    {detailResult.recommendedCourses.map(course => (
                      <div key={course.id} className="bg-white p-3 rounded border border-blue-100 mb-2">
                        <div className="font-medium text-blue-900">{course.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{course.description}</div>
                        <div className="text-xs text-gray-500 mt-1">Nhóm tuổi: {course.targetAgeGroup}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <h4 className="font-semibold mb-2">Câu trả lời chi tiết</h4>
              <div className="space-y-2 mb-4">
                {detailResult.answers?.map((answer, index) => (
                  <div key={index} className="border-l-4 border-blue-400 pl-3 py-2">
                    <p className="font-medium">{answer.questionText}</p>
                    <p className="text-gray-700">Trả lời: {answer.answerText}</p>
                    <p className="text-blue-600 text-sm">Điểm: {answer.score}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => setShowDetailModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}