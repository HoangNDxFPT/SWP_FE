import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Spin, Empty, Alert } from "antd";
import api from "../../config/axios";
import SlotDetailModal from "./SlotDetailModal";

export default function RegisteredWorkdayTable({ refreshFlag }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consultantId, setConsultantId] = useState(null); // ✅ Lấy từ API

  const [showSlotDetail, setShowSlotDetail] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  // ✅ Lấy consultantId từ API profile
  useEffect(() => {
    const fetchConsultantProfile = async () => {
      try {
        console.log("🔍 Đang lấy thông tin consultant...");
        const response = await api.get("/consultant/profile");
        console.log("✅ Thông tin consultant:", response.data);
        setConsultantId(response.data.consultantId);
      } catch (error) {
        console.error("❌ Lỗi lấy thông tin consultant:", error);
        setError("Không thể lấy thông tin consultant");
      }
    };

    fetchConsultantProfile();
  }, []);

  // ✅ Lấy dữ liệu lịch làm việc khi đã có consultantId
  useEffect(() => {
    if (!consultantId) {
      console.log("⏳ Đang chờ consultantId...");
      return;
    }

    console.log("🔍 Bắt đầu tải dữ liệu với consultantId:", consultantId);

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const dates = generateDatesToCheck();
        console.log("📅 Sẽ kiểm tra", dates.length, "ngày");

        const promises = dates.map((date) =>
          api
            .get("/slot/registered", {
              params: { consultantId, date }, // ✅ Cần consultantId
            })
            .then((response) => {
              if (response.data && response.data.length > 0) {
                console.log(`✅ Ngày ${date}: ${response.data.length} slots`);
                return { date, slots: response.data };
              }
              return null;
            })
            .catch((error) => {
              console.error(`❌ Lỗi lấy dữ liệu cho ngày ${date}:`, error);
              return null;
            })
        );

        const results = await Promise.all(promises);
        const filteredData = results.filter(Boolean);

        console.log(
          "🎯 Kết quả cuối cùng:",
          filteredData.length,
          "ngày có dữ liệu"
        );
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

  // Tạo danh sách ngày cần kiểm tra (3 tháng)
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
        // ✅ Sửa cách tạo ngày để không bị lệch timezone
        const dateObj = new Date(year, month, day);
        console.log("Generated date:", dateObj.toLocaleDateString("vi-VN"));
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;
        dates.push(dateStr);
      }
    }

    return dates;
  };
  const columns = [
    {
      title: "Ngày làm việc",
      dataIndex: "date",
      key: "date",
      render: (date) => {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.toLocaleDateString("vi-VN", {
          weekday: "long",
        });
        const formattedDate = dateObj.toLocaleDateString("vi-VN");
        return (
          <div>
            <b>{formattedDate}</b>
            <br />
            <small className="text-gray-500">{dayOfWeek}</small>
          </div>
        );
      },
    },
    {
      title: "Số slot",
      dataIndex: "slots",
      key: "slots",
      render: (slots) => (
        <Tag color="blue" className="text-lg px-3 py-1">
          {slots?.length || 0}
        </Tag>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "slots",
      key: "timeRange",
      render: (slots) => {
        if (!slots || slots.length === 0) return "-";
        const firstSlot = slots[0];
        const lastSlot = slots[slots.length - 1];
        return (
          <div className="text-sm">
            {firstSlot.startTime} - {lastSlot.endTime}
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (row) => {
        const slotCount = row.slots?.length || 0;
        const availableCount =
          row.slots?.filter((slot) => slot.available).length || 0;
        return (
          <div>
            <Tag color={availableCount === slotCount ? "green" : "orange"}>
              {availableCount}/{slotCount} còn trống
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (row) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedSlots(row.slots);
            setSelectedDate(row.date);
            setShowSlotDetail(true);
          }}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" />
        <span className="ml-3 text-gray-600">Đang tải lịch làm việc...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Thông báo"
        description={error}
        type="info"
        showIcon
        className="mt-4"
      />
    );
  }

  if (data.length === 0) {
    return (
      <Empty
        description="Chưa có ngày làm việc nào được đăng ký"
        className="py-12"
      />
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          📅 Lịch làm việc đã đăng ký
        </h3>
        <p className="text-blue-600">
          Tổng cộng: <strong>{data.length}</strong> ngày làm việc
        </p>
      </div>

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
        }}
        bordered
        className="shadow-sm"
        scroll={{ x: 800 }}
      />

      <SlotDetailModal
        open={showSlotDetail}
        onCancel={() => setShowSlotDetail(false)}
        date={selectedDate}
        slots={selectedSlots}
      />
    </div>
  );
}
