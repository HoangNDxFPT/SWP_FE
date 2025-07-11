// consultant/components/ModernSlotDetailModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Table, Tag, Typography, Progress } from "antd";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users,
  Activity
} from "lucide-react";

const { Title } = Typography;

export default function ModernSlotDetailModal({ open, onCancel, date, slots }) {
  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => (
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full text-white font-semibold text-sm">
          {index + 1}
        </div>
      ),
      width: 60,
    },
    {
      title: () => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Thời gian</span>
        </div>
      ),
      dataIndex: "label",
      key: "label",
      render: (label, record) => (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
            <Clock className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800 text-base">{label}</div>
            <div className="text-sm text-gray-500">
              {record.startTime} - {record.endTime}
            </div>
          </div>
        </motion.div>
      ),
    },
    {
      title: () => (
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <span>Trạng thái</span>
        </div>
      ),
      dataIndex: "available",
      key: "available",
      render: (available) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Tag 
            color={available ? "green" : "red"}
            className={`px-4 py-2 text-sm font-semibold rounded-full border-0 ${
              available 
                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700' 
                : 'bg-gradient-to-r from-red-100 to-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {available ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {available ? "Còn trống" : "Đã đặt"}
            </div>
          </Tag>
        </motion.div>
      ),
    },
  ];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const totalSlots = slots?.length || 0;
  const availableSlots = slots?.filter((s) => s.available).length || 0;
  const bookedSlots = totalSlots - availableSlots;
  const availabilityPercent = totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 0;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      centered
      className="modern-slot-modal"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <Title level={3} className="mb-0 text-gray-800">
              Chi tiết lịch làm việc
            </Title>
            <p className="text-lg text-gray-600 mb-0">
              {formatDate(date)}
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-600 font-medium">Tổng slot</div>
                <div className="text-2xl font-bold text-blue-800">{totalSlots}</div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-600 font-medium">Còn trống</div>
                <div className="text-2xl font-bold text-green-800">{availableSlots}</div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-red-600 font-medium">Đã đặt</div>
                <div className="text-2xl font-bold text-red-800">{bookedSlots}</div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-red-500 rounded-xl">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-600 font-medium">Khả dụng</div>
                <div className="text-2xl font-bold text-purple-800">
                  {availabilityPercent.toFixed(0)}%
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 p-4 bg-gray-50 rounded-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Tỷ lệ slot còn trống
            </span>
            <span className="text-sm font-bold text-gray-800">
              {availableSlots}/{totalSlots}
            </span>
          </div>
          <Progress
            percent={availabilityPercent}
            strokeColor={{
              from: availabilityPercent > 50 ? '#10b981' : '#f59e0b',
              to: availabilityPercent > 50 ? '#059669' : '#d97706',
            }}
            className="mb-0"
          />
        </motion.div>

        {/* Slots Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <Table
            dataSource={slots}
            columns={columns}
            rowKey="slotId"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} slot`,
            }}
            size="middle"
            className="modern-slot-table"
            scroll={{ y: 400 }}
            rowClassName={(record, index) => 
              `slot-row ${record.available ? 'available' : 'booked'} ${
                index % 2 === 0 ? 'even' : 'odd'
              }`
            }
          />
        </motion.div>
      </motion.div>

      {/* Custom Styles */}
      <style jsx global>{`
        .modern-slot-modal .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
        }
        
        .modern-slot-table .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: none;
          font-weight: 600;
          color: #374151;
          padding: 16px;
        }
        
        .modern-slot-table .ant-table-tbody > tr > td {
          border: none;
          padding: 16px;
        }
        
        .slot-row {
          transition: all 0.2s ease;
        }
        
        .slot-row.available {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }
        
        .slot-row.booked {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        }
        
        .slot-row:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .modern-slot-table .ant-pagination {
          margin: 16px 0 0 0;
          padding: 0 16px;
        }
      `}</style>
    </Modal>
  );
}
