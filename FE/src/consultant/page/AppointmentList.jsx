// consultant/page/AppointmentList.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ConsultantHeader from "../components/Header";
import Footer from "../components/Footer";
import api from "../../config/axios";
import { Button, Tabs, message } from "antd";
import ModernWorkdayCalendar from "../components/ModernWorkdayCalendar";
import ModernWorkdayTable from "../components/ModernWorkdayTable";
import { Plus, Calendar as CalendarIcon, Users, FileText } from "lucide-react";
import AnimatedCard from "../components/AnimatedCard";
import AppointmentManagement from "../components/AppointmentManagement";
import ConsultationCases from "../components/ConsultationCases";

function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const appointmentsRes = await api.get(
          "appointment/appointments/consultant",
          {
            params: { status: "PENDING" },
          }
        );

        // Cases API - keeping placeholder for now
        const casesRes = { data: [] };

        setAppointments(appointmentsRes.data);
        setCases(casesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Không thể tải dữ liệu!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tabItems = [
    {
      key: "appointments",
      label: (
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          <span>Lịch hẹn</span>
        </div>
      ),
      children: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <AppointmentManagement
            appointments={appointments}
            onAppointmentCreated={() => setRefresh((r) => r + 1)}
          />
        </motion.div>
      ),
    },
    {
      key: "cases",
      label: (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>Hồ sơ tư vấn</span>
        </div>
      ),
      children: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <ConsultationCases />
        </motion.div>
      ),
    },
    {
      key: "schedules",
      label: (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Lịch làm việc</span>
        </div>
      ),
      children: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="flex justify-end mb-6">
            <Button
              type="primary"
              size="large"
              onClick={() => setShowCreateSchedule(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-6 rounded-xl"
              icon={<Plus className="w-5 h-5" />}
            >
              Đăng ký ngày làm việc
            </Button>
          </div>

          <ModernWorkdayTable refreshFlag={refresh} />

          {showCreateSchedule && (
            <ModernWorkdayCalendar
              open={showCreateSchedule}
              onCancel={() => setShowCreateSchedule(false)}
              onRegistered={() => setRefresh((r) => r + 1)}
            />
          )}
        </motion.div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <ConsultantHeader />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏥 Quản lý công việc
          </h1>
          <p className="text-gray-600 text-lg">
            Theo dõi và quản lý công việc hàng ngày
          </p>
        </motion.div>

        <AnimatedCard className="p-6">
          <Tabs
            defaultActiveKey="appointments" // ✅ Đổi default về schedules vì nó đã hoàn thiện
            items={tabItems}
            className="modern-tabs"
            size="large"
          />
        </AnimatedCard>
      </motion.div>

      <Footer />

      {/* Custom Styles */}
      <style jsx global>{`
        .modern-tabs .ant-tabs-nav {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          padding: 8px;
          margin-bottom: 24px;
        }

        .modern-tabs .ant-tabs-tab {
  border: none;
  border-radius: 8px;
  margin: 0 4px;
  /* Tăng padding cho rộng rãi */
  padding: 14px 32px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 120px; /* Chữ ngắn cũng sẽ vẫn rộng */
  display: flex;
  align-items: center;
  justify-content: center;
}

        .modern-tabs .ant-tabs-tab:hover {
          background: rgba(59, 130, 246, 0.1);
          transform: translateY(-1px);
        }

        .modern-tabs .ant-tabs-tab-active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          padding: 16px 40px;
        }

        .modern-tabs .ant-tabs-tab-active:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .modern-tabs .ant-tabs-content-holder {
          padding: 0;
        }

        .modern-tabs .ant-tabs-ink-bar {
          display: none;
        }

        .modern-tabs .ant-tabs-tab-active svg {
          color: #fff !important;
          stroke: #fff !important;
        }
        .modern-tabs .ant-tabs-tab-active,
        .modern-tabs .ant-tabs-tab-active span,
        .modern-tabs .ant-tabs-tab-active div,
        .modern-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #fff !important;
        }
      `}</style>
    </div>
  );
}

export default AppointmentList;
