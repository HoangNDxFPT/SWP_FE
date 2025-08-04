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

            {/* Modern Consultant Modal */}
            {showConsultantModal && currentConsultant && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
                        {/* Header with gradient */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">
                                            {isEditing ? "Chỉnh sửa thông tin tư vấn viên" : "Hồ sơ tư vấn viên"}
                                        </h3>
                                        <p className="text-blue-100 text-sm">
                                            ID: {currentConsultant.consultantId} • {isEditing ? "Chế độ chỉnh sửa" : "Chế độ xem"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-2 transition-all"
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
                        </div>

                        {/* Content - Scrollable */}
                        <div className="p-8 overflow-y-auto max-h-[calc(95vh-180px)]">
                            {/* Profile Header */}
                            <div className="flex flex-col lg:flex-row gap-8 mb-8">
                                {/* Avatar Section */}
                                <div className="flex-shrink-0">
                                    <div className="relative">
                                        {(isEditing ? editingConsultant.avatarUrl : currentConsultant.avatarUrl) ? (
                                            <img
                                                src={isEditing ? editingConsultant.avatarUrl : currentConsultant.avatarUrl}
                                                alt="avatar"
                                                className="w-32 h-32 rounded-2xl object-cover border-4 border-gray-100 shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-gray-100 shadow-lg">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        )}
                                        {isEditing && (
                                            <div className="absolute inset-0 rounded-2xl bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    {isEditing && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Cập nhật ảnh đại diện</label>
                                            <input
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
                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Basic Info */}
                                <div className="flex-1">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                        <h4 className="text-2xl font-bold text-gray-900 mb-2">
                                            {isEditing ? editingConsultant.fullName : currentConsultant.fullName}
                                        </h4>
                                        <p className="text-blue-600 font-medium mb-4">
                                            {isEditing ? editingConsultant.degree : currentConsultant.degree}
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-700">{currentConsultant.phoneNumber || "Chưa cập nhật"}</span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-700 truncate">{currentConsultant.address || "Chưa cập nhật"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Information Tabs */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column - Personal Information */}
                                <div className="space-y-6">
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                        <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Thông tin cá nhân
                                        </h5>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Họ và tên</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        value={editingConsultant.fullName || ""}
                                                        onChange={(e) => handleEditChange("fullName", e.target.value)}
                                                        placeholder="Nhập họ và tên"
                                                    />
                                                ) : (
                                                    <p className="text-gray-800 bg-gray-50 rounded-lg px-4 py-3">{currentConsultant.fullName}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        value={editingConsultant.phoneNumber || ""}
                                                        onChange={(e) => handleEditChange("phoneNumber", e.target.value)}
                                                        placeholder="0123456789"
                                                    />
                                                ) : (
                                                    <p className="text-gray-800 bg-gray-50 rounded-lg px-4 py-3">{currentConsultant.phoneNumber || "Chưa cập nhật"}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Địa chỉ</label>
                                                {isEditing ? (
                                                    <textarea
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        rows="3"
                                                        value={editingConsultant.address || ""}
                                                        onChange={(e) => handleEditChange("address", e.target.value)}
                                                        placeholder="Nhập địa chỉ"
                                                    />
                                                ) : (
                                                    <p className="text-gray-800 bg-gray-50 rounded-lg px-4 py-3">{currentConsultant.address || "Chưa cập nhật"}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Google Meet Link</label>
                                                {isEditing ? (
                                                    <input
                                                        type="url"
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        value={editingConsultant.googleMeetLink || ""}
                                                        onChange={(e) => handleEditChange("googleMeetLink", e.target.value)}
                                                        placeholder="https://meet.google.com/..."
                                                    />
                                                ) : (
                                                    <div className="bg-gray-50 rounded-lg px-4 py-3">
                                                        {currentConsultant.googleMeetLink ? (
                                                            <a href={currentConsultant.googleMeetLink} target="_blank" rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 underline break-all">
                                                                {currentConsultant.googleMeetLink}
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-500">Chưa có link</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Information */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                        <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                            </svg>
                                            Thông tin chuyên môn
                                        </h5>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Bằng cấp</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        value={editingConsultant.degree || ""}
                                                        onChange={(e) => handleEditChange("degree", e.target.value)}
                                                        placeholder="Thạc sĩ Tâm lý học, Tiến sĩ..."
                                                    />
                                                ) : (
                                                    <p className="text-gray-800 bg-gray-50 rounded-lg px-4 py-3">{currentConsultant.degree || "Chưa cập nhật"}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Chứng chỉ</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        value={editingConsultant.certifiedDegree || ""}
                                                        onChange={(e) => handleEditChange("certifiedDegree", e.target.value)}
                                                        placeholder="Chứng chỉ hành nghề..."
                                                    />
                                                ) : (
                                                    <p className="text-gray-800 bg-gray-50 rounded-lg px-4 py-3">{currentConsultant.certifiedDegree || "Chưa cập nhật"}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Documents & Additional Info */}
                                <div className="space-y-6">
                                    {/* Certificate Image */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                        <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Hình ảnh chứng chỉ
                                        </h5>
                                        
                                        {isEditing ? (
                                            <div className="space-y-4">
                                                <input
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
                                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                                />
                                                {(editingConsultant.certifiedDegreeImage || currentConsultant.certifiedDegreeImage) && (
                                                    <img
                                                        src={editingConsultant.certifiedDegreeImage || currentConsultant.certifiedDegreeImage}
                                                        alt="Chứng chỉ"
                                                        className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
                                                        onError={e => {
                                                            e.target.onerror = null;
                                                            e.target.src = "https://placehold.co/400x300/f3f4f6/6b7280?text=No+Image";
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                {currentConsultant.certifiedDegreeImage ? (
                                                    <img
                                                        src={currentConsultant.certifiedDegreeImage}
                                                        alt="Chứng chỉ"
                                                        className="w-full h-64 object-cover rounded-xl border-2 border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                                                        onClick={() => window.open(currentConsultant.certifiedDegreeImage, '_blank')}
                                                    />
                                                ) : (
                                                    <div className="w-full h-64 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                                                        <div className="text-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <p className="text-gray-500">Chưa có ảnh chứng chỉ</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Additional Information */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                        <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Thông tin bổ sung
                                        </h5>
                                        
                                        {isEditing ? (
                                            <textarea
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                rows="6"
                                                value={editingConsultant.information || ""}
                                                onChange={(e) => handleEditChange("information", e.target.value)}
                                                placeholder="Kinh nghiệm làm việc, chuyên môn, thành tích..."
                                            />
                                        ) : (
                                            <div className="bg-gray-50 rounded-lg p-4 min-h-[150px]">
                                                {currentConsultant.information ? (
                                                    <p className="text-gray-800 whitespace-pre-line leading-relaxed">{currentConsultant.information}</p>
                                                ) : (
                                                    <p className="text-gray-500 italic">Chưa có thông tin bổ sung</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Fixed at bottom */}
                        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    Được tạo: {formatDate(currentConsultant.createdAt) || "Không xác định"}
                                </div>
                                <div className="flex gap-3">
                                    {isEditing ? (
                                        <>
                                            <button
                                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                                                onClick={handleSaveEdit}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Lưu thay đổi</span>
                                            </button>
                                            <button
                                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditingConsultant({ ...currentConsultant });
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span>Hủy</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                <span>Chỉnh sửa</span>
                                            </button>
                                            <button
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                                                onClick={() => {
                                                    setShowConsultantModal(false);
                                                    viewConsultantSchedule(currentConsultant.consultantId);
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>Xem lịch làm việc</span>
                                            </button>
                                            <button
                                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
                                                onClick={() => setShowConsultantModal(false)}
                                            >
                                                <span>Đóng</span>
                                            </button>
                                        </>
                                    )}
                                </div>
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