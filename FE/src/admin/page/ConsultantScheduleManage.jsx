import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

function ConsultantScheduleManage() {
  // Tab chuyển đổi giữa lịch làm việc và lịch hẹn
  const [activeTab, setActiveTab] = useState("schedules"); // "schedules" hoặc "appointments"
  
  // States cho lịch làm việc
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  
  // States cho lịch hẹn
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [consultants, setConsultants] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    unavailable: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    rejectedAppointments: 0
  });
  
  // Modal states cho lịch làm việc
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState({
    consultantId: "",
    workDate: "",
    startTime: { hour: 9, minute: 0, second: 0, nano: 0 },
    endTime: { hour: 17, minute: 0, second: 0, nano: 0 },
    isAvailable: true,
    maxAppointments: 1
  });
  
  // Modal states cho lịch hẹn
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  
  // Filter states
  const [selectedConsultant, setSelectedConsultant] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bulkCreateMode, setBulkCreateMode] = useState(false);
  const [bulkTimeSlots, setBulkTimeSlots] = useState([
    { start: "07:00", end: "07:45", selected: false },
    { start: "08:00", end: "08:45", selected: false },
    { start: "09:00", end: "09:45", selected: false },
    { start: "10:00", end: "10:45", selected: false },
    { start: "11:00", end: "11:45", selected: false },
    { start: "14:00", end: "14:45", selected: false },
    { start: "15:00", end: "15:45", selected: false },
    { start: "16:00", end: "16:45", selected: false }
  ]);
  
  useEffect(() => {
    fetchConsultants();
    fetchUsers();
    
    if (activeTab === "schedules") {
      fetchAllSchedules();
    } else {
      fetchAppointments();
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (activeTab === "schedules") {
      applyScheduleFilters();
    } else {
      applyAppointmentFilters();
    }
  }, [schedules, appointments, selectedConsultant, dateFilter, statusFilter, activeTab]);
  
  useEffect(() => {
    calculateStats();
  }, [schedules, appointments]);
  
  const fetchConsultants = async () => {
    try {
      const res = await api.get("/consultant/consultants");
      setConsultants(res.data || []);
    } catch (err) {
      toast.error("Không thể tải danh sách tư vấn viên");
      console.error("Failed to load consultants:", err);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const res = await api.get("/profile/all");
      setUsers(res.data || []);
    } catch (err) {
      toast.error("Không thể tải danh sách người dùng");
      console.error("Failed to load users:", err);
    }
  };
  
  const fetchAllSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get("/consultant/schedules");
      // Chuẩn hóa dữ liệu
      const normalizedSchedules = (res.data || []).map(schedule => ({
        ...schedule,
        // Đảm bảo startTime và endTime luôn có định dạng đúng
        startTime: schedule.startTime || { hour: 0, minute: 0, second: 0, nano: 0 },
        endTime: schedule.endTime || { hour: 0, minute: 0, second: 0, nano: 0 }
      }));
      setSchedules(normalizedSchedules);
    } catch (err) {
      toast.error("Không thể tải lịch trình");
      console.error("Failed to load schedules:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/consultant/appointments");
      setAppointments(res.data || []);
    } catch (err) {
      toast.error("Không thể tải lịch hẹn");
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchConsultantSchedules = async (consultantId) => {
    setLoading(true);
    try {
      const res = await api.get(`/consultant/schedules/${consultantId}`);
      setSchedules(res.data || []);
    } catch (err) {
      toast.error("Không thể tải lịch trình của tư vấn viên");
      console.error("Failed to load consultant schedules:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStats = () => {
    // Stats cho lịch làm việc
    const scheduleStats = {
      total: schedules.length,
      available: schedules.filter(s => s.isAvailable).length,
      unavailable: schedules.filter(s => !s.isAvailable).length
    };
    
    // Stats cho lịch hẹn
    const appointmentStats = {
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter(a => a.status === "PENDING").length,
      confirmedAppointments: appointments.filter(a => a.status === "CONFIRMED").length,
      rejectedAppointments: appointments.filter(a => a.status === "REJECTED").length
    };
    
    setStats({...scheduleStats, ...appointmentStats});
  };
  
  const applyScheduleFilters = () => {
    let filtered = [...schedules];
    
    if (selectedConsultant) {
      filtered = filtered.filter(s => String(s.consultantId) === String(selectedConsultant));
    }
    
    if (dateFilter) {
      filtered = filtered.filter(s => s.workDate === dateFilter);
    }
    
    setFilteredSchedules(filtered);
  };
  
  const applyAppointmentFilters = () => {
    let filtered = [...appointments];
    
    if (selectedConsultant) {
      filtered = filtered.filter(a => String(a.consultantId) === String(selectedConsultant));
    }
    
    if (dateFilter) {
      filtered = filtered.filter(a => {
        const appointmentDate = a.appointmentTime?.split('T')[0];
        return appointmentDate === dateFilter;
      });
    }
    
    if (statusFilter) {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    
    setFilteredAppointments(filtered);
  };
  
  const resetFilters = () => {
    setSelectedConsultant("");
    setDateFilter("");
    setStatusFilter("");
  };
  
  const formatTime = (timeObj) => {
    if (!timeObj) return "";
    
    // Kiểm tra xem timeObj có phải là chuỗi không
    if (typeof timeObj === 'string') {
      return timeObj.substring(0, 5); // Lấy 5 ký tự đầu (HH:MM)
    }
    
    // Kiểm tra xem hour và minute có tồn tại không
    const hour = timeObj.hour !== undefined ? timeObj.hour : 0;
    const minute = timeObj.minute !== undefined ? timeObj.minute : 0;
    
    // Chuyển đổi thành chuỗi an toàn
    const hourStr = String(hour).padStart(2, '0');
    const minuteStr = String(minute).padStart(2, '0');
    
    return `${hourStr}:${minuteStr}`;
  };
  
  const parseTimeInput = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return {
      hour: hours,
      minute: minutes,
      second: 0,
      nano: 0
    };
  };
  
  // Xử lý lịch làm việc
  const handleCreateSchedule = async () => {
    if (!currentSchedule.consultantId || !currentSchedule.workDate) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    
    if (bulkCreateMode) {
      const selectedSlots = bulkTimeSlots.filter(slot => slot.selected);
      if (selectedSlots.length === 0) {
        toast.error("Vui lòng chọn ít nhất một khung giờ");
        return;
      }
      
      try {
        setLoading(true);
        const promises = selectedSlots.map(slot => {
          const schedule = {
            ...currentSchedule,
            startTime: parseTimeInput(slot.start),
            endTime: parseTimeInput(slot.end)
          };
          return api.post("/consultant/schedules", schedule);
        });
        
        await Promise.all(promises);
        toast.success(`Đã tạo ${selectedSlots.length} lịch làm việc thành công`);
        fetchAllSchedules();
        setShowCreateModal(false);
        resetScheduleForm();
      } catch (err) {
        toast.error("Không thể tạo lịch làm việc: " + (err.response?.data?.message || "Lỗi không xác định"));
        console.error("Failed to create schedules:", err);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        await api.post("/consultant/schedules", currentSchedule);
        toast.success("Tạo lịch làm việc thành công!");
        fetchAllSchedules();
        setShowCreateModal(false);
        resetScheduleForm();
      } catch (err) {
        toast.error("Không thể tạo lịch làm việc: " + (err.response?.data?.message || "Lỗi không xác định"));
        console.error("Failed to create schedule:", err);
      }
    }
  };
  
  const handleUpdateSchedule = async () => {
    if (!currentSchedule.workDate) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    
    try {
      await api.put(`/consultant/schedules/${currentSchedule.id}`, currentSchedule);
      toast.success("Cập nhật lịch làm việc thành công!");
      fetchAllSchedules();
      setShowEditModal(false);
    } catch (err) {
      toast.error("Không thể cập nhật lịch làm việc: " + (err.response?.data?.message || "Lỗi không xác định"));
      console.error("Failed to update schedule:", err);
    }
  };
  
  const handleDeleteSchedule = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lịch làm việc này?")) {
      try {
        await api.delete(`/consultant/schedules/${id}`);
        toast.success("Xóa lịch làm việc thành công!");
        setSchedules(schedules.filter(s => s.id !== id));
      } catch (err) {
        toast.error("Không thể xóa lịch làm việc");
        console.error("Failed to delete schedule:", err);
      }
    }
  };
  
  // Xử lý lịch hẹn
  const handleConfirmAppointment = async (id) => {
    try {
      await api.put(`/consultant/appointments/${id}/confirm`);
      toast.success("Đã xác nhận lịch hẹn!");
      fetchAppointments();
    } catch (err) {
      toast.error("Không thể xác nhận lịch hẹn");
      console.error("Failed to confirm appointment:", err);
    }
  };
  
  const handleRejectAppointment = async (id) => {
    try {
      await api.put(`/consultant/appointments/${id}/reject`);
      toast.success("Đã từ chối lịch hẹn!");
      fetchAppointments();
    } catch (err) {
      toast.error("Không thể từ chối lịch hẹn");
      console.error("Failed to reject appointment:", err);
    }
  };
  
  const handleUpdateAppointmentNote = async () => {
    try {
      await api.put(`/consultant/appointments/${currentAppointment.id}/note`, {
        note: currentAppointment.note
      });
      toast.success("Đã cập nhật ghi chú!");
      fetchAppointments();
      setShowAppointmentModal(false);
    } catch (err) {
      toast.error("Không thể cập nhật ghi chú");
      console.error("Failed to update note:", err);
    }
  };
  
  const resetScheduleForm = () => {
    setCurrentSchedule({
      consultantId: "",
      workDate: "",
      startTime: { hour: 9, minute: 0, second: 0, nano: 0 },
      endTime: { hour: 9, minute: 45, second: 0, nano: 0 },
      isAvailable: true,
      maxAppointments: 5
    });
    setBulkTimeSlots(bulkTimeSlots.map(slot => ({ ...slot, selected: false })));
    setBulkCreateMode(false);
  };
  
  const handleConsultantChange = (e) => {
    const consultantId = e.target.value;
    setSelectedConsultant(consultantId);
    
    if (activeTab === "schedules" && consultantId) {
      fetchConsultantSchedules(consultantId);
    } else if (activeTab === "schedules") {
      fetchAllSchedules();
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  const toggleBulkTimeSlot = (index) => {
    const updatedSlots = [...bulkTimeSlots];
    updatedSlots[index].selected = !updatedSlots[index].selected;
    setBulkTimeSlots(updatedSlots);
  };

  const selectAllTimeSlots = () => {
    setBulkTimeSlots(bulkTimeSlots.map(slot => ({ ...slot, selected: true })));
  };

  const clearAllTimeSlots = () => {
    setBulkTimeSlots(bulkTimeSlots.map(slot => ({ ...slot, selected: false })));
  };

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-blue-900">Quản lý lịch trình tư vấn viên</h1>
          {activeTab === "schedules" && (
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              onClick={() => {
                resetScheduleForm();
                setShowCreateModal(true);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Thêm lịch mới
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          <button 
            className={`px-6 py-3 font-medium ${activeTab === "schedules" 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-500 hover:text-blue-600"}`}
            onClick={() => setActiveTab("schedules")}
          >
            Lịch làm việc
          </button>
          <button 
            className={`px-6 py-3 font-medium ${activeTab === "appointments" 
              ? "text-blue-600 border-b-2 border-blue-600" 
              : "text-gray-500 hover:text-blue-600"}`}
            onClick={() => setActiveTab("appointments")}
          >
            Lịch hẹn
          </button>
        </div>
      </div>
      
      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {activeTab === "schedules" ? (
          <>
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Tổng lịch làm việc</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Khả dụng</h3>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Không khả dụng</h3>
              <p className="text-2xl font-bold text-red-600">{stats.unavailable}</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Tổng lịch hẹn</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.totalAppointments}</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Đang chờ</h3>
              <p className="text-2xl font-bold text-yellow-500">{stats.pendingAppointments}</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Đã xác nhận</h3>
              <p className="text-2xl font-bold text-green-600">{stats.confirmedAppointments}</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Đã từ chối</h3>
              <p className="text-2xl font-bold text-red-600">{stats.rejectedAppointments}</p>
            </div>
          </>
        )}
      </div>
      
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Bộ lọc</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tư vấn viên</label>
            <select
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedConsultant}
              onChange={handleConsultantChange}
            >
              <option value="">Tất cả tư vấn viên</option>
              {consultants.map(consultant => (
                <option key={consultant.id} value={consultant.id}>
                  {consultant.fullName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          
          {/* Status filter hiển thị chỉ khi ở tab Appointments */}
          {activeTab === "appointments" && (
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="REJECTED">Đã từ chối</option>
              </select>
            </div>
          )}
          
          {(selectedConsultant || dateFilter || statusFilter) && (
            <button
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
              onClick={resetFilters}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>
      
      {/* Showing results count */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          {activeTab === "schedules" ? (
            <>
              Đang hiển thị {filteredSchedules.length} trong số {schedules.length} lịch làm việc
              {selectedConsultant && consultants.find(c => String(c.id) === String(selectedConsultant)) && 
                ` của ${consultants.find(c => String(c.id) === String(selectedConsultant)).fullName}`}
              {dateFilter && ` vào ngày ${formatDateDisplay(dateFilter)}`}
            </>
          ) : (
            <>
              Đang hiển thị {filteredAppointments.length} trong số {appointments.length} lịch hẹn
              {selectedConsultant && consultants.find(c => String(c.id) === String(selectedConsultant)) && 
                ` của ${consultants.find(c => String(c.id) === String(selectedConsultant)).fullName}`}
              {dateFilter && ` vào ngày ${formatDateDisplay(dateFilter)}`}
              {statusFilter && ` với trạng thái "${statusFilter === 'PENDING' ? 'Đang chờ' : statusFilter === 'CONFIRMED' ? 'Đã xác nhận' : 'Đã từ chối'}"`}
            </>
          )}
        </p>
      </div>
      
      {/* Table - Schedules */}
      {activeTab === "schedules" && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">Tư vấn viên</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">Ngày làm việc</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">Khung giờ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">Số lượng cuộc hẹn tối đa</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="flex justify-center">
                      <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </td>
                </tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium mb-1">Không tìm thấy lịch làm việc</p>
                    <p className="text-sm text-gray-400">
                      {(selectedConsultant || dateFilter) 
                        ? "Thử thay đổi bộ lọc để xem kết quả khác" 
                        : "Chưa có lịch làm việc nào được thiết lập"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-blue-50">
                    <td className="px-4 py-3">{schedule.id}</td>
                    <td className="px-4 py-3">
                      {consultants.find(c => String(c.id) === String(schedule.consultantId))?.fullName || "Không xác định"}
                    </td>
                    <td className="px-4 py-3">{formatDateDisplay(schedule.workDate)}</td>
                    <td className="px-4 py-3">
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        schedule.isAvailable 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {schedule.isAvailable ? "Khả dụng" : "Không khả dụng"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{schedule.maxAppointments}</td>
                    <td className="px-4 py-3 flex gap-2 justify-center">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => {
                          setCurrentSchedule({...schedule});
                          setShowEditModal(true);
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Table - Appointments */}
      {activeTab === "appointments" && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">Người dùng</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">Tư vấn viên</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">Ngày & Giờ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">Trạng thái</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="flex justify-center">
                      <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium mb-1">Không tìm thấy lịch hẹn</p>
                    <p className="text-sm text-gray-400">
                      {(selectedConsultant || dateFilter || statusFilter) 
                        ? "Thử thay đổi bộ lọc để xem kết quả khác" 
                        : "Chưa có lịch hẹn nào được đặt"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-blue-50">
                    <td className="px-4 py-3">{appointment.id}</td>
                    <td className="px-4 py-3">
                      {users.find(u => u.id === appointment.userId)?.fullName || appointment.userFullName || "Không xác định"}
                    </td>
                    <td className="px-4 py-3">
                      {consultants.find(c => c.id === appointment.consultantId)?.fullName || "Không xác định"}
                    </td>
                    <td className="px-4 py-3">
                      {appointment.appointmentTime 
                        ? new Date(appointment.appointmentTime).toLocaleString('vi-VN') 
                        : "Không xác định"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === "CONFIRMED" 
                          ? "bg-green-100 text-green-800" 
                          : appointment.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {appointment.status === "CONFIRMED" 
                          ? "Đã xác nhận" 
                          : appointment.status === "REJECTED"
                            ? "Đã từ chối"
                            : "Đang chờ"}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2 justify-center">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => {
                          setCurrentAppointment(appointment);
                          setShowAppointmentModal(true);
                        }}
                      >
                        Xem
                      </button>
                      
                      {appointment.status === "PENDING" && (
                        <>
                          <button
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                            onClick={() => handleConfirmAppointment(appointment.id)}
                          >
                            Xác nhận
                          </button>
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                            onClick={() => handleRejectAppointment(appointment.id)}
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-900">{bulkCreateMode ? 'Tạo nhiều lịch làm việc' : 'Tạo lịch làm việc'}</h2>
              <button 
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setShowCreateModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center mb-4">
                <button
                  className={`flex-1 py-2 ${!bulkCreateMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setBulkCreateMode(false)}
                >
                  Tạo đơn lẻ
                </button>
                <button
                  className={`flex-1 py-2 ${bulkCreateMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setBulkCreateMode(true)}
                >
                  Tạo hàng loạt
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tư vấn viên <span className="text-red-500">*</span></label>
                <select
                  className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentSchedule.consultantId}
                  onChange={e => setCurrentSchedule({...currentSchedule, consultantId: e.target.value})}
                >
                  <option value="">Chọn tư vấn viên</option>
                  {consultants.map(consultant => (
                    <option key={consultant.id} value={consultant.id}>{consultant.fullName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày làm việc <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentSchedule.workDate}
                  onChange={e => setCurrentSchedule({...currentSchedule, workDate: e.target.value})}
                />
              </div>
              
              {!bulkCreateMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giờ bắt đầu <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formatTime(currentSchedule.startTime)}
                      onChange={e => setCurrentSchedule({
                        ...currentSchedule, 
                        startTime: parseTimeInput(e.target.value)
                      })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giờ kết thúc <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formatTime(currentSchedule.endTime)}
                      onChange={e => setCurrentSchedule({
                        ...currentSchedule, 
                        endTime: parseTimeInput(e.target.value)
                      })}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khung giờ <span className="text-red-500">*</span></label>
                  <div className="mb-2 flex gap-2">
                    <button
                      type="button"
                      className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded"
                      onClick={selectAllTimeSlots}
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded"
                      onClick={clearAllTimeSlots}
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {bulkTimeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer ${
                          slot.selected ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleBulkTimeSlot(index)}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={slot.selected}
                            onChange={() => toggleBulkTimeSlot(index)}
                            className="mr-2"
                          />
                          <span>{slot.start} - {slot.end}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng cuộc hẹn tối đa <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentSchedule.maxAppointments}
                  onChange={e => setCurrentSchedule({
                    ...currentSchedule, 
                    maxAppointments: parseInt(e.target.value) || 1
                  })}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="isAvailable"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={currentSchedule.isAvailable}
                  onChange={e => setCurrentSchedule({...currentSchedule, isAvailable: e.target.checked})}
                />
                <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                  Khả dụng cho cuộc hẹn
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                onClick={handleCreateSchedule}
              >
                {bulkCreateMode ? 'Tạo các lịch' : 'Tạo lịch'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Schedule Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-900">Chỉnh sửa lịch làm việc</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tư vấn viên</label>
                <p className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded-lg text-gray-800">
                  {consultants.find(c => String(c.id) === String(currentSchedule.consultantId))?.fullName || "Không xác định"}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày làm việc <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentSchedule.workDate}
                  onChange={e => setCurrentSchedule({...currentSchedule, workDate: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giờ bắt đầu <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formatTime(currentSchedule.startTime)}
                    onChange={e => setCurrentSchedule({
                      ...currentSchedule, 
                      startTime: parseTimeInput(e.target.value)
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giờ kết thúc <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formatTime(currentSchedule.endTime)}
                    onChange={e => setCurrentSchedule({
                      ...currentSchedule, 
                      endTime: parseTimeInput(e.target.value)
                    })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng cuộc hẹn tối đa <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  className="mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentSchedule.maxAppointments}
                  onChange={e => setCurrentSchedule({
                    ...currentSchedule, 
                    maxAppointments: parseInt(e.target.value) || 1
                  })}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="editIsAvailable"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={currentSchedule.isAvailable}
                  onChange={e => setCurrentSchedule({...currentSchedule, isAvailable: e.target.checked})}
                />
                <label htmlFor="editIsAvailable" className="ml-2 block text-sm text-gray-900">
                  Khả dụng cho cuộc hẹn
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                onClick={handleUpdateSchedule}
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Appointment Detail Modal */}
      {showAppointmentModal && currentAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-900">Chi tiết cuộc hẹn</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAppointmentModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID cuộc hẹn</p>
                  <p className="font-medium">{currentAppointment.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentAppointment.status === "CONFIRMED" 
                        ? "bg-green-100 text-green-800" 
                        : currentAppointment.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {currentAppointment.status === "CONFIRMED" 
                        ? "Đã xác nhận" 
                        : currentAppointment.status === "REJECTED"
                          ? "Đã từ chối"
                          : "Đang chờ"}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Người dùng</p>
                <p className="font-medium">{users.find(u => u.id === currentAppointment.userId)?.fullName || currentAppointment.userFullName || "Không xác định"}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Tư vấn viên</p>
                <p className="font-medium">{consultants.find(c => c.id === currentAppointment.consultantId)?.fullName || "Không xác định"}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Thời gian cuộc hẹn</p>
                <p className="font-medium">
                  {currentAppointment.appointmentTime 
                    ? new Date(currentAppointment.appointmentTime).toLocaleString('vi-VN') 
                    : "Không xác định"}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                value={currentAppointment.note || ""}
                onChange={(e) => setCurrentAppointment({...currentAppointment, note: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              {currentAppointment.status === "PENDING" && (
                <>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
                    onClick={() => {
                      handleConfirmAppointment(currentAppointment.id);
                      setShowAppointmentModal(false);
                    }}
                  >
                    Xác nhận
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
                    onClick={() => {
                      handleRejectAppointment(currentAppointment.id);
                      setShowAppointmentModal(false);
                    }}
                  >
                    Từ chối
                  </button>
                </>
              )}
              
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                onClick={handleUpdateAppointmentNote}
              >
                Cập nhật ghi chú
              </button>
              
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition"
                onClick={() => setShowAppointmentModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultantScheduleManage;