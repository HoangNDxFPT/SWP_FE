import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { 
  UserOutlined, 
  BookOutlined, 
  FileTextOutlined, 
  QuestionCircleOutlined,
  CheckCircleOutlined, 
  ScheduleOutlined, 
  FormOutlined,
  SendOutlined,
  TeamOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  ArrowUpOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { Progress, Tooltip, Badge } from 'antd';



// Component for statistic card with improved design
const StatCard = ({ title, value, icon, color, percentage, subtitle }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${color} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden relative group`}>
    <div className="flex items-center justify-between">
      <div className="z-10">
        <div className="text-gray-500 text-sm font-medium flex items-center">
          {title}
          {percentage && (
            <span className="ml-2 flex items-center text-green-500 text-xs font-bold">
              <ArrowUpOutlined style={{ fontSize: '10px' }} />
              {percentage}%
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-800 mt-2">
          {typeof value === 'number' && title.includes('Điểm') ? value.toFixed(2) : value}
        </div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </div>
      
      <div className={`p-4 rounded-full ${color.replace('border', 'bg')} bg-opacity-20 relative group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </div>
    
    {/* Decoration element */}
    <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full ${color.replace('border', 'bg')} bg-opacity-5 transition-transform duration-300 group-hover:scale-150`}></div>
  </div>
);

// Mini stat component for top row
const MiniStat = ({ icon, value, label, colorClass }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between border border-gray-100">
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      {icon}
    </div>
  </div>
);

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Define async function
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
    
    // Call the async function
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <span className="mt-4 text-lg text-gray-700">Đang tải dữ liệu dashboard...</span>
          <span className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-xl text-center shadow-lg">
        <div className="flex flex-col items-center">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-red-800">Lỗi tải dữ liệu</h3>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header with gradient background */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 shadow-md text-white">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <div className="flex items-center">
              <DashboardOutlined className="text-2xl mr-2" />
              <h1 className="text-3xl font-bold">Dashboard Quản Trị</h1>
            </div>
            <p className="mt-2 opacity-90">
              Tổng quan về hoạt động của hệ thống Tư Vấn Tâm Lý
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-1 bg-white bg-opacity-20 rounded-lg px-4 py-2">
            <div className="text-xs">Ngày hôm nay:</div>
            <div className="font-medium">{new Date().toLocaleDateString('vi-VN')}</div>
          </div>
        </div>

        {/* Mini stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <MiniStat 
            icon={<UserOutlined style={{ fontSize: '20px', color: 'white' }} />} 
            value={dashboardData?.totalUsers || 0}
            label="Người dùng"
            colorClass="bg-blue-500/40"
          />
          <MiniStat 
            icon={<BookOutlined style={{ fontSize: '20px', color: 'white' }} />} 
            value={dashboardData?.totalCourses || 0}
            label="Khóa học"
            colorClass="bg-indigo-500/40"
          />
          <MiniStat 
            icon={<ScheduleOutlined style={{ fontSize: '20px', color: 'white' }} />} 
            value={dashboardData?.totalAppointments || 0}
            label="Lịch hẹn"
            colorClass="bg-purple-500/40"
          />
          <MiniStat 
            icon={<CheckCircleOutlined style={{ fontSize: '20px', color: 'white' }} />} 
            value={dashboardData?.completedCourses || 0}
            label="Hoàn thành"
            colorClass="bg-indigo-500/40"
          />
        </div>
      </div>

      {/* Main Statistics */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Thống Kê Chính</h2>
          <div className="text-sm text-blue-600 cursor-pointer hover:underline flex items-center">
            <AppstoreOutlined className="mr-1" /> Xem tất cả
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Tổng số người dùng" 
            value={dashboardData?.totalUsers || 0} 
            icon={<UserOutlined style={{ fontSize: '24px', color: '#4C51BF' }} />}
            color="border-indigo-500"
            percentage="12"
            subtitle="Tăng so với tháng trước"
          />
          <StatCard 
            title="Tổng số khóa học" 
            value={dashboardData?.totalCourses || 0} 
            icon={<BookOutlined style={{ fontSize: '24px', color: '#38A169' }} />}
            color="border-green-500"
            percentage="5"
            subtitle="Khóa học đang hoạt động"
          />
          <StatCard 
            title="Tổng số bài học" 
            value={dashboardData?.totalLessons || 0} 
            icon={<FileTextOutlined style={{ fontSize: '24px', color: '#ED8936' }} />}
            color="border-orange-500"
            percentage="8"
            subtitle="Trong tất cả khóa học"
          />
          <StatCard 
            title="Tổng số câu hỏi" 
            value={dashboardData?.totalQuizzes || 0} 
            icon={<QuestionCircleOutlined style={{ fontSize: '24px', color: '#E53E3E' }} />}
            color="border-red-500"
            subtitle="Trắc nghiệm & tự luận"
          />
        </div>
      </div>

      {/* Learning Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Thống Kê Học Tập</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="mb-2">
                <Tooltip title="Số bài đã được nộp">
                  <Progress
                    type="dashboard"
                    percent={Math.min(100, Math.round((dashboardData?.totalQuizSubmissions / 50) * 100) || 0)}
                    width={120}
                    format={() => dashboardData?.totalQuizSubmissions || 0}
                    strokeColor="#805AD5"
                  />
                </Tooltip>
              </div>
              <div className="text-sm font-medium">Bài nộp quiz</div>
            </div>
            
            <div className="text-center">
              <div className="mb-2">
                <Tooltip title="Điểm trung bình trên thang 10">
                  <Progress
                    type="dashboard"
                    percent={Math.round((dashboardData?.avgQuizScore || 0) * 10)}
                    width={120}
                    format={() => ((dashboardData?.avgQuizScore || 0)).toFixed(2)}
                    strokeColor="#DD6B20"
                  />
                </Tooltip>
              </div>
              <div className="text-sm font-medium">Điểm quiz trung bình</div>
            </div>
            
            <div className="text-center">
              <div className="mb-2">
                <Tooltip title="Số khóa học hoàn thành">
                  <Progress
                    type="dashboard"
                    percent={Math.min(100, Math.round((dashboardData?.completedCourses / 20) * 100) || 0)}
                    width={120}
                    format={() => dashboardData?.completedCourses || 0}
                    strokeColor="#2B6CB0"
                  />
                </Tooltip>
              </div>
              <div className="text-sm font-medium">Khóa học đã hoàn thành</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-bl-full -mt-2 -mr-2 flex items-center justify-center opacity-40">
            <FormOutlined style={{ fontSize: '24px', color: '#4299E1' }} />
          </div>
          
          <h2 className="text-xl font-semibold mb-6 text-gray-700">Đánh Giá & Khảo Sát</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Bài đánh giá</span>
                <span className="text-sm font-bold">{dashboardData?.totalAssessments || 0}</span>
              </div>
              <Progress 
                percent={Math.min(100, Math.round((dashboardData?.totalAssessments / 10) * 100) || 0)} 
                showInfo={false} 
                strokeColor="#48BB78" 
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Khảo sát đã gửi</span>
                <span className="text-sm font-bold">{dashboardData?.totalSurveySent || 0}</span>
              </div>
              <Progress 
                percent={Math.min(100, Math.round((dashboardData?.totalSurveySent / 10) * 100) || 0)} 
                showInfo={false} 
                strokeColor="#F56565" 
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Người tham gia chương trình</span>
                <span className="text-sm font-bold">{dashboardData?.totalProgramParticipants || 0}</span>
              </div>
              <Progress 
                percent={Math.min(100, Math.round((dashboardData?.totalProgramParticipants / 20) * 100) || 0)} 
                showInfo={false} 
                strokeColor="#ECC94B" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}