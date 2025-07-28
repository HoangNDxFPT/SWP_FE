import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

function ReportAppointment() {
    // States
    const [activeTab, setActiveTab] = useState("reports");
    const [reports, setReports] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState([]);
    const [consultants, setConsultants] = useState([]);

    // Filter states
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedMember, setSelectedMember] = useState("");
    const [selectedConsultant, setSelectedConsultant] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    // Modal states
    const [showReportModal, setShowReportModal] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);
    const [currentAppointment, setCurrentAppointment] = useState(null);

    // Stats
    const [stats, setStats] = useState({
        totalReports: 0,
        pendingReports: 0,
        resolvedReports: 0,
        rejectedReports: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        pendingAppointments: 0,
        cancelledAppointments: 0
    });

    // Pagination states
    const [reportPage, setReportPage] = useState(1);
    const [appointmentPage, setAppointmentPage] = useState(1);
    const pageSize = 10;

    // Fetch data when tab changes
    useEffect(() => {
        fetchMembers();
        fetchConsultants();
        if (activeTab === "reports") {
            fetchReports();
        } else if (activeTab === "appointments") {
            fetchAppointments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Apply filters when filter values change
    useEffect(() => {
        if (activeTab === "reports") {
            fetchReports();
        } else if (activeTab === "appointments") {
            fetchAppointments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStatus, selectedMember, selectedConsultant, dateFilter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get("/report/admin/reports");
            let reportData = res.data || [];

            // Apply filters
            if (selectedStatus) {
                reportData = reportData.filter(report => 
                    report.status === selectedStatus || 
                    (selectedStatus === "UNPROCESSED" && !report.status)
                );
            }
            if (selectedMember) {
                reportData = reportData.filter(report => 
                    report.memberName.toLowerCase().includes(selectedMember.toLowerCase())
                );
            }
            if (dateFilter) {
                reportData = reportData.filter(report => 
                    formatDate(report.createdAt) === formatDate(dateFilter)
                );
            }

            setReports(reportData);
            
            // Calculate stats
            setStats(prev => ({
                ...prev,
                totalReports: reportData.length,
                pendingReports: reportData.filter(r => r.status === "PENDING" || !r.status).length,
                resolvedReports: reportData.filter(r => r.status === "RESOLVED").length,
                rejectedReports: reportData.filter(r => r.status === "REJECTED").length
            }));
        } catch (err) {
            console.error("Failed to fetch reports:", err);
            toast.error("Không thể tải danh sách báo cáo");
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
            if (selectedStatus) {
                params.status = selectedStatus;
            }

            const res = await api.get("/appointment/appointments/admin", { params });
            setAppointments(res.data || []);

            // Calculate appointment stats
            const appointmentStats = {
                totalAppointments: res.data?.length || 0,
                pendingAppointments: res.data?.filter(a => a.status === "PENDING").length || 0,
                completedAppointments: res.data?.filter(a => a.status === "COMPLETED").length || 0,
                cancelledAppointments: res.data?.filter(a => a.status === "CANCELLED").length || 0
            };
            setStats(prev => ({ ...prev, ...appointmentStats }));
        } catch (err) {
            toast.error("Không thể tải danh sách cuộc hẹn");
            console.error("Failed to load appointments:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchConsultants = async () => {
        try {
            const res = await api.get("/consultant/all");
            setConsultants(res.data || []);
        } catch (err) {
            console.error("Failed to fetch consultants:", err);
        }
    };

    const resetFilters = () => {
        setSelectedStatus("");
        setSelectedMember("");
        setSelectedConsultant("");
        setDateFilter("");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
        } catch {
            return dateString;
        }
    };

    const formatDateLong = (dateString) => {
        if (!dateString) return "";
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
        } catch {
            return dateString;
        }
    };

    const handleTabChange = (key) => {
        setActiveTab(key);
        resetFilters();
    };

    const viewReportDetails = (report) => {
        setCurrentReport(report);
        setShowReportModal(true);
    };

    const viewAppointmentDetails = (appointment) => {
        setCurrentAppointment(appointment);
        setShowAppointmentModal(true);
    };

    const updateReportStatus = async (reportId, status, adminNote) => {
        try {
            const res = await api.put(`/report/admin/reports/${reportId}`, {
                status: status,
                adminNote: adminNote
            });
            
            toast.success("Cập nhật báo cáo thành công");
            setCurrentReport(res.data);
            fetchReports(); // Refresh list
        } catch (err) {
            toast.error("Không thể cập nhật báo cáo");
            console.error("Failed to update report:", err);
        }
    };

    const viewAppointmentReport = async (appointmentId) => {
        try {
            const res = await api.get(`/report/admin/reports`);
            const appointmentReport = res.data?.find(report => report.appointmentId === appointmentId);
            if (appointmentReport) {
                viewReportDetails(appointmentReport);
            } else {
                toast.info("Cuộc hẹn này chưa có báo cáo");
            }
        } catch (err) {
            console.error("Failed to fetch report:", err);
            toast.error("Không thể tải báo cáo");
        }
    };

    // Pagination logic
    const paginatedReports = reports.slice((reportPage - 1) * pageSize, reportPage * pageSize);
    const paginatedAppointments = appointments.slice((appointmentPage - 1) * pageSize, appointmentPage * pageSize);

    return (
        <div className="bg-gray-50 p-6 min-h-screen">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-xl shadow-md mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Quản lý báo cáo & cuộc hẹn</h1>
                        <p className="text-purple-100 mt-1">Theo dõi báo cáo từ người dùng và quản lý cuộc hẹn</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {activeTab === "reports" ? (
                        <>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-purple-100">Tổng số báo cáo</p>
                                <p className="text-2xl font-bold">{stats.totalReports}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-purple-100">Chờ xử lý</p>
                                <p className="text-2xl font-bold">{stats.pendingReports}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-purple-100">Đã giải quyết</p>
                                <p className="text-2xl font-bold">{stats.resolvedReports}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-purple-100">Đã từ chối</p>
                                <p className="text-2xl font-bold">{stats.rejectedReports}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-purple-100">Tổng số cuộc hẹn</p>
                                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-purple-100">Đã hoàn thành</p>
                                <p className="text-2xl font-bold">{stats.completedAppointments}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-purple-100">Đang chờ</p>
                                <p className="text-2xl font-bold">{stats.pendingAppointments}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <p className="text-sm font-medium text-purple-100">Đã hủy</p>
                                <p className="text-2xl font-bold">{stats.cancelledAppointments}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
                <div className="border-b">
                    <nav className="-mb-px flex space-x-8 px-6">
                        <button
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "reports"
                                    ? "border-purple-500 text-purple-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                            onClick={() => handleTabChange("reports")}
                        >
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                Báo cáo
                            </div>
                        </button>
                        <button
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "appointments"
                                    ? "border-purple-500 text-purple-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                            onClick={() => handleTabChange("appointments")}
                        >
                            <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                Cuộc hẹn
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            {activeTab === "reports" ? (
                                <>
                                    <option value="PENDING">Đang xử lý</option>
                                    <option value="RESOLVED">Đã giải quyết</option>
                                    <option value="REJECTED">Đã từ chối</option>
                                </>
                            ) : (
                                <>
                                    <option value="PENDING">Đang chờ</option>
                                    <option value="COMPLETED">Đã hoàn thành</option>
                                    <option value="CANCELLED">Đã hủy</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Người dùng</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={selectedMember}
                            onChange={(e) => setSelectedMember(e.target.value)}
                        >
                            <option value="">Tất cả người dùng</option>
                            {members.map(member => (
                                <option key={member.userId} value={member.userId}>
                                    {member.fullName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {activeTab === "appointments" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tư vấn viên</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {activeTab === "reports" ? "Ngày tạo báo cáo" : "Ngày hẹn"}
                        </label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                </div>

                {(selectedStatus || selectedMember || selectedConsultant || dateFilter) && (
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
            {activeTab === "reports" ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người báo cáo
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lý do
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cuộc hẹn
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày tạo
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
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : reports.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className="text-xl font-semibold text-gray-500 mb-1">Không tìm thấy báo cáo</h3>
                                            <p className="text-gray-400">
                                                {selectedStatus || selectedMember || dateFilter ?
                                                    "Thử thay đổi bộ lọc để xem kết quả khác" :
                                                    "Chưa có báo cáo nào được tạo"}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedReports.map(report => (
                                        <tr key={report.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {report.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {report.memberName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-800">
                                                <div className="max-w-xs truncate">
                                                    {report.reason}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                #{report.appointmentId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                {formatDateLong(report.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    report.status === "RESOLVED"
                                                        ? "bg-green-100 text-green-800"
                                                        : report.status === "REJECTED"
                                                            ? "bg-red-100 text-red-800"
                                                            : report.status === "PENDING"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-gray-100 text-gray-800"
                                                }`}>
                                                    {report.status === "RESOLVED"
                                                        ? "Đã giải quyết"
                                                        : report.status === "REJECTED"
                                                            ? "Đã từ chối"
                                                            : report.status === "PENDING"
                                                                ? "Đang xử lý"
                                                                : "Chưa xử lý"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <button
                                                    className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-md transition-colors"
                                                    onClick={() => viewReportDetails(report)}
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

                    {/* Pagination for reports */}
                    {Math.ceil(reports.length / pageSize) > 1 && (
                      <div className="flex justify-center items-center gap-2 py-4">
                        <button
                          className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
                          disabled={reportPage === 1}
                          onClick={() => setReportPage(reportPage - 1)}
                        >
                          Trước
                        </button>
                        {[...Array(Math.ceil(reports.length / pageSize))].map((_, idx) => (
                          <button
                            key={idx}
                            className={`px-3 py-1 rounded border ${reportPage === idx + 1 ? "bg-purple-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                            onClick={() => setReportPage(idx + 1)}
                          >
                            {idx + 1}
                          </button>
                        ))}
                        <button
                          className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
                          disabled={reportPage === Math.ceil(reports.length / pageSize)}
                          onClick={() => setReportPage(reportPage + 1)}
                        >
                          Sau
                        </button>
                      </div>
                    )}
                </div>
            ) : (
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
                                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
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
                                                {selectedStatus || selectedMember || selectedConsultant || dateFilter ?
                                                    "Thử thay đổi bộ lọc để xem kết quả khác" :
                                                    "Chưa có cuộc hẹn nào được đặt"}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAppointments.map(appointment => (
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
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    appointment.status === "COMPLETED"
                                                        ? "bg-green-100 text-green-800"
                                                        : appointment.status === "CANCELLED"
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                    {appointment.status === "COMPLETED"
                                                        ? "Đã hoàn thành"
                                                        : appointment.status === "CANCELLED"
                                                            ? "Đã hủy"
                                                            : "Đang chờ"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-md transition-colors"
                                                        onClick={() => viewAppointmentDetails(appointment)}
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                    {appointment.status === "COMPLETED" && (
                                                        <button
                                                            className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-md transition-colors flex items-center"
                                                            onClick={() => viewAppointmentReport(appointment.id)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            Báo cáo
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination for appointments */}
                    {Math.ceil(appointments.length / pageSize) > 1 && (
                      <div className="flex justify-center items-center gap-2 py-4">
                        <button
                          className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
                          disabled={appointmentPage === 1}
                          onClick={() => setAppointmentPage(appointmentPage - 1)}
                        >
                          Trước
                        </button>
                        {[...Array(Math.ceil(appointments.length / pageSize))].map((_, idx) => (
                          <button
                            key={idx}
                            className={`px-3 py-1 rounded border ${appointmentPage === idx + 1 ? "bg-purple-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                            onClick={() => setAppointmentPage(idx + 1)}
                          >
                            {idx + 1}
                          </button>
                        ))}
                        <button
                          className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
                          disabled={appointmentPage === Math.ceil(appointments.length / pageSize)}
                          onClick={() => setAppointmentPage(appointmentPage + 1)}
                        >
                          Sau
                        </button>
                      </div>
                    )}
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && currentReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-800">Chi tiết báo cáo</h3>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => setShowReportModal(false)}
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
                                        <p className="text-sm text-gray-500">ID báo cáo</p>
                                        <p className="font-medium">{currentReport.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">ID cuộc hẹn</p>
                                        <p className="font-medium">{currentReport.appointmentId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Người báo cáo</p>
                                        <p className="font-medium">{currentReport.memberName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Ngày tạo</p>
                                        <p className="font-medium">{formatDateLong(currentReport.createdAt)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Lý do báo cáo</p>
                                    <div className="bg-blue-50 rounded-lg p-3">
                                        <p className="text-gray-800">{currentReport.reason}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Mô tả chi tiết</p>
                                    <div className="bg-blue-50 rounded-lg p-3">
                                        <p className="text-gray-800 whitespace-pre-line">{currentReport.description}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Trạng thái</p>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        currentReport.status === "RESOLVED"
                                            ? "bg-green-100 text-green-800"
                                            : currentReport.status === "REJECTED"
                                                ? "bg-red-100 text-red-800"
                                                : currentReport.status === "PENDING"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-gray-100 text-gray-800"
                                    }`}>
                                        {currentReport.status === "RESOLVED"
                                            ? "Đã giải quyết"
                                            : currentReport.status === "REJECTED"
                                                ? "Đã từ chối"
                                                : currentReport.status === "PENDING"
                                                    ? "Đang xử lý"
                                                    : "Chưa xử lý"}
                                    </span>
                                </div>

                                {currentReport.adminNote && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">Ghi chú của admin</p>
                                        <div className="bg-amber-50 rounded-lg p-3 border-l-4 border-amber-400">
                                            <p className="text-gray-800">{currentReport.adminNote}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Admin Action Section */}
                            {(!currentReport.status || currentReport.status === "PENDING") && (
                                <div className="border-t pt-6">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Hành động admin</h4>
                                    
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.target);
                                        const status = formData.get('status');
                                        const adminNote = formData.get('adminNote');
                                        updateReportStatus(currentReport.id, status, adminNote);
                                    }}>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Trạng thái xử lý
                                                </label>
                                                <select
                                                    name="status"
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    required
                                                >
                                                    <option value="">Chọn trạng thái</option>
                                                    <option value="RESOLVED">Đã giải quyết</option>
                                                    <option value="REJECTED">Từ chối</option>
                                                    <option value="PENDING">Đang xử lý</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Ghi chú admin
                                                </label>
                                                <textarea
                                                    name="adminNote"
                                                    rows={3}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    placeholder="Nhập ghi chú về việc xử lý báo cáo..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-4">
                                            <button
                                                type="button"
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                                                onClick={() => setShowReportModal(false)}
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                                            >
                                                Cập nhật báo cáo
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {currentReport.status && currentReport.status !== "PENDING" && (
                                <div className="flex justify-end mt-6">
                                    <button
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                                        onClick={() => setShowReportModal(false)}
                                    >
                                        Đóng
                                    </button>
                                </div>
                            )}
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
                                        <p className="font-medium">{formatDate(currentAppointment.date)}</p>
                                        <p className="text-gray-700">{currentAppointment.startTime} - {currentAppointment.endTime}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Trạng thái</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        currentAppointment.status === "COMPLETED"
                                            ? "bg-green-100 text-green-800"
                                            : currentAppointment.status === "CANCELLED"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"
                                    }`}>
                                        {currentAppointment.status === "COMPLETED"
                                            ? "Đã hoàn thành"
                                            : currentAppointment.status === "CANCELLED"
                                                ? "Đã hủy"
                                                : "Đang chờ"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                {currentAppointment.status === "COMPLETED" && (
                                    <button
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg transition-colors"
                                        onClick={() => {
                                            setShowAppointmentModal(false);
                                            viewAppointmentReport(currentAppointment.id);
                                        }}
                                    >
                                        Xem báo cáo
                                    </button>
                                )}
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
        </div>
    );
}

export default ReportAppointment;
