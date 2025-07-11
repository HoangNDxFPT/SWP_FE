// consultant/components/SlotDetailModal.jsx
import React from "react";
import { Modal, Table, Tag, Typography } from "antd";

const { Title } = Typography;

export default function SlotDetailModal({ open, onCancel, date, slots }) {
  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: "Thời gian",
      dataIndex: "label",
      key: "label",
      render: (label, record) => (
        <div className="font-medium">
          <div className="text-base">{label}</div>
          <div className="text-sm text-gray-500">
            {record.startTime} - {record.endTime}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "available",
      key: "available",
      render: (available) => (
        <Tag color={available ? "green" : "red"}>
          {available ? "Còn trống" : "Đã đặt"}
        </Tag>
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

  return (
    <Modal
      title={
        <Title level={4} className="mb-0">
          📅 Chi tiết slot ngày {formatDate(date)}
        </Title>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      className="top-8"
    >
      <div className="mb-4">
        <div className="flex gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Tổng slot</div>
            <div className="text-2xl font-bold text-blue-600">
              {slots?.length || 0}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Còn trống</div>
            <div className="text-2xl font-bold text-green-600">
              {slots?.filter((s) => s.available).length || 0}
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Đã đặt</div>
            <div className="text-2xl font-bold text-orange-600">
              {slots?.filter((s) => !s.available).length || 0}
            </div>
          </div>
        </div>
      </div>

      <Table
        dataSource={slots}
        columns={columns}
        rowKey="slotId"
        pagination={false}
        size="small"
        scroll={{ y: 400 }}
        className="border rounded-lg"
      />
    </Modal>
  );
}
