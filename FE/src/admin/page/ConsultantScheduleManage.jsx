import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format, parse } from 'date-fns';

function ConsultantScheduleManage() {
  // Tab chuyển đổi giữa lịch làm việc và lịch hẹn
  const [activeTab, setActiveTab] = useState("schedules"); // "schedules" hoặc "appointments"
  
  // States cho lịch làm việc (đã có)
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  
  // States cho lịch hẹn (mới thêm vào)
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
  
  // Modal states cho lịch làm việc (đã có)
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
  
  // Modal states cho lịch hẹn (mới thêm vào)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  
  // Filter states chung
  const [selectedConsultant, setSelectedConsultant] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // Dùng cho lịch hẹn
  
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
      toast.error("Failed to load consultants!");
    }
  };
  
  const fetchUsers = async () => {
    try {
      const res = await api.get("/profile/all");
      setUsers(res.data || []);
    } catch (err) {
      toast.error("Failed to load users!");
    }
  };
  
  const fetchAllSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get("/consultant/schedules");
      setSchedules(res.data || []);
    } catch (err) {
      toast.error("Failed to load schedules!");
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
      toast.error("Failed to load appointments!");
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
      toast.error("Failed to load consultant schedules!");
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
      filtered = filtered.filter(s => s.consultantId === selectedConsultant);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(s => s.workDate === dateFilter);
    }
    
    setFilteredSchedules(filtered);
  };
  
  const applyAppointmentFilters = () => {
    let filtered = [...appointments];
    
    if (selectedConsultant) {
      filtered = filtered.filter(a => a.consultantId === selectedConsultant);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(a => {
        const appointmentDate = a.appointmentTime.split('T')[0];
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
    const { hour, minute } = timeObj;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
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
      toast.error("Please fill all required fields!");
      return;
    }
    
    try {
      await api.post("/consultant/schedules", currentSchedule);
      toast.success("Schedule created successfully!");
      fetchAllSchedules();
      setShowCreateModal(false);
      resetScheduleForm();
    } catch (err) {
      toast.error("Failed to create schedule: " + (err.response?.data?.message || "Unknown error"));
    }
  };
  
  const handleUpdateSchedule = async () => {
    if (!currentSchedule.workDate) {
      toast.error("Please fill all required fields!");
      return;
    }
    
    try {
      await api.put(`/consultant/schedules/${currentSchedule.id}`, currentSchedule);
      toast.success("Schedule updated successfully!");
      fetchAllSchedules();
      setShowEditModal(false);
    } catch (err) {
      toast.error("Failed to update schedule: " + (err.response?.data?.message || "Unknown error"));
    }
  };
  
  const handleDeleteSchedule = async (id) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await api.delete(`/consultant/schedules/${id}`);
        toast.success("Schedule deleted successfully!");
        setSchedules(schedules.filter(s => s.id !== id));
      } catch (err) {
        toast.error("Failed to delete schedule!");
      }
    }
  };
  
  // Xử lý lịch hẹn
  const handleConfirmAppointment = async (id) => {
    try {
      await api.put(`/consultant/appointments/${id}/confirm`);
      toast.success("Appointment confirmed!");
      fetchAppointments();
    } catch (err) {
      toast.error("Failed to confirm appointment!");
    }
  };
  
  const handleRejectAppointment = async (id) => {
    try {
      await api.put(`/consultant/appointments/${id}/reject`);
      toast.success("Appointment rejected!");
      fetchAppointments();
    } catch (err) {
      toast.error("Failed to reject appointment!");
    }
  };
  
  const handleUpdateAppointmentNote = async () => {
    try {
      await api.put(`/consultant/appointments/${currentAppointment.id}/note`, {
        note: currentAppointment.note
      });
      toast.success("Note updated!");
      fetchAppointments();
      setShowAppointmentModal(false);
    } catch (err) {
      toast.error("Failed to update note!");
    }
  };
  
  const resetScheduleForm = () => {
    setCurrentSchedule({
      consultantId: "",
      workDate: "",
      startTime: { hour: 9, minute: 0, second: 0, nano: 0 },
      endTime: { hour: 17, minute: 0, second: 0, nano: 0 },
      isAvailable: true,
      maxAppointments: 1
    });
  };
  
  const handleConsultantChange = (e) => {
    const consultantId = e.target.value;
    setSelectedConsultant(consultantId);
    
    if (activeTab === "schedules" && consultantId) {
      fetchConsultantSchedules(consultantId);
    } else if (activeTab === "schedules") {
      fetchAllSchedules();
    } else {
      // Nếu đang ở tab lịch hẹn thì không cần gọi API mới, chỉ cần lọc
      applyAppointmentFilters();
    }
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={2000} />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Consultant Management</h1>
        {activeTab === "schedules" && (
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            onClick={() => {
              resetScheduleForm();
              setShowCreateModal(true);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Schedule
          </button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === "schedules" 
            ? "text-blue-600 border-b-2 border-blue-600" 
            : "text-gray-500 hover:text-blue-600"}`}
          onClick={() => setActiveTab("schedules")}
        >
          Working Schedules
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === "appointments" 
            ? "text-blue-600 border-b-2 border-blue-600" 
            : "text-gray-500 hover:text-blue-600"}`}
          onClick={() => setActiveTab("appointments")}
        >
          Appointment Bookings
        </button>
      </div>
      
      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {activeTab === "schedules" ? (
          <>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Schedules</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Available</h3>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Unavailable</h3>
              <p className="text-2xl font-bold text-red-600">{stats.unavailable}</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Appointments</h3>
              <p className="text-2xl font-bold text-blue-900">{stats.totalAppointments}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Pending</h3>
              <p className="text-2xl font-bold text-yellow-500">{stats.pendingAppointments}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Confirmed</h3>
              <p className="text-2xl font-bold text-green-600">{stats.confirmedAppointments}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Rejected</h3>
              <p className="text-2xl font-bold text-red-600">{stats.rejectedAppointments}</p>
            </div>
          </>
        )}
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Consultant</label>
            <select
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedConsultant}
              onChange={handleConsultantChange}
            >
              <option value="">All Consultants</option>
              {consultants.map(consultant => (
                <option key={consultant.id} value={consultant.id}>
                  {consultant.fullName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          
          {/* Status filter hiển thị chỉ khi ở tab Appointments */}
          {activeTab === "appointments" && (
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          )}
          
          {(selectedConsultant || dateFilter || statusFilter) && (
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded mt-auto"
              onClick={resetFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {/* Showing results count */}
      <p className="text-sm text-gray-500 mb-2">
        {activeTab === "schedules" ? (
          <>
            Showing {filteredSchedules.length} of {schedules.length} schedules
            {selectedConsultant && consultants.find(c => c.id === selectedConsultant) && 
              ` for ${consultants.find(c => c.id === selectedConsultant).fullName}`}
            {dateFilter && ` on date ${dateFilter}`}
          </>
        ) : (
          <>
            Showing {filteredAppointments.length} of {appointments.length} appointments
            {selectedConsultant && consultants.find(c => c.id === selectedConsultant) && 
              ` for ${consultants.find(c => c.id === selectedConsultant).fullName}`}
            {dateFilter && ` on date ${dateFilter}`}
            {statusFilter && ` with status "${statusFilter}"`}
          </>
        )}
      </p>
      
      {/* Table - Schedules */}
      {activeTab === "schedules" && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-900">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">ID</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Consultant</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Time Range</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Max Appointments</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
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
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No schedules found
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-blue-50">
                    <td className="px-4 py-2">{schedule.id}</td>
                    <td className="px-4 py-2">
                      {consultants.find(c => c.id === schedule.consultantId)?.fullName || "Unknown"}
                    </td>
                    <td className="px-4 py-2">{schedule.workDate}</td>
                    <td className="px-4 py-2">
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        schedule.isAvailable 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {schedule.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-2">{schedule.maxAppointments}</td>
                    <td className="px-4 py-2 flex gap-2 justify-center">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => {
                          setCurrentSchedule({...schedule});
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        Delete
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
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">ID</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">User</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Consultant</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Date & Time</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-white">Status</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
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
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No appointments found
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-blue-50">
                    <td className="px-4 py-2">{appointment.id}</td>
                    <td className="px-4 py-2">
                      {users.find(u => u.id === appointment.userId)?.fullName || appointment.userFullName || "Unknown"}
                    </td>
                    <td className="px-4 py-2">
                      {consultants.find(c => c.id === appointment.consultantId)?.fullName || "Unknown"}
                    </td>
                    <td className="px-4 py-2">
                      {appointment.appointmentTime 
                        ? new Date(appointment.appointmentTime).toLocaleString() 
                        : "Not set"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === "CONFIRMED" 
                          ? "bg-green-100 text-green-800" 
                          : appointment.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 flex gap-2 justify-center">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => {
                          setCurrentAppointment(appointment);
                          setShowAppointmentModal(true);
                        }}
                      >
                        View
                      </button>
                      
                      {appointment.status === "PENDING" && (
                        <>
                          <button
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                            onClick={() => handleConfirmAppointment(appointment.id)}
                          >
                            Confirm
                          </button>
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                            onClick={() => handleRejectAppointment(appointment.id)}
                          >
                            Reject
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
      
      {/* Create Schedule Modal - Giữ nguyên như cũ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Schedule</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Consultant <span className="text-red-500">*</span></label>
                <select
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentSchedule.consultantId}
                  onChange={e => setCurrentSchedule({...currentSchedule, consultantId: e.target.value})}
                >
                  <option value="">Select Consultant</option>
                  {consultants.map(consultant => (
                    <option key={consultant.id} value={consultant.id}>{consultant.fullName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Work Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentSchedule.workDate}
                  onChange={e => setCurrentSchedule({...currentSchedule, workDate: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formatTime(currentSchedule.startTime)}
                    onChange={e => setCurrentSchedule({
                      ...currentSchedule, 
                      startTime: parseTimeInput(e.target.value)
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formatTime(currentSchedule.endTime)}
                    onChange={e => setCurrentSchedule({
                      ...currentSchedule, 
                      endTime: parseTimeInput(e.target.value)
                    })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Appointments <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Available for appointments
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleCreateSchedule}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Schedule Modal - Giữ nguyên như cũ */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Schedule</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Consultant</label>
                <p className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded">
                  {consultants.find(c => c.id === currentSchedule.consultantId)?.fullName || "Unknown"}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Work Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={currentSchedule.workDate}
                  onChange={e => setCurrentSchedule({...currentSchedule, workDate: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formatTime(currentSchedule.startTime)}
                    onChange={e => setCurrentSchedule({
                      ...currentSchedule, 
                      startTime: parseTimeInput(e.target.value)
                    })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formatTime(currentSchedule.endTime)}
                    onChange={e => setCurrentSchedule({
                      ...currentSchedule, 
                      endTime: parseTimeInput(e.target.value)
                    })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Appointments <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Available for appointments
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleUpdateSchedule}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Appointment Detail Modal - Modal mới cho xem chi tiết lịch hẹn */}
      {showAppointmentModal && currentAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Appointment Details</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAppointmentModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Appointment ID</p>
                  <p className="font-medium">{currentAppointment.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentAppointment.status === "CONFIRMED" 
                        ? "bg-green-100 text-green-800" 
                        : currentAppointment.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {currentAppointment.status}
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">User</p>
                <p className="font-medium">{users.find(u => u.id === currentAppointment.userId)?.fullName || currentAppointment.userFullName || "Unknown"}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Consultant</p>
                <p className="font-medium">{consultants.find(c => c.id === currentAppointment.consultantId)?.fullName || "Unknown"}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Appointment Time</p>
                <p className="font-medium">
                  {currentAppointment.appointmentTime 
                    ? new Date(currentAppointment.appointmentTime).toLocaleString() 
                    : "Not set"}
                </p>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Notes</label>
                <textarea 
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={currentAppointment.note || ""}
                  onChange={(e) => setCurrentAppointment({...currentAppointment, note: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                {currentAppointment.status === "PENDING" && (
                  <>
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded"
                      onClick={() => {
                        handleConfirmAppointment(currentAppointment.id);
                        setShowAppointmentModal(false);
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded"
                      onClick={() => {
                        handleRejectAppointment(currentAppointment.id);
                        setShowAppointmentModal(false);
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}
                
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                  onClick={handleUpdateAppointmentNote}
                >
                  Update Notes
                </button>
                
                <button
                  className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded"
                  onClick={() => setShowAppointmentModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultantScheduleManage;