import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Tabs } from 'antd';

function ConsultantManagement() {
    // States
    const [activeTab, setActiveTab] = useState("consultants");
    const [consultants, setConsultants] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [consultantSlots, setConsultantSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);

    // Filter states - remove searchTerm
    const [selectedConsultant, setSelectedConsultant] = useState("");
    const [selectedMember, setSelectedMember] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [slotDateFilter, setSlotDateFilter] = useState("");

    // Modal states
    const [showConsultantModal, setShowConsultantModal] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [currentConsultant, setCurrentConsultant] = useState({
        fullName: "",
        degree: "",
        information: "",
        address: "",
        certifiedDegreeImage: ""
    });
    const [currentAppointment, setCurrentAppointment] = useState(null);
    const [currentSlot, setCurrentSlot] = useState(null);

    // Add new states
    const [consultantDays, setConsultantDays] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [showDayDetailModal, setShowDayDetailModal] = useState(false);
    const [currentDaySlots, setCurrentDaySlots] = useState([]);

    // Stats
    const [stats, setStats] = useState({
        totalConsultants: 0,
        activeConsultants: 0,
        totalAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        rejectedAppointments: 0,
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0
    });

    // Fetch data when tab changes
    useEffect(() => {
        fetchConsultants();
        fetchMembers();
        if (activeTab === "appointments") {
            fetchAppointments();
        } else if (activeTab === "slots") {
            fetchConsultantDays();
        }
    }, [activeTab]);

    // Apply filters when filter values change - remove searchTerm
    useEffect(() => {
        if (activeTab === "appointments") {
            fetchAppointments();
        } else if (activeTab === "slots") {
            fetchConsultantDays();
        } else if (activeTab === "consultants") {
            fetchConsultants();
        }
    }, [selectedConsultant, selectedMember, dateFilter, statusFilter, slotDateFilter]);

    const fetchConsultants = async () => {
        setLoading(true);
        try {
            const res = await api.get("/consultant/all");
            let consultantData = res.data || [];
            
            // Apply filter if selectedConsultant is set
            if (selectedConsultant && activeTab === "consultants") {
                consultantData = consultantData.filter(consultant => 
                    consultant.consultantId.toString() === selectedConsultant
                );
            }
            
            setConsultants(consultantData);
            
            // Calculate consultant stats based on filtered data
            const consultantStats = {
                totalConsultants: consultantData.length,
                activeConsultants: consultantData.filter(c => c.status === "ACTIVE").length
            };
            setStats(prev => ({ ...prev, ...consultantStats }));
        } catch (err) {
            toast.error("Không thể tải danh sách tư vấn viên");
            console.error("Failed to load consultants:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await api.get("/profile/all");
            const onlyMembers = res.data?.filter(user => user.role === "MEMBER") || [];
            setMembers(onlyMembers);
        } catch (err) {
            console.error("Failed to load members:", err);
        }
    };

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const params = {};
            
            // Add filters to params - remove searchTerm
            if (selectedConsultant) {
                params.consultantId = selectedConsultant;
            }
            if (selectedMember) {
                params.memberId = selectedMember;
            }
            if (dateFilter) {
                params.date = dateFilter;
            }
            if (statusFilter) {
                params.status = statusFilter;
            }

            const res = await api.get("/appointment/appointments/admin", { params });
            setAppointments(res.data || []);

            // Calculate appointment stats
            const appointmentStats = {
                totalAppointments: res.data?.length || 0,
                pendingAppointments: res.data?.filter(a => a.status === "PENDING").length || 0,
                confirmedAppointments: res.data?.filter(a => a.status === "COMPLETED").length || 0,
                rejectedAppointments: res.data?.filter(a => a.status === "CANCELLED").length || 0
            };
            setStats(prev => ({ ...prev, ...appointmentStats }));
        } catch (err) {
            toast.error("Không thể tải danh sách cuộc hẹn");
            console.error("Failed to load appointments:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchConsultantDays = async () => {
        setLoading(true);
        try {
            if (!selectedConsultant) {
                setConsultantDays([]);
                setStats(prev => ({
                    ...prev,
                    totalSlots: 0,
                    availableSlots: 0,
                    bookedSlots: 0
                }));
                setLoading(false);
                return;
            }

            const params = { consultantId: selectedConsultant };
            const res = await api.get("/slot/slots/consultant", { params });
            const slots = res.data || [];

            // Group slots by date
            const groupedByDate = slots.reduce((acc, slot) => {
                const date = slot.date;
                if (!acc[date]) {
                    acc[date] = {
                        date: date,
                        totalSlots: 0,
                        availableSlots: 0,
                        bookedSlots: 0,
                        slots: []
                    };
                }
                acc[date].totalSlots++;
                acc[date].slots.push(slot);
                
                if (slot.status === "CÒN TRỐNG") {
                    acc[date].availableSlots++;
                } else if (slot.status === "ĐÃ ĐẶT") {
                    acc[date].bookedSlots++;
                }
                
                return acc;
            }, {});

            const daysArray = Object.values(groupedByDate).sort((a, b) => new Date(a.date) - new Date(b.date));
            setConsultantDays(daysArray);

            // Calculate total stats
            const totalStats = {
                totalSlots: slots.length,
                availableSlots: slots.filter(s => s.status === "CÒN TRỐNG").length,
                bookedSlots: slots.filter(s => s.status === "ĐÃ ĐẶT").length
            };
            setStats(prev => ({ ...prev, ...totalStats }));

        } catch (err) {
            toast.error("Không thể tải lịch làm việc của tư vấn viên");
            console.error("Failed to load consultant schedule:", err);
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        // Remove searchTerm from reset
        setSelectedConsultant("");
        setSelectedMember("");
        setDateFilter("");
        setStatusFilter("");
        setSlotDateFilter("");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return format(date, 'dd/MM/yyyy', { locale: vi });
        } catch (error) {
            return dateString;
        }
    };

    const formatDateLong = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
        } catch (error) {
            return dateString;
        }
    };

    const handleTabChange = (key) => {
        setActiveTab(key);
        // Reset filters when changing tabs
        resetFilters();
    };

    const viewConsultantDetails = (consultant) => {
        setCurrentConsultant({ ...consultant });
        setShowConsultantModal(true);
    };

    const viewAppointmentDetails = (appointment) => {
        setCurrentAppointment(appointment);
        setShowAppointmentModal(true);
    };

    const viewSlotDetails = (slot) => {
        setCurrentSlot(slot);
        setShowSlotModal(true);
    };

    const viewConsultantSchedule = (consultantId) => {
        setSelectedConsultant(consultantId.toString());
        setActiveTab("slots");
    };

    const viewDayDetails = (dayData) => {
        setCurrentDaySlots(dayData.slots);
        setSelectedDate(dayData.date);
        setShowDayDetailModal(true);
    };

    return (
        <div className="bg-gray-50 p-6 min-h-screen">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-xl shadow-md mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Quản lý tư vấn viên</h1>
                        <p className="text-blue-100 mt-1">Theo dõi thông tin tư vấn viên, lịch hẹn và lịch làm việc</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {activeTab === "consultants" ? (
                        <>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-100">Tổng số tư vấn viên</p>
                                <p className="text-2xl font-bold">{stats.totalConsultants}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-100">Đang hoạt động</p>
                                <p className="text-2xl font-bold">{stats.activeConsultants}</p>
                            </div>
                        </>
                    ) : activeTab === "appointments" ? (
                        <>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-100">Tổng số cuộc hẹn</p>
                                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-100">Đang chờ xác nhận</p>
                                <p className="text-2xl font-bold">{stats.pendingAppointments}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-100">Đã xác nhận</p>
                                <p className="text-2xl font-bold">{stats.confirmedAppointments}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-100">Đã từ chối</p>
                                <p className="text-2xl font-bold">{stats.rejectedAppointments}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-100">Tổng số lịch</p>
                                <p className="text-2xl font-bold">{stats.totalSlots}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-100">Còn trống</p>
                                <p className="text-2xl font-bold">{stats.availableSlots}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-100">Đã đặt</p>
                                <p className="text-2xl font-bold">{stats.bookedSlots}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
                <Tabs
                    activeKey={activeTab}
                    onChange={handleTabChange}
                    className="px-6 pt-4"
                    items={[
                        {
                            key: 'consultants',
                            label: (
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    Tư vấn viên
                                </div>
                            )
                        },
                        {
                            key: 'appointments',
                            label: (
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    Cuộc hẹn
                                </div>
                            )
                        },
                        {
                            key: 'slots',
                            label: (
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    Lịch làm việc
                                </div>
                            )
                        }
                    ]}
                />
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                    Bộ lọc
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Tư vấn viên - cho tất cả tabs */}
                    {activeTab === "consultants" ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tư vấn viên</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={selectedConsultant}
                                onChange={(e) => setSelectedConsultant(e.target.value)}
                            >
                                <option value="">Tất cả tư vấn viên</option>
                                {consultants.map(consultant => (
                                    <option key={consultant.consultantId} value={consultant.consultantId}>
                                        {consultant.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (activeTab === "appointments" || activeTab === "slots") && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tư vấn viên</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={selectedConsultant}
                                onChange={(e) => setSelectedConsultant(e.target.value)}
                            >
                                <option value="">Tất cả tư vấn viên</option>
                                {consultants.map(consultant => (
                                    <option key={consultant.consultantId} value={consultant.consultantId}>
                                        {consultant.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Ngày - cho appointments */}
                    {activeTab === "appointments" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Ngày - cho slots */}
                    {activeTab === "slots" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={slotDateFilter}
                                onChange={(e) => setSlotDateFilter(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Trạng thái */}
                    {(activeTab === "appointments" || activeTab === "slots") && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Tất cả trạng thái</option>
                                {activeTab === "appointments" ? (
                                    <>
                                        <option value="PENDING">Đang chờ</option>
                                        <option value="COMPLETED">Đã xác nhận</option>
                                        <option value="CANCELLED">Đã từ chối</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="CÒN TRỐNG">Còn trống</option>
                                        <option value="ĐÃ ĐẶT">Đã đặt</option>
                                    </>
                                )}
                            </select>
                        </div>
                    )}

                    {/* Người dùng - chỉ cho appointments */}
                    {activeTab === "appointments" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Người dùng</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={selectedMember}
                                onChange={(e) => setSelectedMember(e.target.value)}
                            >
                                <option value="">Tất cả người dùng</option>
                                {members.map(member => (
                                    <option key={member.userId || member.id} value={member.userId || member.id}>
                                        {member.fullName || member.userName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Nút xóa bộ lọc */}
                {(selectedConsultant || dateFilter || statusFilter || slotDateFilter || selectedMember) && (
                    <div className="mt-4">
                        <button
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors"
                            onClick={resetFilters}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </div>
            

            {/* Content */}
            {activeTab === "consultants" ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
                        </div>
                    ) : consultants.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-500 mb-1">Không tìm thấy tư vấn viên</h3>
                            <p className="text-gray-400">
                                {selectedConsultant ? 
                                    "Thử thay đổi bộ lọc để xem kết quả khác" : 
                                    "Chưa có tư vấn viên nào trong hệ thống"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {consultants.map(consultant => (
                                <div key={consultant.consultantId} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                                    <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 p-4 flex items-center">
                                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold mr-4">
                                            {consultant.fullName?.charAt(0) || 'C'}
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-bold text-gray-800">{consultant.fullName}</h3>
                                            <p className="text-blue-600">{consultant.degree || "Chưa cập nhật"}</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-4">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <span className="text-xs font-medium uppercase text-gray-500">Địa chỉ</span>
                                                <p className="text-gray-700">{consultant.address || "Chưa cập nhật"}</p>
                                            </div>

                                            <div>
                                                <span className="text-xs font-medium uppercase text-gray-500">Thông tin</span>
                                                <p className="text-gray-700 line-clamp-2">{consultant.information || "Chưa cập nhật"}</p>
                                            </div>

                                            <div className="flex justify-between items-center mt-2">
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                                    onClick={() => viewConsultantDetails(consultant)}
                                                >
                                                    Xem chi tiết
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                                                    onClick={() => viewConsultantSchedule(consultant.consultantId)}
                                                >
                                                    Xem lịch làm việc
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : activeTab === "appointments" ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người dùng
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tư vấn viên
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày & Giờ
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <h3 className="text-xl font-semibold text-gray-500 mb-1">Không tìm thấy cuộc hẹn</h3>
                                            <p className="text-gray-400">
                                                {selectedConsultant || dateFilter || statusFilter || selectedMember ?
                                                    "Thử thay đổi bộ lọc để xem kết quả khác" :
                                                    "Chưa có cuộc hẹn nào được đặt"}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map(appointment => (
                                        <tr key={appointment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {appointment.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {appointment.memberName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {appointment.consultantName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                <div>
                                                    <div className="font-medium">{formatDate(appointment.date)}</div>
                                                    <div className="text-gray-500">{appointment.startTime} - {appointment.endTime}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appointment.status === "COMPLETED"
                                                        ? "bg-green-100 text-green-800"
                                                        : appointment.status === "CANCELLED"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                    }`}>
                                                    {appointment.status === "COMPLETED"
                                                        ? "Đã xác nhận"
                                                        : appointment.status === "CANCELLED"
                                                            ? "Đã từ chối"
                                                            : "Đang chờ"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <button
                                                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors"
                                                    onClick={() => viewAppointmentDetails(appointment)}
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {!selectedConsultant ? (
                        <div className="py-16 flex flex-col items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-500 mb-1">Vui lòng chọn tư vấn viên</h3>
                            <p className="text-gray-400">Hãy chọn tư vấn viên để xem lịch làm việc</p>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
                        </div>
                    ) : consultantDays.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-gray-500 mb-1">Không tìm thấy lịch làm việc</h3>
                            <p className="text-gray-400">Tư vấn viên này chưa có lịch làm việc nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày làm việc
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tổng số slot
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Còn trống
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Đã đặt
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {consultantDays.map((dayData, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatDateLong(dayData.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {dayData.totalSlots} slot
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {dayData.availableSlots}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                    {dayData.bookedSlots}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <button
                                                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors"
                                                    onClick={() => viewDayDetails(dayData)}
                                                >
                                                    Xem chi tiết
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

            {/* Consultant Modal */}
            {showConsultantModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-800">
                                Thông tin chi tiết tư vấn viên
                            </h3>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setShowConsultantModal(false)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1">
                                    <div className="flex flex-col items-center">
                                        <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-md flex items-center justify-center text-blue-600 text-5xl font-bold mb-4 mx-auto">
                                            {currentConsultant.fullName?.charAt(0) || 'C'}
                                        </div>

                                        <h3 className="text-xl font-bold text-center text-gray-800">{currentConsultant.fullName}</h3>
                                        <p className="text-blue-600 font-medium mb-6">{currentConsultant.degree || "Chưa cập nhật bằng cấp"}</p>

                                        <div className="bg-gray-50 rounded-lg p-4 w-full">
                                            <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">Thông tin liên hệ</h4>
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Địa chỉ:</span>
                                                <p className="text-gray-800">{currentConsultant.address || "Chưa cập nhật"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2">
                                    <div>
                                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                            <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">Thông tin chuyên môn</h4>
                                            <div className="prose max-w-none text-gray-700">
                                                <p className="whitespace-pre-line">{currentConsultant.information || "Chưa cập nhật thông tin chuyên môn."}</p>
                                            </div>
                                        </div>

                                        {currentConsultant.certifiedDegreeImage && (
                                            <div>
                                                <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-2">Chứng chỉ</h4>
                                                <div className="border rounded-lg overflow-hidden">
                                                    <img
                                                        src={currentConsultant.certifiedDegreeImage}
                                                        alt="Chứng chỉ"
                                                        className="w-full object-contain max-h-80 cursor-pointer"
                                                        onClick={() => window.open(currentConsultant.certifiedDegreeImage, '_blank')}
                                                    />
                                                    <div className="bg-gray-50 px-4 py-2 text-center">
                                                        <span className="text-sm text-gray-500">Nhấp vào hình để xem kích thước đầy đủ</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors"
                                                onClick={() => {
                                                    setShowConsultantModal(false);
                                                    viewConsultantSchedule(currentConsultant.consultantId);
                                                }}
                                            >
                                                Xem lịch làm việc
                                            </button>
                                            <button
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                                                onClick={() => setShowConsultantModal(false)}
                                            >
                                                Đóng
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Modal */}
            {showAppointmentModal && currentAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Chi tiết cuộc hẹn</h3>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setShowAppointmentModal(false)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">ID cuộc hẹn</p>
                                        <p className="font-medium">{currentAppointment.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Ngày tạo</p>
                                        <p className="font-medium">{formatDate(currentAppointment.createAt)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Người dùng</p>
                                    <p className="font-medium">{currentAppointment.memberName}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Tư vấn viên</p>
                                    <p className="font-medium">{currentAppointment.consultantName}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Thời gian cuộc hẹn</p>
                                    <div>
                                        <p className="font-medium">{formatDateLong(currentAppointment.date)}</p>
                                        <p className="text-gray-700">{currentAppointment.startTime} - {currentAppointment.endTime}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Trạng thái</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentAppointment.status === "COMPLETED"
                                        ? "bg-green-100 text-green-800"
                                        : currentAppointment.status === "CANCELLED"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                    }`}>
                                        {currentAppointment.status === "COMPLETED"
                                            ? "Đã xác nhận"
                                            : currentAppointment.status === "CANCELLED"
                                                ? "Đã từ chối"
                                                : "Đang chờ"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                                    onClick={() => setShowAppointmentModal(false)}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Slot Modal */}
            {showSlotModal && currentSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Chi tiết lịch làm việc</h3>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setShowSlotModal(false)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">ID lịch</p>
                                        <p className="font-medium">{currentSlot.slotId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Ngày</p>
                                        <p className="font-medium">{formatDate(currentSlot.date)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Thời gian làm việc</p>
                                    <p className="font-medium">{currentSlot.start} - {currentSlot.end}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Trạng thái</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        currentSlot.status === "CÒN TRỐNG" 
                                            ? "bg-green-100 text-green-800" 
                                            : "bg-blue-100 text-blue-800"
                                    }`}>
                                        {currentSlot.status}
                                    </span>
                                </div>

                                {currentSlot.status === "ĐÃ ĐẶT" && currentSlot.memberName && (
                                    <div>
                                        <p className="text-sm text-gray-500">Người đặt</p>
                                        <p className="font-medium">{currentSlot.memberName}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                                    onClick={() => setShowSlotModal(false)}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Day Detail Modal */}
            {showDayDetailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-800">
                                Chi tiết lịch làm việc - {formatDateLong(selectedDate)}
                            </h3>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setShowDayDetailModal(false)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                                        <p className="text-sm text-blue-600 font-medium">Tổng số slot</p>
                                        <p className="text-2xl font-bold text-blue-700">{currentDaySlots.length}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4 text-center">
                                        <p className="text-sm text-green-600 font-medium">Còn trống</p>
                                        <p className="text-2xl font-bold text-green-700">
                                            {currentDaySlots.filter(s => s.status === "CÒN TRỐNG").length}
                                        </p>
                                    </div>
                                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                                        <p className="text-sm text-orange-600 font-medium">Đã đặt</p>
                                        <p className="text-2xl font-bold text-orange-700">
                                            {currentDaySlots.filter(s => s.status === "ĐÃ ĐẶT").length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ID Slot
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thời gian
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trạng thái
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Người đặt
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentDaySlots.map(slot => (
                                            <tr key={slot.slotId} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{slot.slotId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                    <span className="font-medium">{slot.start} - {slot.end}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        slot.status === "CÒN TRỐNG" 
                                                            ? "bg-green-100 text-green-800" 
                                                            : "bg-blue-100 text-blue-800"
                                                    }`}>
                                                        {slot.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                    {slot.memberName || "-"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <button
                                                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors text-xs"
                                                        onClick={() => {
                                                            setCurrentSlot(slot);
                                                            setShowSlotModal(true);
                                                        }}
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                                    onClick={() => setShowDayDetailModal(false)}
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

export default ConsultantManagement;