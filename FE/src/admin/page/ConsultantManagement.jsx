import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { uploadImageToCloudinary } from "../../services/uploadCloudinary";

function ConsultantManagement() {
    // States
    const [activeTab, setActiveTab] = useState("consultants");
    const [consultants, setConsultants] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [selectedConsultant, setSelectedConsultant] = useState("");
    const [slotDateFilter, setSlotDateFilter] = useState("");

    // Modal states
    const [showConsultantModal, setShowConsultantModal] = useState(false);
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [currentConsultant, setCurrentConsultant] = useState({
        fullName: "",
        degree: "",
        information: "",
        address: "",
        certifiedDegreeImage: ""
    });
    const [currentSlot, setCurrentSlot] = useState(null);

    // Add new states
    const [consultantDays, setConsultantDays] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [showDayDetailModal, setShowDayDetailModal] = useState(false);
    const [currentDaySlots, setCurrentDaySlots] = useState([]);
    const [users, setUsers] = useState([]);
    const [slotBookingInfo, setSlotBookingInfo] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingConsultant, setEditingConsultant] = useState({});

    // Stats
    const [stats, setStats] = useState({
        totalConsultants: 0,
        activeConsultants: 0,
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0
    });

    // Fetch data when tab changes
    useEffect(() => {
        fetchConsultants();
        fetchUsers();
        if (activeTab === "slots") {
            fetchConsultantDays();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Apply filters when filter values change
    useEffect(() => {
        if (activeTab === "slots") {
            fetchConsultantDays();
        } else if (activeTab === "consultants") {
            fetchConsultants();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConsultant, slotDateFilter]);

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
                activeConsultants: consultantData.length // All consultants are considered active since no status field
            };
            setStats(prev => ({ ...prev, ...consultantStats }));
        } catch (err) {
            toast.error("Không thể tải danh sách tư vấn viên");
            console.error("Failed to load consultants:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get("/profile/all");
            setUsers(res.data || []);
        } catch (err) {
            console.error("Failed to load users:", err);
        }
    };

    const fetchSlotBookingInfo = async (slotId) => {
        try {
            const res = await api.get(`/appointment/appointments/admin`);
            const appointments = res.data || [];
            const slotAppointment = appointments.find(apt => apt.slotId === slotId);
            setSlotBookingInfo(slotAppointment || null);
        } catch (err) {
            console.error("Failed to load slot booking info:", err);
            setSlotBookingInfo(null);
        }
    };

    const updateConsultant = async (consultantData) => {
        try {
            console.log("Updating consultant with data:", consultantData);

            // Prepare payload according to new API schema
            const payload = {
                consultantId: consultantData.consultantId || consultantData.id,
                fullName: consultantData.fullName || consultantData.name,
                phoneNumber: consultantData.phoneNumber || consultantData.phone,
                address: consultantData.address || "",
                degree: consultantData.degree || "",
                information: consultantData.information || consultantData.description || "",
                certifiedDegree: consultantData.certifiedDegree || "",
                certifiedDegreeImage: consultantData.certifiedDegreeImage || "",
                googleMeetLink: consultantData.googleMeetLink || "",
                avatarUrl: consultantData.avatarUrl || ""
            };

            console.log("API payload:", payload);

            // Use new API endpoint with consultantId
            const consultantId = payload.consultantId;
            await api.put(`/consultant/admin/profile/${consultantId}`, payload);

            toast.success("Cập nhật thông tin tư vấn viên thành công");
            fetchConsultants();
            setIsEditing(false);
            setShowConsultantModal(false);
        } catch (err) {
            toast.error("Không thể cập nhật thông tin tư vấn viên");
            console.error("Failed to update consultant:", err);
            console.error("Error response:", err.response?.data);
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
        setSelectedConsultant("");
        setSlotDateFilter("");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
        } catch {
            return dateString;
        }
    };

    const handleTabChange = (key) => {
        setActiveTab(key);
        resetFilters();
    };

    const viewConsultantDetails = (consultant) => {
        setCurrentConsultant(consultant);
        setEditingConsultant({ ...consultant });
        setIsEditing(false);
        setShowConsultantModal(true);
    };

    const handleEditChange = (field, value) => {
        setEditingConsultant(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveEdit = () => {
        updateConsultant(editingConsultant);
    };

    const viewSlotDetails = async (slot) => {
        setCurrentSlot(slot);
        if (slot.status === "ĐÃ ĐẶT") {
            await fetchSlotBookingInfo(slot.slotId);
        } else {
            setSlotBookingInfo(null);
        }
        setShowSlotModal(true);
    };

    const viewConsultantSchedule = (consultantId) => {
        setActiveTab("slots");
        setSelectedConsultant(consultantId.toString());
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
                        <h1 className="text-2xl font-bold">Quản lý tư vấn viên & lịch làm việc</h1>
                        <p className="text-blue-100 mt-1">Theo dõi hoạt động của tư vấn viên và quản lý lịch làm việc</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-100">Tổng tư vấn viên</p>
                        <p className="text-2xl font-bold">{stats.totalConsultants}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-100">Đang hoạt động</p>
                        <p className="text-2xl font-bold">{stats.activeConsultants}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-100">Tổng slot</p>
                        <p className="text-2xl font-bold">{stats.totalSlots}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-100">Slot trống</p>
                        <p className="text-2xl font-bold">{stats.availableSlots}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-100">Đã đặt</p>
                        <p className="text-2xl font-bold">{stats.bookedSlots}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
                <div className="border-b">
                    <nav className="-mb-px flex space-x-8 px-6">
                        <button
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "consultants"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            onClick={() => handleTabChange("consultants")}
                        >
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                Tư vấn viên
                            </div>
                        </button>
                        <button
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "slots"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            onClick={() => handleTabChange("slots")}
                        >
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                Lịch làm việc
                            </div>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                    Bộ lọc
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                    {activeTab === "slots" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày làm việc</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={slotDateFilter}
                                onChange={(e) => setSlotDateFilter(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {(selectedConsultant || slotDateFilter) && (
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
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ảnh đại diện
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Họ tên
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bằng cấp
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Địa chỉ
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : consultants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <h3 className="text-xl font-semibold text-gray-500 mb-1">Không tìm thấy tư vấn viên</h3>
                                            <p className="text-gray-400">
                                                {selectedConsultant ?
                                                    "Thử thay đổi bộ lọc để xem kết quả khác" :
                                                    "Chưa có tư vấn viên nào được đăng ký"}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    consultants.map(consultant => (
                                        <tr key={consultant.consultantId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {consultant.consultantId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {consultant.avatarUrl ? (
                                                    <img
                                                        src={consultant.avatarUrl}
                                                        alt="avatar"
                                                        className="w-10 h-10 rounded-full object-cover border"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {consultant.fullName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {consultant.degree}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-800">
                                                <div className="max-w-xs truncate">
                                                    {consultant.address}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors"
                                                        onClick={() => viewConsultantDetails(consultant)}
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                    <button
                                                        className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-md transition-colors"
                                                        onClick={() => viewConsultantSchedule(consultant.consultantId)}
                                                    >
                                                        Xem lịch
                                                    </button>
                                                </div>
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
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tổng slot
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
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : !selectedConsultant ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <h3 className="text-xl font-semibold text-gray-500 mb-1">Chọn tư vấn viên</h3>
                                            <p className="text-gray-400">Vui lòng chọn tư vấn viên để xem lịch làm việc</p>
                                        </td>
                                    </tr>
                                ) : consultantDays.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <h3 className="text-xl font-semibold text-gray-500 mb-1">Không có lịch làm việc</h3>
                                            <p className="text-gray-400">Tư vấn viên này chưa có lịch làm việc</p>
                                        </td>
                                    </tr>
                                ) : (
                                    consultantDays.map((day, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatDate(day.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {day.totalSlots}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                {day.availableSlots}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                                {day.bookedSlots}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <button
                                                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors"
                                                    onClick={() => viewDayDetails(day)}
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
            )}

            {/* Consultant Modal */}
            {showConsultantModal && currentConsultant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">
                                {isEditing ? "Chỉnh sửa thông tin tư vấn viên" : "Chi tiết tư vấn viên"}
                            </h3>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => {
                                    setShowConsultantModal(false);
                                    setIsEditing(false);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    {/* Avatar tư vấn viên */}
                                    <div className="flex items-center mb-6">
                                        {(isEditing ? editingConsultant.avatarUrl : currentConsultant.avatarUrl) ? (
                                            <img
                                                src={isEditing ? editingConsultant.avatarUrl : currentConsultant.avatarUrl}
                                                alt="avatar"
                                                className="w-20 h-20 rounded-full object-cover border mr-4"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mr-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900">
                                                {isEditing ? editingConsultant.fullName : currentConsultant.fullName}
                                            </h4>
                                            <p className="text-gray-500 text-sm">
                                                {isEditing ? editingConsultant.degree : currentConsultant.degree}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Input chỉnh sửa avatarUrl */}
                                    {isEditing && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">Ảnh đại diện</h4>
                                            <input
                                                id="avatarUrl"
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    try {
                                                        toast.info("Đang upload ảnh đại diện...");
                                                        const url = await uploadImageToCloudinary(file);
                                                        handleEditChange("avatarUrl", url);
                                                        toast.success("Upload thành công!");
                                                    } catch {
                                                        toast.error("Upload ảnh thất bại!");
                                                    }
                                                }}
                                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">Họ tên</h4>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={editingConsultant.fullName || ""}
                                                onChange={(e) => handleEditChange("fullName", e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-lg font-semibold text-gray-900">{currentConsultant.fullName}</p>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">Số điện thoại</h4>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={editingConsultant.phoneNumber || ""}
                                                onChange={(e) => handleEditChange("phoneNumber", e.target.value)}
                                                placeholder="0123456789"
                                            />
                                        ) : (
                                            <p className="text-gray-800">{currentConsultant.phoneNumber}</p>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">Bằng cấp</h4>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={editingConsultant.degree || ""}
                                                onChange={(e) => handleEditChange("degree", e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-gray-800">{currentConsultant.degree}</p>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">Chứng chỉ</h4>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={editingConsultant.certifiedDegree || ""}
                                                onChange={(e) => handleEditChange("certifiedDegree", e.target.value)}
                                                placeholder="Tên chứng chỉ"
                                            />
                                        ) : (
                                            <p className="text-gray-800">{currentConsultant.certifiedDegree}</p>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">Địa chỉ</h4>
                                        {isEditing ? (
                                            <textarea
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                rows="2"
                                                value={editingConsultant.address || ""}
                                                onChange={(e) => handleEditChange("address", e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-gray-800">{currentConsultant.address}</p>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">Google Meet Link</h4>
                                        {isEditing ? (
                                            <input
                                                type="url"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                value={editingConsultant.googleMeetLink || ""}
                                                onChange={(e) => handleEditChange("googleMeetLink", e.target.value)}
                                                placeholder="https://meet.google.com/..."
                                            />
                                        ) : (
                                            <p className="text-gray-800">
                                                {currentConsultant.googleMeetLink ? (
                                                    <a href={currentConsultant.googleMeetLink} target="_blank" rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 underline">
                                                        {currentConsultant.googleMeetLink}
                                                    </a>
                                                ) : (
                                                    "Chưa có link"
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-500 mb-1">ID Tư vấn viên</h4>
                                        <p className="text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded">{currentConsultant.consultantId}</p>
                                    </div>
                                </div>

                                <div>
                                    {currentConsultant.certifiedDegreeImage && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Ảnh bằng cấp</h4>
                                            <img
                                                src={currentConsultant.certifiedDegreeImage}
                                                alt="Bằng cấp"
                                                className="w-full h-48 object-cover rounded-lg border"
                                            />
                                        </div>
                                    )}

                                    {isEditing && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">Ảnh bằng cấp (chứng chỉ)</h4>
                                            <input
                                                id="certifiedDegreeImage"
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    try {
                                                        toast.info("Đang upload ảnh chứng chỉ...");
                                                        const url = await uploadImageToCloudinary(file);
                                                        handleEditChange("certifiedDegreeImage", url);
                                                        toast.success("Upload thành công!");
                                                    } catch {
                                                        toast.error("Upload ảnh chứng chỉ thất bại!");
                                                    }
                                                }}
                                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                            {editingConsultant.certifiedDegreeImage && (
                                                <img
                                                    src={editingConsultant.certifiedDegreeImage}
                                                    alt="Ảnh chứng chỉ"
                                                    className="mt-2 rounded-lg w-full h-48 object-cover border shadow"
                                                    onError={e => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://placehold.co/320x180/ADD8E6/000000?text=No+Image";
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {currentConsultant.information && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Thông tin thêm</h4>
                                    {isEditing ? (
                                        <textarea
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows="4"
                                            value={editingConsultant.information || ""}
                                            onChange={(e) => handleEditChange("information", e.target.value)}
                                        />
                                    ) : (
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <p className="text-gray-800 whitespace-pre-line">{currentConsultant.information}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                {isEditing ? (
                                    <>
                                        <button
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                                            onClick={handleSaveEdit}
                                        >
                                            Lưu thay đổi
                                        </button>
                                        <button
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditingConsultant({ ...currentConsultant });
                                            }}
                                        >
                                            Hủy
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Chỉnh sửa
                                        </button>
                                        <button
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Day Detail Modal */}
            {showDayDetailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">
                                Chi tiết lịch làm việc - {formatDate(selectedDate)}
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
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thời gian
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trạng thái
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentDaySlots.map((slot, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {slot.start} - {slot.end}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${slot.status === "CÒN TRỐNG"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}>
                                                        {slot.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <button
                                                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors"
                                                        onClick={() => viewSlotDetails(slot)}
                                                    >
                                                        Chi tiết
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

            {/* Slot Modal */}
            {showSlotModal && currentSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Chi tiết slot</h3>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Ngày</p>
                                        <p className="font-medium">{formatDate(currentSlot.date)}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">Thời gian</p>
                                        <p className="font-medium">{currentSlot.startTime} - {currentSlot.endTime}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">Trạng thái</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentSlot.status === "CÒN TRỐNG"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                            }`}>
                                            {currentSlot.status}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">ID Slot</p>
                                        <p className="font-medium">{currentSlot.slotId}</p>
                                    </div>
                                </div>

                                {/* Booking Information */}
                                {currentSlot.status === "ĐÃ ĐẶT" && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Thông tin đặt lịch</h4>

                                        {slotBookingInfo ? (
                                            <>
                                                <div>
                                                    <p className="text-sm text-gray-500">ID Cuộc hẹn</p>
                                                    <p className="font-medium">{slotBookingInfo.appointmentId}</p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-500">Người đặt</p>
                                                    <p className="font-medium">
                                                        {users.find(user => user.userId === slotBookingInfo.userId)?.fullName ||
                                                            `User ID: ${slotBookingInfo.userId}`}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-500">Email người đặt</p>
                                                    <p className="font-medium">
                                                        {users.find(user => user.userId === slotBookingInfo.userId)?.email ||
                                                            "Không có thông tin"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm text-gray-500">Số điện thoại</p>
                                                    <p className="font-medium">
                                                        {users.find(user => user.userId === slotBookingInfo.userId)?.phone ||
                                                            "Không có thông tin"}
                                                    </p>
                                                </div>

                                                {slotBookingInfo.reason && (
                                                    <div>
                                                        <p className="text-sm text-gray-500">Lý do đặt lịch</p>
                                                        <div className="bg-gray-50 rounded-lg p-3 mt-1">
                                                            <p className="text-gray-800">{slotBookingInfo.reason}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div>
                                                    <p className="text-sm text-gray-500">Trạng thái cuộc hẹn</p>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${slotBookingInfo.status === "CONFIRMED"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : slotBookingInfo.status === "COMPLETED"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                        }`}>
                                                        {slotBookingInfo.status === "CONFIRMED" ? "Đã xác nhận" :
                                                            slotBookingInfo.status === "COMPLETED" ? "Hoàn thành" :
                                                                slotBookingInfo.status}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                                                <span className="ml-2 text-gray-600">Đang tải thông tin...</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end mt-6">
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
        </div>
    );
}

export default ConsultantManagement;