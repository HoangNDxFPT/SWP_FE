import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../../config/axios';
import { toast } from 'react-toastify';

function ConsultantList() {
  const location = useLocation();
  const navigate = useNavigate();

  // Original states
  const [consultants, setConsultants] = useState([]);
  const [availabilityData, setAvailabilityData] = useState({});
  const [timeSlotOptions, setTimeSlotOptions] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    date: '',
    time: ''
  });
  const [loading, setLoading] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [error, setError] = useState(null);
  
  // New states for appointments
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [activeTab, setActiveTab] = useState('consultants'); // 'consultants' or 'appointments'
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('PENDING');
  
  // 1. Thêm state cho modal báo cáo (đặt dưới state khác)
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ appointmentId: null, reason: '', description: '' });
  
  // Min date for the date input (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Update filters
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'date' && value && consultants.length > 0) {
      fetchAvailabilityForAllConsultants(value);
    }
    if (key === 'date' && !value) {
      setFilters(prev => ({ ...prev, time: '' }));
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      date: '',
      time: ''
    });
    setAvailabilityData({});
  };

  // Go back function
  const goBack = () => {
    navigate(-1);
  };
  
  // Fetch user profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('profile');
        if (res.status === 200 && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setUser(null);
      }
    };
    
    fetchUser();
  }, []);

  // Fetch appointments when user is available or tab changes to appointments
  useEffect(() => {
    if (user && activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [user, activeTab, appointmentStatusFilter]);

  // Fetch appointments
  const fetchAppointments = async () => {
    if (!user) return;
    
    setLoadingAppointments(true);
    setAppointmentsError(null);
    
    try {
      const res = await api.get('/appointment/appointments', {
        params: { status: appointmentStatusFilter }
      });
      
      if (res.status === 200) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setAppointmentsError('Không thể tải danh sách cuộc hẹn');
      toast.error('Không thể tải danh sách cuộc hẹn');
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Fetch time slot options
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const response = await api.get('/slot');
        if (response.status === 200) {
          setTimeSlotOptions(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch time slots:', err);
        toast.error('Không thể tải danh sách khung giờ');
      }
    };

    fetchTimeSlots();
  }, []);

  // Fetch consultants on initial load
  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('consultant/public');
        if (res.status === 200) {
          setConsultants(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch consultants:', err);
        setError('Không thể tải danh sách chuyên viên tư vấn');
        toast.error('Không thể tải danh sách chuyên viên tư vấn');
      } finally {
        setLoading(false);
      }
    };
    fetchConsultants();
  }, []);

  // Fetch availability for all consultants
  const fetchAvailabilityForAllConsultants = async (selectedDate) => {
    if (!selectedDate || consultants.length === 0) return;
    
    setLoadingAvailability(true);
    try {
      // Build a map to store availability data for each consultant
      const availabilityMap = {};
      
      // Using Promise.all for parallel requests instead of sequential
      await Promise.all(consultants.map(async (consultant) => {
        try {
          const res = await api.get(`/slot/registered`, {
            params: {
              consultantId: consultant.consultantId,
              date: selectedDate
            }
          });
          
          if (res.status === 200) {
            availabilityMap[consultant.consultantId] = res.data;
          }
        } catch (err) {
          console.error(`Error fetching slots for consultant ${consultant.consultantId}:`, err);
          availabilityMap[consultant.consultantId] = [];
        }
      }));
      
      setAvailabilityData(availabilityMap);
    } catch (err) {
      console.error('Failed to fetch availability data:', err);
      toast.error('Không thể tải lịch làm việc của các tư vấn viên');
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Format time slot (helper function)
  const formatTimeSlot = (timeStr) => timeStr?.substring(0, 5);

  // Get all slots for a consultant, both available and unavailable
  const getAllSlots = (consultantId) => {
    if (!filters.date) return [];
    
    return availabilityData[consultantId] || [];
  };

  // Get only available slots for a consultant
  const getAvailableSlots = (consultantId) => {
    if (!filters.date) return [];
    
    const slots = availabilityData[consultantId] || [];
    return slots.filter(slot => slot.available);
  };

  // Filtered consultants based on all filters
  const filteredConsultants = useMemo(() => {
    return consultants.filter(consultant => {
      // Filter by name
      const nameMatch = !filters.search || 
        consultant.fullName?.toLowerCase().includes(filters.search.toLowerCase());
      
      // If not filtering by date, return based on name
      if (!filters.date) {
        return nameMatch;
      }
      
      // Get all slots for this consultant
      const consultantSlots = availabilityData[consultant.consultantId] || [];
      
      // If filtering by date but not time, show consultants that have any slots (available or not)
      if (!filters.time) {
        // Show consultant if there are any slots at all for this date
        return nameMatch && consultantSlots.length > 0;
      }
      
      // If filtering by both date and time, check if the consultant has that specific time slot
      // (regardless of availability)
      const hasSlotAtTime = consultantSlots.some(slot => 
        formatTimeSlot(slot.startTime) === filters.time
      );
      
      return nameMatch && hasSlotAtTime;
    });
  }, [consultants, filters, availabilityData]);

  // Check if a consultant has a slot at the selected time
  const hasSlotAtTime = (consultantId, time) => {
    if (!filters.date || !time) return false;
    
    const slots = availabilityData[consultantId] || [];
    return slots.some(slot => formatTimeSlot(slot.startTime) === time);
  };
  
  // Check if a consultant has an available slot at the selected time
  const hasAvailableSlotAtTime = (consultantId, time) => {
    if (!filters.date || !time) return false;
    
    const slots = availabilityData[consultantId] || [];
    return slots.some(slot => 
      formatTimeSlot(slot.startTime) === time && slot.available
    );
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Generate placeholder image URL using consultant name
  const getPlaceholderImage = (name) => {
    if (!name) return 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&size=150';
    
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=150`;
  };

  // Get end time for display
  const getEndTimeDisplay = (startTime) => {
    const selectedSlot = timeSlotOptions.find(slot => slot.label === startTime);
    if (selectedSlot) {
      return selectedSlot.end.substring(0, 5);
    }
    return `${parseInt(startTime.split(':')[0]) + 1}:${startTime.split(':')[1]}`;
  };

  // Format time utility function
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  // Add this new function to handle appointment cancellation
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?')) {
      return;
    }
    
    try {
      const response = await api.delete(`/appointment/appointments/${appointmentId}`);
      if (response.status === 204) {
        toast.success('Hủy lịch hẹn thành công');
        // Refresh the appointments list
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Có lỗi xảy ra khi hủy lịch hẹn. Vui lòng thử lại sau.');
    }
  };

  // 2. Thêm các hàm xử lý báo cáo (đặt sau hàm handleCancelAppointment)
  const handleOpenReportModal = (id) => {
    setReportData({ appointmentId: id, reason: '', description: '' });
    setShowReportModal(true);
  };

  const handleReportSubmit = async () => {
    const { appointmentId, reason, description } = reportData;
    if (!reason || !description) {
      toast.error('Vui lòng nhập đầy đủ lý do và mô tả!');
      return;
    }

    try {
      await api.post(`report?appointmentId=${appointmentId}&reason=${encodeURIComponent(reason)}&description=${encodeURIComponent(description)}`);
      toast.success('Báo cáo thành công!');
      setShowReportModal(false);
    } catch (error) {
      toast.error('Gửi báo cáo thất bại!');
      console.error(error);
    }
  };

  // Update active tab based on URL state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const isExpired = (appointment) => {
    const now = new Date();
    const end = new Date(`${appointment.date}T${appointment.endTime}`);
    return appointment.status === 'PENDING' && end < now;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      {/* Modern Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative py-20 lg:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white/90 backdrop-blur-sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Chuyên viên được chứng nhận
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Tư vấn tâm lý 
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {" "}chuyên nghiệp
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                Kết nối với các chuyên gia tâm lý hàng đầu, đồng hành cùng bạn trong hành trình phát triển bản thân và cải thiện sức khỏe tinh thần
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center text-white/80 text-sm">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Tư vấn online 24/7
                </div>
                <div className="flex items-center text-white/80 text-sm">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Bảo mật thông tin tuyệt đối
                </div>
                <div className="flex items-center text-white/80 text-sm">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Đội ngũ chuyên gia giàu kinh nghiệm
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/5 rounded-full translate-x-20 translate-y-20"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back Button with updated styling */}
        <div className="mb-8">
          <button 
            onClick={goBack}
            className="group flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200 mr-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </span>
            Trở về trang chủ
          </button>
        </div>
        
        {/* Tabs with improved design */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-md p-1 inline-flex">
            <button
              onClick={() => setActiveTab('consultants')}
              className={`py-2.5 px-5 rounded-lg font-medium transition-all ${
                activeTab === 'consultants'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Danh sách tư vấn viên
              </div>
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-2.5 px-5 rounded-lg font-medium transition-all flex items-center ${
                activeTab === 'appointments'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Lịch hẹn của tôi</span>
              {user && appointments.length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                  {appointments.length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Consultants Tab Content */}
        {activeTab === 'consultants' && (
          <>
            {/* Search and Filters with updated design */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="mb-6 flex flex-wrap justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2 md:mb-0 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Tìm kiếm chuyên viên tư vấn
                </h2>
                <button
                  onClick={resetFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  disabled={!filters.search && !filters.date && !filters.time}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Xóa bộ lọc
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên chuyên viên</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Nhập tên..."
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.search}
                      onChange={e => updateFilter('search', e.target.value)}
                    />
                    {filters.search && (
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => updateFilter('search', '')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày tư vấn</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg pl-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={filters.date}
                      onChange={e => updateFilter('date', e.target.value)}
                      min={today}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Khung giờ</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <select
                      className={`w-full border border-gray-300 rounded-lg pl-10 pr-8 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none ${!filters.date && 'opacity-60 cursor-not-allowed'}`}
                      value={filters.time}
                      onChange={e => updateFilter('time', e.target.value)}
                      disabled={!filters.date}
                    >
                      <option value="">Tất cả khung giờ</option>
                      {timeSlotOptions.map(slot => (
                        <option key={slot.id} value={slot.label}>
                          {slot.label} - {slot.end.substring(0, 5)}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {filters.date && (
                <div className="mt-5 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Đang hiển thị các chuyên viên có lịch vào:
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {formatDate(filters.date)}
                      {filters.time && ` | Khung giờ: ${filters.time} - ${getEndTimeDisplay(filters.time)}`}
                    </p>
                    <p className="text-xs text-blue-600 mt-1.5 italic">
                      💡 Khi bạn click vào tư vấn viên, thông tin ngày giờ này sẽ được tự động điền sẵn
                    </p>
                  </div>
                </div>
              )}
              
              {loadingAvailability && filters.date && (
                <div className="mt-4 flex items-center justify-center py-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                  <p className="text-sm text-gray-600">Đang tải lịch làm việc...</p>
                </div>
              )}
            </div>

            {/* Results Stats with updated styling */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                Danh sách chuyên viên
                {!loading && (
                  <span className="ml-3 text-sm font-normal px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {filteredConsultants.length} kết quả
                  </span>
                )}
              </h2>
            </div>

            {/* Consultant Cards with Enhanced Design */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 text-lg">Đang tải danh sách chuyên viên tư vấn...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-12 rounded-xl text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xl font-medium mb-3 text-red-800">Rất tiếc, đã xảy ra lỗi</p>
                <p className="mb-6">{error}</p>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </button>
              </div>
            ) : filteredConsultants.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-10 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Không tìm thấy chuyên viên nào</h3>
                <p className="text-gray-500 mb-5 max-w-lg mx-auto">
                  {filters.search || filters.date || filters.time
                    ? 'Không có chuyên viên nào có lịch phù hợp với tiêu chí tìm kiếm của bạn.'
                    : 'Hiện tại chưa có thông tin về chuyên viên tư vấn.'}
                </p>
                {(filters.search || filters.date || filters.time) && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Xóa bộ lọc và thử lại
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConsultants.map(consultant => (
                  <div key={consultant.consultantId} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition duration-300 border border-gray-100 relative">
                    <div className="p-5 flex items-center">
                      <img 
                        src={consultant.avatarUrl || getPlaceholderImage(consultant.fullName)} 
                        alt={consultant.fullName}
                        className="h-20 w-20 rounded-full object-cover mr-4 border-2 border-blue-100"
                      />
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 line-clamp-2">{consultant.fullName}</h3>
                        <p className="text-sm text-blue-600 font-medium">{consultant.degree || 'Chuyên viên tư vấn'}</p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Giới thiệu:</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {consultant.information || 'Chưa cập nhật thông tin giới thiệu.'}
                        </p>
                      </div>
                      
                      {consultant.address && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Địa chỉ:</h4>
                          <p className="text-sm text-gray-600">{consultant.address}</p>
                        </div>
                      )}
                      
                      {filters.date && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Lịch làm việc:</h4>
                          <div className="flex flex-wrap gap-2">
                            {filters.time ? (
                              hasSlotAtTime(consultant.consultantId, filters.time) ? (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  hasAvailableSlotAtTime(consultant.consultantId, filters.time) 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {filters.time} - {getEndTimeDisplay(filters.time)}
                                  {!hasAvailableSlotAtTime(consultant.consultantId, filters.time) && 
                                    <span className="ml-1">(Đã đặt)</span>
                                  }
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  Không có lịch vào khung giờ này
                                </span>
                              )
                            ) : (
                              getAllSlots(consultant.consultantId).length > 0 ? (
                                getAllSlots(consultant.consultantId).slice(0, 3).map(slot => (
                                  <span 
                                    key={slot.slotId} 
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                      slot.available 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {formatTimeSlot(slot.startTime)} - {formatTimeSlot(slot.endTime)}
                                    {!slot.available && <span className="ml-1">(Đã đặt)</span>}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  Không có lịch
                                </span>
                              )
                            )}
                            
                            {!filters.time && getAllSlots(consultant.consultantId).length > 3 && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                +{getAllSlots(consultant.consultantId).length - 3} khung giờ khác
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <Link
                        to={`/consultantDetail/${consultant.consultantId}${
                          filters.date || filters.time 
                            ? `?${new URLSearchParams({
                                ...(filters.date && { date: filters.date }),
                                ...(filters.time && { time: filters.time })
                              }).toString()}`
                            : ''
                        }`}
                        className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition shadow-sm hover:shadow font-medium mt-3"
                      >
                        {filters.date || filters.time 
                          ? 'Đặt lịch với thông tin đã chọn' 
                          : 'Xem hồ sơ và đặt lịch'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Appointments Tab Content */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Header Card with Title and Refresh Button */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Lịch hẹn của tôi
                  </h2>
                  <button 
                    onClick={fetchAppointments}
                    className="flex items-center text-sm text-white hover:text-blue-100 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Làm mới
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              {user && !loadingAppointments && !appointmentsError && (
                <div className="px-6 py-4">
                  <div className="flex flex-wrap -mx-1">
                    <button
                      onClick={() => setAppointmentStatusFilter('PENDING')}
                      className={`m-1 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                        appointmentStatusFilter === 'PENDING'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0114 0z" />
                        </svg>
                        Sắp tới
                      </div>
                    </button>
                    <button
                      onClick={() => setAppointmentStatusFilter('COMPLETED')}
                      className={`m-1 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                        appointmentStatusFilter === 'COMPLETED'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Đã hoàn thành
                      </div>
                    </button>
                    <button
                      onClick={() => setAppointmentStatusFilter('CANCELLED')}
                      className={`m-1 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                        appointmentStatusFilter === 'CANCELLED'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Đã hủy
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {!user ? (
                <div className="p-6">
                  <div className="flex items-center justify-center flex-col text-center py-8 px-6 bg-yellow-50 rounded-xl border border-yellow-100">
                    <div className="bg-yellow-100 p-3 rounded-full mb-4">
                      <svg className="h-8 w-8 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Vui lòng đăng nhập</h3>
                    <p className="text-yellow-700 mb-4">Bạn cần đăng nhập để xem lịch hẹn của mình</p>
                    <Link 
                      to="/login" 
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Đăng nhập
                    </Link>
                  </div>
                </div>
              ) : loadingAppointments ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-50"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-l-4 border-blue-600 absolute top-0 left-0" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                  </div>
                  <p className="mt-6 text-lg text-gray-600">Đang tải lịch hẹn...</p>
                  <p className="text-gray-500">Vui lòng đợi trong giây lát</p>
                </div>
              ) : appointmentsError ? (
                <div className="p-6">
                  <div className="flex flex-col items-center justify-center py-8 px-6 bg-red-50 rounded-xl border border-red-100">
                    <div className="bg-red-100 p-3 rounded-full mb-4">
                      <svg className="h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Đã xảy ra lỗi</h3>
                    <p className="text-red-700 mb-4">{appointmentsError}</p>
                    <button
                      onClick={fetchAppointments}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Thử lại
                    </button>
                  </div>
                </div>
              ) : appointments.length === 0 ? (
                <div className="p-6">
                  <div className="flex flex-col items-center justify-center py-12 px-6 bg-gray-50 rounded-xl text-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Không có lịch hẹn nào</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      {appointmentStatusFilter === 'PENDING' 
                        ? 'Bạn chưa có cuộc hẹn nào sắp tới với các tư vấn viên.'
                        : appointmentStatusFilter === 'COMPLETED'
                          ? 'Bạn chưa có cuộc hẹn nào đã hoàn thành.' 
                          : 'Bạn chưa có cuộc hẹn nào đã hủy.'}
                    </p>
                    <button
                      onClick={() => setActiveTab('consultants')}
                      className="inline-flex items-center px-5 py-2.5 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Đặt lịch với tư vấn viên
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {/* Desktop View */}
                  <div className="hidden md:block overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tư vấn viên
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thông tin lịch hẹn
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {appointments.map((appointment) => (
                          <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-lg">
                                  {appointment.consultantName.charAt(0)}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {appointment.consultantName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-center text-sm text-gray-900 mb-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDate(appointment.date)}
                                </div>
                                <div className="flex items-center text-sm text-gray-900">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0114 0z" />
                                  </svg>
                                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Đặt vào: {formatDate(appointment.createAt)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`flex items-center ${
                                appointment.status === 'PENDING' 
                                  ? 'text-blue-800'
                                  : appointment.status === 'COMPLETED'
                                    ? 'text-green-800'
                                    : 'text-red-800'
                              }`}>
                                <span className={`h-2.5 w-2.5 rounded-full mr-2 ${
                                  appointment.status === 'PENDING' 
                                    ? 'bg-blue-500 animate-pulse'
                                    : appointment.status === 'COMPLETED'
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                }`}></span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                                  appointment.status === 'PENDING' 
                                    ? 'bg-blue-100'
                                    : appointment.status === 'COMPLETED'
                                      ? 'bg-green-100'
                                      : 'bg-red-100'
                                }`}>
                                  {isExpired(appointment)
                                    ? 'Quá hạn'
                                    : appointment.status === 'PENDING'
                                      ? 'Sắp tới'
                                      : appointment.status === 'COMPLETED'
                                        ? 'Đã hoàn thành'
                                        : 'Đã hủy'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                {appointment.status !== 'CANCELLED' && !isExpired(appointment) ? (
                                  <a
                                    href={appointment.googleMeetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-medium ${
                                      appointment.status === 'PENDING'
                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } transition-colors`}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    {appointment.status === 'PENDING' ? 'Tham gia buổi tư vấn' : 'Xem link buổi tư vấn'}
                                  </a>
                                ) : (
                                  <div className="flex-1 py-2 px-3 flex justify-center items-center rounded-lg text-sm font-medium bg-gray-100 text-gray-400 opacity-60">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    Link không khả dụng
                                  </div>
                                )}
                                {appointment.status === 'PENDING' && !isExpired(appointment) && (
                                  <button
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                    className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Hủy lịch
                                  </button>
                                )}
                                {appointment.status === 'COMPLETED' && (
                                  <button
                                    onClick={() => handleOpenReportModal(appointment.id)}
                                    className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Báo cáo
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="block md:hidden">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="p-4 border-b last:border-b-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-lg mr-3">
                              {appointment.consultantName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-gray-800 leading-tight">{appointment.consultantName}</h3>
                              <div className={`inline-flex items-center mt-1 ${
                                appointment.status === 'PENDING' 
                                  ? 'text-blue-800'
                                  : appointment.status === 'COMPLETED'
                                    ? 'text-green-800'
                                    : 'text-red-800'
                              }`}>
                                <span className={`h-2 w-2 rounded-full mr-1.5 ${
                                  appointment.status === 'PENDING' 
                                    ? 'bg-blue-500 animate-pulse'
                                    : appointment.status === 'COMPLETED'
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                }`}></span>
                                <span className="text-xs font-medium">
                                  {appointment.status === 'PENDING' 
                                    ? 'Sắp tới' 
                                    : appointment.status === 'COMPLETED'
                                      ? 'Đã hoàn thành'
                                      : 'Đã hủy'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center text-sm text-gray-700">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div>
                                <span className="font-medium">{formatDate(appointment.date)}</span>
                              </div>
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0114 0z" />
                              </svg>
                              <span className="font-medium">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Đặt vào: {formatDate(appointment.createAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {appointment.status !== 'CANCELLED' ? (
                            <a
                              href={appointment.googleMeetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex-1 py-2 px-3 flex justify-center items-center rounded-lg text-sm font-medium transition-colors ${
                                appointment.status === 'PENDING'
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              {appointment.status === 'PENDING' ? 'Tham gia buổi tư vấn' : 'Xem link buổi tư vấn'}
                            </a>
                          ) : (
                            <div className="flex-1 py-2 px-3 flex justify-center items-center rounded-lg text-sm font-medium bg-gray-100 text-gray-400 opacity-60">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              Link không khả dụng
                            </div>
                          )}
                          
                          {appointment.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="py-2 px-3 flex justify-center items-center rounded-lg text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Hủy lịch
                            </button>
                          )}
                          {/* 4. Thêm nút báo cáo cho mobile view - tìm phần flex space-x-2 trong mobile card và thêm: */}
                          {appointment.status === 'COMPLETED' && (
                            <button
                              onClick={() => handleOpenReportModal(appointment.id)}
                              className="py-2 px-3 flex justify-center items-center rounded-lg text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Báo cáo
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Báo cáo vấn đề</h3>
              <p className="mt-1 text-sm text-gray-500">Vui lòng cho chúng tôi biết chi tiết về vấn đề bạn gặp phải</p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Lý do báo cáo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="reason"
                    value={reportData.reason}
                    onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Nhập lý do báo cáo"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Chi tiết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows="4"
                    value={reportData.description}
                    onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải"
                  />
                </div>
              </div>
            </div>
            
            <div className="px-4 py-4 sm:px-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReportSubmit}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default ConsultantList;
