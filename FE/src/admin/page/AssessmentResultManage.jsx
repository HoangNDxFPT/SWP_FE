import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
// Thêm imports cho xuất báo cáo
import * as XLSX from 'xlsx';

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

  // Thêm state cho xuất báo cáo
  const [isExporting, setIsExporting] = useState(false);

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

  // Function xuất Excel cho tất cả assessments
  const exportAllAssessmentsToExcel = () => {
    setIsExporting(true);
    try {
      const data = getFilteredAssessments().map(a => ({
        'ID': a.id,
        'Loại đánh giá': a.type,
        'Người làm': a.member?.fullName || '',
        'Email': a.member?.email || '',
        'Ngày tạo': formatDate(a.createdAt),
        'Trạng thái': 'Đã nộp'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách Assessment");

      // Tự động điều chỉnh độ rộng cột
      const colWidths = [
        { wch: 8 },   // ID
        { wch: 15 },  // Loại đánh giá
        { wch: 25 },  // Người làm
        { wch: 30 },  // Email
        { wch: 20 },  // Ngày tạo
        { wch: 12 }   // Trạng thái
      ];
      ws['!cols'] = colWidths;

      const fileName = `Danh_sach_Assessment_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      alert('Có lỗi xảy ra khi xuất file Excel!');
    }
    setIsExporting(false);
  };

  // Function xuất Excel cho kết quả chi tiết của user
  const exportUserResultsToExcel = () => {
    if (!selectedUser || filteredResults.length === 0) {
      alert('Vui lòng chọn người dùng có kết quả để xuất báo cáo!');
      return;
    }

    setIsExporting(true);
    try {
      const selectedUserInfo = users.find(u => u.id == selectedUser);
      
      // Sheet 1: Thông tin tổng quan
      const summaryData = [{
        'Họ tên': selectedUserInfo?.fullName || '',
        'Email': selectedUserInfo?.email || '',
        'Tổng số bài đánh giá': filteredResults.length,
        'Số bài ASSIST': filteredResults.filter(r => r.assessmentType === 'ASSIST').length,
        'Số bài CRAFFT': filteredResults.filter(r => r.assessmentType === 'CRAFFT').length,
        'Nguy cơ cao': filteredResults.filter(r => r.riskLevel === 'HIGH').length,
        'Nguy cơ trung bình': filteredResults.filter(r => r.riskLevel === 'MEDIUM').length,
        'Nguy cơ thấp': filteredResults.filter(r => r.riskLevel === 'LOW').length
      }];

      // Sheet 2: Chi tiết kết quả
      const detailData = filteredResults.map(r => ({
        'ID kết quả': r.assessmentResultId,
        'Loại đánh giá': r.assessmentType,
        'Điểm số': r.score,
        'Mức độ rủi ro': r.riskLevel === 'LOW' ? 'Thấp' : 
                       r.riskLevel === 'MEDIUM' ? 'Trung bình' : 'Cao',
        'Khuyến nghị': r.recommendation,
        'Ngày thực hiện': formatDate(r.submittedAt),
        'Số khóa học đề xuất': r.recommendedCourses?.length || 0
      }));

      // Tạo workbook
      const wb = XLSX.utils.book_new();
      
      // Thêm sheet tổng quan
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = Array(8).fill({ wch: 20 });
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng quan");

      // Thêm sheet chi tiết
      const wsDetail = XLSX.utils.json_to_sheet(detailData);
      wsDetail['!cols'] = [
        { wch: 12 }, // ID kết quả
        { wch: 15 }, // Loại đánh giá
        { wch: 10 }, // Điểm số
        { wch: 15 }, // Mức độ rủi ro
        { wch: 50 }, // Khuyến nghị
        { wch: 20 }, // Ngày thực hiện
        { wch: 18 }  // Số khóa học đề xuất
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, "Chi tiết kết quả");

      const fileName = `Bao_cao_${selectedUserInfo?.fullName?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      alert('Có lỗi xảy ra khi xuất file Excel!');
    }
    setIsExporting(false);
  };

  // Function xuất báo cáo thống kê tổng hợp
  const exportStatisticsReport = () => {
    setIsExporting(true);
    try {
      // Tính toán thống kê
      const totalAssessments = assessments.length;
      const totalUsers = users.length;
      const assistCount = assessments.filter(a => a.type === 'ASSIST').length;
      const crafftCount = assessments.filter(a => a.type === 'CRAFFT').length;

      // Thống kê theo tháng
      const monthlyStats = {};
      assessments.forEach(a => {
        const month = formatDate(a.createdAt).substring(3, 10); // MM/yyyy
        monthlyStats[month] = (monthlyStats[month] || 0) + 1;
      });

      // Tạo data cho Excel
      const summaryData = [{
        'Tổng số bài đánh giá': totalAssessments,
        'Tổng số người dùng': totalUsers,
        'Số bài ASSIST': assistCount,
        'Số bài CRAFFT': crafftCount,
        'Tỷ lệ ASSIST (%)': totalAssessments ? ((assistCount / totalAssessments) * 100).toFixed(1) : 0,
        'Tỷ lệ CRAFFT (%)': totalAssessments ? ((crafftCount / totalAssessments) * 100).toFixed(1) : 0
      }];

      const monthlyData = Object.entries(monthlyStats).map(([month, count]) => ({
        'Tháng': month,
        'Số lượng bài đánh giá': count
      }));

      // Tạo workbook
      const wb = XLSX.utils.book_new();
      
      // Sheet thống kê tổng
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = Array(6).fill({ wch: 18 });
      XLSX.utils.book_append_sheet(wb, wsSummary, "Thống kê tổng");

      // Sheet thống kê theo tháng
      const wsMonthly = XLSX.utils.json_to_sheet(monthlyData);
      wsMonthly['!cols'] = [{ wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsMonthly, "Theo tháng");

      const fileName = `Bao_cao_thong_ke_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Lỗi khi xuất báo cáo thống kê:', error);
      alert('Có lỗi xảy ra khi xuất báo cáo thống kê!');
    }
    setIsExporting(false);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900">Quản lý kết quả & thống kê Assessment</h1>
        <button 
          onClick={exportStatisticsReport}
          disabled={isExporting}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a4 4 0 01-4-4V5a4 4 0 014-4h10a4 4 0 014 4v14a4 4 0 01-4 4z" />
            </svg>
          )}
          Báo cáo thống kê
        </button>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl shadow-lg p-5 flex items-center">
          <div className="flex-shrink-0 bg-white rounded-full h-14 w-14 md:h-16 md:w-16 flex items-center justify-center mr-4 shadow">
            <span className="text-xl md:text-2xl font-bold text-blue-700">{assessments.length}</span>
          </div>
          <div>
            <div className="text-base md:text-lg text-white font-semibold">Tổng số bài khảo sát</div>
            <div className="text-sm text-blue-100">Đã hoàn thành</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-xl shadow-lg p-5 flex items-center">
          <div className="flex-shrink-0 bg-white rounded-full h-14 w-14 md:h-16 md:w-16 flex items-center justify-center mr-4 shadow">
            <span className="text-xl md:text-2xl font-bold text-purple-700">{users.length}</span>
          </div>
          <div>
            <div className="text-base md:text-lg text-white font-semibold">Số người tham gia</div>
            <div className="text-sm text-purple-100">Người dùng duy nhất</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-xl shadow-lg p-5 flex items-center">
          <div className="flex-shrink-0 bg-white rounded-full h-14 w-14 md:h-16 md:w-16 flex items-center justify-center mr-4 shadow">
            <span className="text-xl md:text-2xl font-bold text-green-700">
              {assessments.filter(a => a.type === 'ASSIST').length}
            </span>
          </div>
          <div>
            <div className="text-base md:text-lg text-white font-semibold">ASSIST</div>
            <div className="text-sm text-green-100">CRAFFT: {assessments.filter(a => a.type === 'CRAFFT').length}</div>
          </div>
        </div>
      </div>

      {/* Danh sách user */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="h-8 w-1 bg-blue-500 rounded mr-3"></div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">Xem kết quả theo người dùng</h2>
        </div>
        
        <div className="relative">
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 appearance-none bg-white"
            value={selectedUser || ""}
            onChange={e => setSelectedUser(e.target.value)}
          >
            <option key="empty-option" value="">-- Chọn người dùng để xem chi tiết --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.email})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </div>
        </div>

        {/* Bộ lọc tìm kiếm - Giao diện hiện đại hơn */}
        {selectedUser && (
          <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              <h3 className="font-semibold text-blue-700">Bộ lọc kết quả</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">Loại đánh giá</label>
                <select 
                  className="w-full border rounded-lg p-2.5 bg-white border-gray-300 focus:ring-2 focus:ring-blue-400"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="ASSIST">ASSIST</option>
                  <option value="CRAFFT">CRAFFT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">Mức độ rủi ro</label>
                <select 
                  className="w-full border rounded-lg p-2.5 bg-white border-gray-300 focus:ring-2 focus:ring-blue-400"
                  value={filterRiskLevel}
                  onChange={(e) => setFilterRiskLevel(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HIGH">Cao</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">Từ ngày</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2.5 bg-white border-gray-300 focus:ring-2 focus:ring-blue-400" 
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">Đến ngày</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2.5 bg-white border-gray-300 focus:ring-2 focus:ring-blue-400"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  min={filterDateFrom}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        )}

        {/* Kết quả của user - Giao diện hiện đại hơn */}
        {selectedUser && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-blue-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Kết quả của người dùng
              </h3>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {filteredResults.length} kết quả
                </div>
                {/* Nút xuất báo cáo cho user */}
                {filteredResults.length > 0 && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={exportUserResultsToExcel}
                      disabled={isExporting}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                    >
                      {isExporting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-3 border-blue-600 border-r-3 border-b-3 border-gray-200"></div>
                <div className="mt-3 text-blue-600 font-medium">Đang tải dữ liệu...</div>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="mt-3 text-gray-500 text-lg">Không tìm thấy kết quả nào phù hợp</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Loại</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Điểm</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mức rủi ro</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Khuyến nghị</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày nộp</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredResults.map(r => (
                      <tr key={r.assessmentResultId} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.assessmentResultId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold
                            ${r.assessmentType === "ASSIST" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-purple-100 text-purple-800 border border-purple-200"}`}>
                            {r.assessmentType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{r.score}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center
                            ${r.riskLevel === "HIGH" ? "bg-red-100 text-red-700 border border-red-200" :
                              r.riskLevel === "MEDIUM" ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                                "bg-green-100 text-green-700 border border-green-200"}`}>
                            {r.riskLevel === "LOW" && <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>}
                            {r.riskLevel === "MEDIUM" && <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>}
                            {r.riskLevel === "HIGH" && <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>}
                            {r.riskLevel === "LOW" ? "Thấp" : r.riskLevel === "MEDIUM" ? "Trung bình" : "Cao"}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-[200px] truncate text-sm text-gray-700">{r.recommendation}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(r.submittedAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => showDetail(r)} 
                            className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-full px-3 py-1 text-sm transition-colors flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
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

      {/* Biểu đồ thống kê - Giao diện hiện đại hơn */}
      {selectedUser && userResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="h-8 w-1 bg-green-500 rounded mr-3"></div>
              <h3 className="font-semibold text-gray-800">Phân bố mức độ rủi ro</h3>
            </div>
            <div className="flex justify-center items-center" style={{ height: 220 }}>
              <Pie 
                data={{
                  labels: ['Thấp', 'Trung bình', 'Cao'],
                  datasets: [{
                    data: [
                      filteredResults.filter(r => r.riskLevel === 'LOW').length,
                      filteredResults.filter(r => r.riskLevel === 'MEDIUM').length,
                      filteredResults.filter(r => r.riskLevel === 'HIGH').length
                    ],
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                    borderColor: ['#D1FAE5', '#FEF3C7', '#FEE2E2'],
                    borderWidth: 2
                  }]
                }}
                width={220}
                height={220}
                options={{
                  maintainAspectRatio: false,
                  responsive: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      titleColor: '#1F2937',
                      bodyColor: '#4B5563',
                      borderColor: '#E5E7EB',
                      borderWidth: 1,
                      padding: 12,
                      boxWidth: 10,
                      usePointStyle: true,
                      callbacks: {
                        label: function(context) {
                          const value = context.raw;
                          const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                          return `${context.label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="h-8 w-1 bg-blue-500 rounded mr-3"></div>
              <h3 className="font-semibold text-gray-800">Số lượng bài đánh giá theo loại</h3>
            </div>
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
                    backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)'],
                    borderColor: ['#3B82F6', '#8B5CF6'],
                    borderWidth: 1,
                    borderRadius: 8
                  }]
                }}
                options={{
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                        font: {
                          size: 12
                        }
                      },
                      grid: {
                        display: true,
                        color: 'rgba(226, 232, 240, 0.5)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        font: {
                          size: 12
                        }
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

      {/* Danh sách tất cả bài khảo sát - Giao diện hiện đại hơn */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="h-8 w-1 bg-green-500 rounded mr-3"></div>
            <h2 className="text-xl font-semibold text-gray-800">Tất cả bài khảo sát đã hoàn thành</h2>
            <div className="ml-4">
              <select
                className="border border-gray-300 rounded-full px-4 py-1.5 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400"
                value={filterGlobalType}
                onChange={e => setFilterGlobalType(e.target.value)}
              >
                <option value="">Tất cả loại</option>
                <option value="ASSIST">ASSIST</option>
                <option value="CRAFFT">CRAFFT</option>
              </select>
            </div>
          </div>
          <button 
            onClick={exportAllAssessmentsToExcel}
            disabled={isExporting}
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg flex items-center hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isExporting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Xuất Excel
          </button>
        </div>
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-3 border-green-600 border-r-3 border-b-3 border-gray-200"></div>
            <div className="mt-3 text-green-600 font-medium">Đang tải dữ liệu...</div>
          </div>
        ) : getFilteredAssessments().length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="mt-3 text-gray-500 text-lg">Không có bài đánh giá nào phù hợp</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
              <thead className="bg-gradient-to-r from-green-50 to-teal-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Người làm</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getFilteredAssessments().map(a => (
                  <tr key={a.id} className="hover:bg-green-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center
                        ${a.type === "ASSIST" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-purple-100 text-purple-800 border border-purple-200"}`}>
                        {a.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{a.member?.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{a.member?.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(a.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center border border-green-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-blue-900">Chi tiết kết quả đánh giá</h3>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl mb-5 shadow-sm border border-blue-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">ID</p>
                    <p className="text-lg font-semibold text-gray-900">{detailResult.assessmentResultId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Loại đánh giá</p>
                    <p className="text-lg font-semibold">
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold inline-block mt-1
                        ${detailResult.assessmentType === "ASSIST" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                        {detailResult.assessmentType}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Điểm số</p>
                    <p className="text-2xl font-bold text-blue-700">{detailResult.score}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Mức độ rủi ro</p>
                    <p className="mt-1">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center
                        ${detailResult.riskLevel === "HIGH" ? "bg-red-100 text-red-700 border border-red-200" :
                          detailResult.riskLevel === "MEDIUM" ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                            "bg-green-100 text-green-700 border border-green-200"}`}>
                        {detailResult.riskLevel === "LOW" && <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-1.5"></span>}
                        {detailResult.riskLevel === "MEDIUM" && <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full mr-1.5"></span>}
                        {detailResult.riskLevel === "HIGH" && <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-1.5"></span>}
                        {detailResult.riskLevel === "LOW" ? "Thấp" : detailResult.riskLevel === "MEDIUM" ? "Trung bình" : "Cao"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-5">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Khuyến nghị
                </h4>
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-gray-800">
                  {detailResult.recommendation}
                </div>
              </div>
              
              {/* Khóa học được đề xuất */}
              {detailResult.recommendedCourses && detailResult.recommendedCourses.length > 0 && (
                <div className="mb-5">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                    Khóa học được đề xuất
                  </h4>
                  <div className="space-y-3">
                    {detailResult.recommendedCourses.map(course => (
                      <div key={course.id} className="bg-blue-50 p-4 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                        <div className="font-medium text-blue-900 text-lg">{course.name}</div>
                        <div className="text-sm text-gray-700 mt-1">{course.description}</div>
                        <div className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full inline-block mt-2">
                          Nhóm tuổi: {course.targetAgeGroup}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thêm điều kiện hiển thị khi không có khóa học */}
              {detailResult.recommendedCourses && detailResult.recommendedCourses.length === 0 && 
               detailResult.riskLevel === "HIGH" && (
                <div className="mb-5">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Khuyến nghị tư vấn
                  </h4>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="text-orange-800 font-medium">
                      Mức nguy cơ cao - Cần tư vấn trực tiếp
                    </div>
                    <div className="text-sm text-orange-700 mt-1">
                      Người dùng này cần được tư vấn trực tiếp với chuyên gia thay vì tham gia khóa học tự học.
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-5">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Câu trả lời chi tiết
                </h4>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="space-y-4">
                    {detailResult.answers?.map((answer, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border-l-4 border-indigo-400 shadow-sm">
                        <p className="font-medium text-gray-900">{index + 1}. {answer.questionText}</p>
                        <p className="text-gray-700 mt-2"><span className="font-medium">Trả lời:</span> {answer.answerText}</p>
                        <p className="text-blue-600 text-sm mt-1 font-medium">Điểm: {answer.score}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center shadow-sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
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