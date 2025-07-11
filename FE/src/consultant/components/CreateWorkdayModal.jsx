import React, { useState, useEffect } from "react";
import { Modal, Button, message, Spin } from "antd";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "../../config/axios";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}; // dùng giờ UTC để tránh vấn đề múi giờ

export default function CreateWorkdayModal({
  open,
  onCancel,
  consultantId,
  onRegistered,
}) {
  const [selectedDates, setSelectedDates] = useState([]);
  const [registeredDates, setRegisteredDates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy các ngày đã đăng ký trong tháng
  useEffect(() => {
    if (!consultantId || !open) return;
    
    const fetchRegisteredDays = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let promises = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(year, month, d);
          const dateStr = formatDate(dateObj);
          promises.push(
            api
              .get("/slot/registered", {  // ✅ Sửa: thêm dấu "/"
                params: { consultantId, date: dateStr },
              })
              .then((res) => (res.data && res.data.length > 0 ? dateStr : null))
              .catch((error) => {
                console.error(`Error fetching slots for ${dateStr}:`, error);
                return null;
              })
          );
        }
        
        const results = await Promise.all(promises);
        setRegisteredDates(results.filter(Boolean));
      } catch (error) {
        console.error("Error fetching registered days:", error);
        setRegisteredDates([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRegisteredDays();
    setSelectedDates([]); // reset selection khi mở lại modal
  }, [consultantId, open]);

  // Chọn/bỏ chọn ngày
  const handleDateClick = (date) => {
    const dateStr = formatDate(date);
    if (registeredDates.includes(dateStr)) return;
    
    setSelectedDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  // Đăng ký các ngày đã chọn
  const handleRegister = async () => {
    if (selectedDates.length === 0) {
      message.warning("Bạn chưa chọn ngày nào!");
      return;
    }
    
    setLoading(true);
    try {
      await Promise.all(
        selectedDates.map((date) => {
          console.log("Đăng ký ngày:", date);
          return api.post("/slot/register", { date }); // ✅ Sửa: thêm dấu "/"
        })
      );
      
      message.success("Đăng ký thành công!");
      setSelectedDates([]);
      if (onRegistered) onRegistered();
      onCancel();
    } catch (error) {
      console.error("Error registering dates:", error);
      message.error("Đăng ký thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const dateStr = formatDate(date);
      if (registeredDates.includes(dateStr))
        return "bg-yellow-300 cursor-not-allowed";
      if (selectedDates.includes(dateStr)) return "bg-blue-500 text-white";
    }
    return "";
  };

  return (
    <Modal
      title="Đăng ký ngày làm việc"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      centered
    >
      <Spin spinning={loading}>
        <div className="flex flex-col items-center">
          <div className="mb-4 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                Đã đăng ký
              </span>
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                Đang chọn
              </span>
            </div>
          </div>
          
          <Calendar
            onClickDay={handleDateClick}
            tileClassName={tileClassName}
            value={null}
            selectRange={false}
            tileDisabled={({ date }) => {
              const dateStr = formatDate(date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today || registeredDates.includes(dateStr);
            }}
          />
          
          <div className="mt-4 flex gap-2">
            <Button
              type="primary"
              onClick={handleRegister}
              disabled={selectedDates.length === 0}
              loading={loading}
            >
              Đăng ký{" "}
              {selectedDates.length > 0 ? `(${selectedDates.length} ngày)` : ""}
            </Button>
            <Button onClick={onCancel}>Hủy</Button>
          </div>
        </div>
      </Spin>
      
      <style jsx>{`
        .bg-yellow-300 { 
          background: #fde68a !important; 
          border-radius: 4px;
        }
        .bg-blue-500 { 
          background: #3b82f6 !important; 
          border-radius: 4px;
        }
        .text-white { 
          color: #fff !important; 
        }
        .cursor-not-allowed { 
          cursor: not-allowed; 
        }
      `}</style>
    </Modal>
  );
}
