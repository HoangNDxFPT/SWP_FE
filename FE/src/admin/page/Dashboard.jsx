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
  TrophyOutlined,
  CalendarOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Progress, Card, Row, Col, Statistic } from 'antd';

// Modern Stat Card Component
const ModernStatCard = ({ title, value, icon, color, subtitle }) => (
  <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
    <div className="relative">
      <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-10 rounded-full -mr-8 -mt-8`}></div>
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-gray-500 text-sm font-medium mb-2">{title}</div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {typeof value === 'number' && title.includes('Điểm') ? value.toFixed(2) : value}
          </div>
          
          {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
        </div>
        
        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
          {React.cloneElement(icon, { style: { fontSize: '24px' } })}
        </div>
      </div>
    </div>
  </Card>
);

// Quick Action Card
const QuickActionCard = ({ title, description, icon, color, onClick }) => (
  <Card 
    className="cursor-pointer h-full hover:shadow-lg transition-all duration-300 border-l-4"
    style={{ borderLeftColor: color }}
    onClick={onClick}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-lg mr-4`} style={{ backgroundColor: `${color}20` }}>
        {React.cloneElement(icon, { style: { fontSize: '20px', color } })}
      </div>
      <div>
        <div className="font-semibold text-gray-800">{title}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <div className="mt-4 text-lg font-medium text-gray-700">Đang tải dashboard...</div>
          <div className="text-sm text-gray-500 mt-2">Vui lòng đợi trong giây lát</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 inline-block">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Không thể tải dữ liệu</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <TrophyOutlined className="mr-3" />
                Dashboard Quản Trị
              </h1>
              <p className="text-blue-100 text-lg">
                Tổng quan hoạt động hệ thống Tư Vấn Tâm Lý Sinh Viên
              </p>
            </div>
            
            <div className="mt-4 lg:mt-0 text-right">
              <div className="text-blue-100 text-sm">Hôm nay</div>
              <div className="text-xl font-bold">{new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <ModernStatCard
            title="Tổng Người Dùng"
            value={dashboardData?.totalUsers || 0}
            icon={<UserOutlined className="text-blue-600" />}
            color="bg-blue-600"
            subtitle="Sinh viên & tư vấn viên"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ModernStatCard
            title="Khóa Học"
            value={dashboardData?.totalCourses || 0}
            icon={<BookOutlined className="text-green-600" />}
            color="bg-green-600"
            subtitle="Đang hoạt động"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ModernStatCard
            title="Lịch Hẹn"
            value={dashboardData?.totalAppointments || 0}
            icon={<ScheduleOutlined className="text-orange-600" />}
            color="bg-orange-600"
            subtitle="Tư vấn trực tiếp"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ModernStatCard
            title="Hoàn Thành"
            value={dashboardData?.completedCourses || 0}
            icon={<CheckCircleOutlined className="text-purple-600" />}
            color="bg-purple-600"
            subtitle="Khóa học đã hoàn thành"
          />
        </Col>
      </Row>

      {/* Secondary Statistics */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={8}>
          <Card title="📚 Học Tập & Đánh Giá" className="h-full shadow-lg">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Statistic
                  title="Tổng Bài Học"
                  value={dashboardData?.totalLessons || 0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="Câu Hỏi Quiz"
                  value={dashboardData?.totalQuizzes || 0}
                  prefix={<QuestionCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="Điểm TB Quiz"
                  value={dashboardData?.avgQuizScore || 0}
                  precision={2}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#ff7a00' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card title="📊 Khảo Sát & Đánh Giá" className="h-full shadow-lg">
            <div className="space-y-6">
              <div>
                <Statistic
                  title="Bài Đánh Giá"
                  value={dashboardData?.totalAssessments || 0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </div>

              <div>
                <Statistic
                  title="Khảo Sát Gửi"
                  value={dashboardData?.totalSurveySent || 0}
                  prefix={<FormOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </div>

              <div>
                <Statistic
                  title="Tham Gia Chương Trình"
                  value={dashboardData?.totalProgramParticipants || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="� Thống Kê Bài Nộp" className="h-full shadow-lg">
            <div className="space-y-6">
              <div className="text-center">
                <Statistic
                  title="Tổng bài quiz đã nộp"
                  value={dashboardData?.totalQuizSubmissions || 0}
                  prefix={<FormOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </div>

              <div className="text-center">
                <Statistic
                  title="Điểm trung bình"
                  value={dashboardData?.avgQuizScore || 0}
                  precision={2}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </div>

              <div className="text-center">
                <Statistic
                  title="Khóa học hoàn thành"
                  value={dashboardData?.completedCourses || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <EyeOutlined className="mr-2" />
          Thao Tác Nhanh
        </h2>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <QuickActionCard
              title="Quản Lý Người Dùng"
              description="Xem và quản lý tài khoản"
              icon={<UserOutlined />}
              color="#1890ff"
              onClick={() => console.log('Navigate to users')}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <QuickActionCard
              title="Quản Lý Khóa Học"
              description="Tạo và chỉnh sửa khóa học"
              icon={<BookOutlined />}
              color="#52c41a"
              onClick={() => console.log('Navigate to courses')}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <QuickActionCard
              title="Lịch Hẹn"
              description="Xem lịch tư vấn"
              icon={<CalendarOutlined />}
              color="#fa8c16"
              onClick={() => console.log('Navigate to appointments')}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <QuickActionCard
              title="Báo Cáo"
              description="Xem báo cáo thống kê"
              icon={<FormOutlined />}
              color="#722ed1"
              onClick={() => console.log('Navigate to reports')}
            />
          </Col>
        </Row>
      </div>

      {/* Performance Overview */}
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="📈 Tổng Quan Hiệu Suất" className="shadow-lg">
            <Row gutter={[32, 32]} align="middle">
              <Col xs={24} sm={12} md={6} className="text-center">
                <Statistic
                  title="Bài Quiz Nộp"
                  value={dashboardData?.totalQuizSubmissions || 0}
                  prefix={<FormOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                />
              </Col>
              
              <Col xs={24} sm={12} md={6} className="text-center">
                <Statistic
                  title="Điểm TB"
                  value={dashboardData?.avgQuizScore || 0}
                  precision={2}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                />
              </Col>
              
              <Col xs={24} sm={12} md={6} className="text-center">
                <Statistic
                  title="Khóa Học Hoàn Thành"
                  value={dashboardData?.completedCourses || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#fa8c16', fontSize: '24px' }}
                />
              </Col>
              
              <Col xs={24} sm={12} md={6} className="text-center">
                <Statistic
                  title="Người Tham Gia"
                  value={dashboardData?.totalProgramParticipants || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1', fontSize: '24px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}