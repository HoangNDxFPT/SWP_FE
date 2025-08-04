import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";

// Modern Stat Card Component
// Modern Stat Card Component - bỏ trend
const StatCard = ({ title, value, icon, gradient, subtitle }) => (
  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
    <div className={`bg-gradient-to-r ${gradient} p-6`}>
      <div className="flex items-center justify-between">
        <div className="text-white">
          <div className="text-sm font-medium opacity-90 mb-1">{title}</div>
          <div className="text-3xl font-bold">
            {typeof value === 'number' && title.includes('Điểm') ? value.toFixed(2) : value}
          </div>
          {subtitle && <div className="text-xs opacity-75 mt-1">{subtitle}</div>}
        </div>
        <div className="text-white opacity-80">
          {icon}
        </div>
      </div>
    </div>
  </div>
);

// Quick Action Card
const QuickActionCard = ({ title, description, icon, bgColor, hoverColor, onClick }) => (
  <div 
    className={`${bgColor} ${hoverColor} p-6 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border border-gray-100`}
    onClick={onClick}
  >
    <div className="flex items-center space-x-4">
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="font-semibold text-gray-800 text-lg">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </div>
  </div>
);

// Info Card Component
const InfoCard = ({ title, icon, items, bgColor }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-full">
    <div className="flex items-center space-x-3 mb-6">
      <div className={`p-3 rounded-xl ${bgColor} bg-opacity-20`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-gray-600">{item.icon}</div>
            <span className="text-gray-700 font-medium">{item.label}</span>
          </div>
          <span className="text-2xl font-bold text-gray-800">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/dashboard/overview");
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <div className="mt-6 text-xl font-semibold text-gray-700">Đang tải dashboard...</div>
          <div className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-red-800 mb-3">Không thể tải dữ liệu</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-8 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Bo tròn cả 4 góc */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-12 rounded-3xl shadow-lg mx-6 mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold">Dashboard Quản Trị</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Tổng quan hoạt động hệ thống Phòng chống Sử dụng Ma Túy
              </p>
            </div>
            
            <div className="mt-6 lg:mt-0 text-right">
              <div className="text-blue-100 text-sm mb-1">Hôm nay</div>
              <div className="text-xl font-bold">{new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
              <div className="text-blue-200 text-sm mt-1">
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Statistics - bỏ trend props */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tổng Người Dùng"
            value={dashboardData?.totalUsers || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
            gradient="from-blue-500 to-blue-600"
            subtitle="Sinh viên & tư vấn viên"
          />
          <StatCard
            title="Khóa Học"
            value={dashboardData?.totalCourses || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            gradient="from-green-500 to-green-600"
            subtitle="Đang hoạt động"
          />
          <StatCard
            title="Lịch Hẹn"
            value={dashboardData?.totalAppointments || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            gradient="from-orange-500 to-orange-600"
            subtitle="Tư vấn trực tiếp"
          />
          <StatCard
            title="Hoàn Thành"
            value={dashboardData?.completedCourses || 0}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            gradient="from-purple-500 to-purple-600"
            subtitle="Khóa học đã hoàn thành"
          />
        </div>

        {/* Secondary Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <InfoCard
            title="Học Tập & Đánh Giá"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            bgColor="bg-blue-500"
            items={[
              {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                label: "Tổng Bài Học",
                value: dashboardData?.totalLessons || 0
              },
              {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                label: "Câu Hỏi Quiz",
                value: dashboardData?.totalQuizzes || 0
              },
              {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                label: "Điểm TB Quiz",
                value: dashboardData?.avgQuizScore ? dashboardData.avgQuizScore.toFixed(1) : '0.0'
              }
            ]}
          />

          <InfoCard
            title="Khảo Sát & Đánh Giá"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
            bgColor="bg-green-500"
            items={[
              {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                label: "Bài Đánh Giá",
                value: dashboardData?.totalAssessments || 0
              },
              {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                label: "Khảo Sát Gửi",
                value: dashboardData?.totalSurveySent || 0
              },
              {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
                label: "Tham Gia CT",
                value: dashboardData?.totalProgramParticipants || 0
              }
            ]}
          />

          <InfoCard
            title="Thống Kê Bài Nộp"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            bgColor="bg-purple-500"
            items={[
              {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                label: "Quiz Đã Nộp",
                value: dashboardData?.totalQuizSubmissions || 0
              },
              {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                label: "Điểm TB",
                value: dashboardData?.avgQuizScore ? dashboardData.avgQuizScore.toFixed(1) : '0.0'
              },
              {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                label: "Hoàn Thành",
                value: dashboardData?.completedCourses || 0
              }
            ]}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Thao Tác Nhanh</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <QuickActionCard
              title="Quản Lý Người Dùng"
              description="Xem và quản lý tài khoản"
              icon="👥"
              bgColor="bg-blue-50"
              hoverColor="hover:bg-blue-100"
              onClick={() => navigate('/admin/users')}
            />
            <QuickActionCard
              title="Quản Lý Khóa Học"
              description="Tạo và chỉnh sửa khóa học"
              icon="📚"
              bgColor="bg-green-50"
              hoverColor="hover:bg-green-100"
              onClick={() => navigate('/admin/courses')}
            />
            <QuickActionCard
              title="Quản Lý Tư Vấn Viên"
              description="Xem lịch tư vấn và consultant"
              icon="‍⚕️"
              bgColor="bg-orange-50"
              hoverColor="hover:bg-orange-100"
              onClick={() => navigate('/admin/schedule')}
            />
            <QuickActionCard
              title="Báo Cáo Bài Đánh Giá"
              description="Xem báo cáo thống kê đánh giá"
              icon="📊"
              bgColor="bg-purple-50"
              hoverColor="hover:bg-purple-100"
              onClick={() => navigate('/admin/assessment-result')}
            />
            <QuickActionCard
              title="Quản Lý Chương Trình"
              description="Quản lý chương trình học"
              icon="🎯"
              bgColor="bg-indigo-50"
              hoverColor="hover:bg-indigo-100"
              onClick={() => navigate('/admin/program')}
            />
            <QuickActionCard
              title="Quản Lý Báo Cáo & Lịch Hẹn"
              description="Xem cuộc hẹn và báo cáo"
              icon="📅"
              bgColor="bg-pink-50"
              hoverColor="hover:bg-pink-100"
              onClick={() => navigate('/admin/report-appointment')}
            />
            <QuickActionCard
              title="Quản Lý Đăng kí Khóa Học"
              description="Theo dõi đăng ký khóa học"
              icon="📝"
              bgColor="bg-teal-50"
              hoverColor="hover:bg-teal-100"
              onClick={() => navigate('/admin/course-enrollment')}
            />
            <QuickActionCard
              title="Hồ sơ của tôi"
              description="Cập nhật thông tin cá nhân"
              icon="⚙️"
              bgColor="bg-gray-50"
              hoverColor="hover:bg-gray-100"
              onClick={() => navigate('/admin/profile')}
            />
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Tổng Quan Hiệu Suất</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {dashboardData?.totalQuizSubmissions || 0}
              </div>
              <div className="text-gray-600 font-medium">Bài Quiz Nộp</div>
              <div className="mt-2 bg-blue-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {dashboardData?.avgQuizScore ? dashboardData.avgQuizScore.toFixed(1) : '0.0'}
              </div>
              <div className="text-gray-600 font-medium">Điểm Trung Bình</div>
              <div className="mt-2 bg-green-100 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: `${(dashboardData?.avgQuizScore || 0) * 10}%`}}></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {dashboardData?.completedCourses || 0}
              </div>
              <div className="text-gray-600 font-medium">Khóa Học Hoàn Thành</div>
              <div className="mt-2 bg-orange-100 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{width: '60%'}}></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {dashboardData?.totalProgramParticipants || 0}
              </div>
              <div className="text-gray-600 font-medium">Người Tham Gia</div>
              <div className="mt-2 bg-purple-100 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}