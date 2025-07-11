// consultant/components/ModernWorkdayTable.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Button, Tag, Spin, Empty, Alert } from "antd";
import { 
  Calendar, 
  Clock, 
  Eye, 
  Users, 
  CheckCircle,
  AlertCircle 
} from "lucide-react";
import api from "../../config/axios";
import AnimatedCard from "./AnimatedCard";
import SlotDetailModal from "./SlotDetailModal";

export default function ModernWorkdayTable({ refreshFlag }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consultantId, setConsultantId] = useState(null);
  
  const [showSlotDetail, setShowSlotDetail] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchConsultantProfile = async () => {
      try {
        const response = await api.get("/consultant/profile");
        setConsultantId(response.data.consultantId);
      } catch (error) {
        console.error("❌ Lỗi lấy thông tin consultant:", error);
        setError("Không thể lấy thông tin consultant");
      }
    };

    fetchConsultantProfile();
  }, []);

  useEffect(() => {
    if (!consultantId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const dates = generateDatesToCheck();
        const promises = dates.map((date) =>
          api
            .get("/slot/registered", {
              params: { consultantId, date },
            })
            .then((response) => {
              if (response.data && response.data.length > 0) {
                return { date, slots: response.data };
              }
              return null;
            })
            .catch(() => null)
        );

        const results = await Promise.all(promises);
        const filteredData = results.filter(Boolean);
        setData(filteredData);

        if (filteredData.length === 0) {
          setError("Chưa có ngày làm việc nào được đăng ký");
        }
      } catch (error) {
        console.error("💥 Lỗi tổng thể:", error);
        setError("Không thể tải dữ liệu lịch làm việc");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [consultantId, refreshFlag]);

  const generateDatesToCheck = () => {
    const dates = [];
    const today = new Date();

    for (let monthOffset = -1; monthOffset <= 1; monthOffset++) {
      const targetDate = new Date(
        today.getFullYear(),
        today.getMonth() + monthOffset,
        1
      );
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dates.push(dateStr);
        
      }
    }

    return dates;
  };

  const columns = [
    {
      title: () => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Ngày làm việc</span>
        </div>
      ),
      dataIndex: "date",
      key: "date",
      render: (date) => {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.toLocaleDateString("vi-VN", {
          weekday: "long",
        });
        const formattedDate = dateObj.toLocaleDateString("vi-VN");
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">{formattedDate}</div>
              <div className="text-sm text-gray-500">{dayOfWeek}</div>
            </div>
          </motion.div>
        );
      },
    },
    {
      title: () => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Số slot</span>
        </div>
      ),
      dataIndex: "slots",
      key: "slots",
      render: (slots) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Tag 
            color="blue" 
            className="px-4 py-2 text-base font-semibold rounded-full border-0 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700"
          >
            {slots?.length || 0} slots
          </Tag>
        </motion.div>
      ),
    },
    {
      title: () => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Thời gian</span>
        </div>
      ),
      dataIndex: "slots",
      key: "timeRange",
      render: (slots) => {
        if (!slots || slots.length === 0) return "-";
        const firstSlot = slots[0];
        const lastSlot = slots[slots.length - 1];
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-sm font-medium text-gray-700">
              {firstSlot.startTime} - {lastSlot.endTime}
            </div>
          </div>
        );
      },
    },
    {
      title: () => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Trạng thái</span>
        </div>
      ),
      key: "status",
      render: (row) => {
        const slotCount = row.slots?.length || 0;
        const availableCount = row.slots?.filter((slot) => slot.available).length || 0;
        const isFullyAvailable = availableCount === slotCount;
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tag 
              color={isFullyAvailable ? "green" : "orange"}
              className={`px-4 py-2 text-sm font-semibold rounded-full border-0 ${
                isFullyAvailable 
                  ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700' 
                  : 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {isFullyAvailable ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {availableCount}/{slotCount} còn trống
              </div>
            </Tag>
          </motion.div>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (row) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedSlots(row.slots);
              setSelectedDate(row.date);
              setShowSlotDetail(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
            icon={<Eye className="w-4 h-4" />}
          >
            Chi tiết
          </Button>
        </motion.div>
      ),
    },
  ];

  if (loading) {
    return (
      <AnimatedCard className="py-16">
        <div className="flex flex-col items-center gap-4">
          <Spin size="large" />
          <span className="text-gray-600 font-medium">Đang tải lịch làm việc...</span>
        </div>
      </AnimatedCard>
    );
  }

  if (error) {
    return (
      <AnimatedCard>
        <Alert
          message="Thông báo"
          description={error}
          type="info"
          showIcon
          className="border-0"
        />
      </AnimatedCard>
    );
  }

  if (data.length === 0) {
    return (
      <AnimatedCard className="py-16">
        <Empty
          description="Chưa có ngày làm việc nào được đăng ký"
          className="text-gray-500"
        />
      </AnimatedCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Stats */}
      <AnimatedCard className="mb-6">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                  📅 Lịch làm việc đã đăng ký
                </h3>
                <p className="text-gray-600">
                  Quản lý và theo dõi lịch làm việc của bạn
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {data.length}
              </div>
              <div className="text-sm text-gray-500">
                ngày làm việc
              </div>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Table */}
      <AnimatedCard>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="date"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} ngày`,
            className: "px-6 py-4 border-t border-gray-100"
                  }}
          bordered={false}
          className="modern-table"
          scroll={{ x: 800 }}
          rowClassName={(record, index) => 
            `modern-table-row hover:bg-gray-50 transition-all duration-200 ${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
            }`
          }
        />
      </AnimatedCard>

      {/* Slot Detail Modal */}
      <SlotDetailModal
        open={showSlotDetail}
        onCancel={() => setShowSlotDetail(false)}
        date={selectedDate}
        slots={selectedSlots}
      />

      {/* Custom Styles */}
      <style jsx global>{`
        .modern-table .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: none;
          font-weight: 600;
          color: #374151;
          padding: 16px;
        }
        
        .modern-table .ant-table-tbody > tr > td {
          border: none;
          padding: 16px;
        }
        
        .modern-table-row {
          border-radius: 8px;
          margin: 2px 0;
        }
        
        .modern-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
        
        .modern-table .ant-pagination {
          margin: 0;
        }
      `}</style>
    </motion.div>
  );
}