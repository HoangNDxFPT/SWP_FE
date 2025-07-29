// consultant/components/ModernWorkdayCalendar.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, Button, message, Spin } from "antd";
import { Calendar as CalendarIcon, Check, X, Plus } from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "../../config/axios";
import { toast } from "react-toastify";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ModernWorkdayCalendar({ open, onCancel, onRegistered }) {
  const [selectedDates, setSelectedDates] = useState([]);
  const [registeredDates, setRegisteredDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [consultantId, setConsultantId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date()); // ✅ Thêm state để track tháng hiện tại

  if (!open) {
    return null;
  }

  useEffect(() => {
    if (!open) return;

    const fetchConsultantProfile = async () => {
      try {
        const response = await api.get("/consultant/profile");
        setConsultantId(response.data.consultantId);
      } catch (error) {
        console.error("❌ Lỗi lấy thông tin consultant:", error);
        message.error("Không thể lấy thông tin consultant");
      }
    };

    fetchConsultantProfile();
  }, [open]);

  // ✅ Fetch data mới khi consultantId hoặc currentDate thay đổi
  useEffect(() => {
    if (!consultantId || !open) return;

    const fetchRegisteredDays = async () => {
      setLoading(true);
      try {
        // ✅ Sử dụng currentDate thay vì new Date()
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        console.log(`🗓️ Đang fetch dữ liệu tháng ${month + 1}/${year}`);

        let promises = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(year, month, d);
          const dateStr = formatDate(dateObj);
          promises.push(
            api
              .get("/slot/registered", {
                params: { consultantId, date: dateStr },
              })
              .then((res) => (res.data && res.data.length > 0 ? dateStr : null))
              .catch(() => null)
          );
        }

        const results = await Promise.all(promises);
        const monthRegisteredDates = results.filter(Boolean);
        
        console.log(`✅ Tháng ${month + 1}/${year} có ${monthRegisteredDates.length} ngày đã đăng ký:`, monthRegisteredDates);
        setRegisteredDates(monthRegisteredDates);
      } catch (error) {
        console.error("Error fetching registered days:", error);
        setRegisteredDates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRegisteredDays();
    setSelectedDates([]); // Reset selected dates khi đổi tháng
  }, [consultantId, open, currentDate]); // ✅ Thêm currentDate vào dependency

  // ✅ Handle khi user chuyển tháng trong calendar
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    if (activeStartDate) {
      console.log("📅 User chuyển sang tháng:", activeStartDate);
      setCurrentDate(activeStartDate);
    }
  };

  const handleDateClick = (date) => {
    const dateStr = formatDate(date);
    if (registeredDates.includes(dateStr)) return;

    setSelectedDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleRegister = async () => {
    if (selectedDates.length === 0) {
      message.warning("Bạn chưa chọn ngày nào!");
      toast.warning("Bạn chưa chọn ngày nào!");
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        selectedDates.map((date) => {
          console.log("📝 Đăng ký ngày:", date);
          return api.post("/slot/register", { date });
        })
      );

      message.success("Đăng ký thành công!");
      toast.success("Đăng ký thành công!");
      setSelectedDates([]);
      
      // ✅ Refresh lại dữ liệu tháng hiện tại sau khi đăng ký
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      let promises = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dateStr = formatDate(dateObj);
        promises.push(
          api
            .get("/slot/registered", {
              params: { consultantId, date: dateStr },
            })
            .then((res) => (res.data && res.data.length > 0 ? dateStr : null))
            .catch(() => null)
        );
      }
      
      const results = await Promise.all(promises);
      setRegisteredDates(results.filter(Boolean));
      
      if (onRegistered) onRegistered();
      onCancel();
    } catch (error) {
      console.error("Error registering dates:", error);
      message.error("Đăng ký thất bại!");
      toast.error("Đăng ký thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const dateStr = formatDate(date);
      if (registeredDates.includes(dateStr))
        return "registered-date";
      if (selectedDates.includes(dateStr)) 
        return "selected-date";
    }
    return "";
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
      className="modern-workday-modal"
      destroyOnClose={true}
      maskClosable={true}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="p-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Đăng ký ngày làm việc
            </h2>
            <p className="text-gray-600">
              Chọn những ngày bạn muốn làm việc - Tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-500"></div>
            <span className="text-sm text-gray-700">Đã đăng ký</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-600"></div>
            <span className="text-sm text-gray-700">Đang chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded-full border-2 border-gray-300"></div>
            <span className="text-sm text-gray-700">Có thể chọn</span>
          </div>
        </div>

        {/* Selected dates preview */}
        <AnimatePresence>
          {selectedDates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Ngày đã chọn ({selectedDates.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map((date, index) => (
                  <motion.span
                    key={date}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {new Date(date).toLocaleDateString('vi-VN')}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calendar */}
        <div className="mb-6">
          <Spin spinning={loading}>
            <Calendar
              onClickDay={handleDateClick}
              onActiveStartDateChange={handleActiveStartDateChange} // ✅ Thêm handler này
              tileClassName={tileClassName}
              value={null}
              selectRange={false}
              className="modern-calendar"
              tileDisabled={({ date }) => {
                const dateStr = formatDate(date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || registeredDates.includes(dateStr);
              }}
            />
          </Spin>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            onClick={onCancel}
            size="large"
            className="px-6"
          >
            Hủy
          </Button>
          
          <Button
            type="primary"
            onClick={handleRegister}
            disabled={selectedDates.length === 0}
            loading={loading}
            size="large"
            className="px-6 bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            icon={<Plus className="w-4 h-4" />}
          >
            Đăng ký {selectedDates.length > 0 && `(${selectedDates.length} ngày)`}
          </Button>
        </div>
      </motion.div>

      {/* Custom Styles giữ nguyên */}
      <style jsx global>{`
        .modern-workday-modal {
          z-index: 1000;
        }
        
        .modern-workday-modal .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
        }
        
        .modern-calendar {
          width: 100%;
          border: none;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          font-family: inherit;
        }
        
        .modern-calendar .react-calendar__navigation {
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 16px;
          height: 50px;
        }
        
        .modern-calendar .react-calendar__navigation button {
          border: none;
          background: none;
          font-weight: 600;
          color: #374151;
          padding: 12px;
          border-radius: 6px;
          transition: all 0.2s ease;
          min-width: 40px;
          height: 40px;
        }
        
        .modern-calendar .react-calendar__navigation button:hover {
          background: #e5e7eb;
          transform: translateY(-1px);
        }
        
        .modern-calendar .react-calendar__navigation__label {
          font-size: 16px;
          font-weight: 700;
        }
        
        .modern-calendar .react-calendar__month-view__weekdays {
          background: #f8fafc;
          border-radius: 8px;
          padding: 8px 0;
          margin-bottom: 8px;
        }
        
        .modern-calendar .react-calendar__month-view__weekdays__weekday {
          padding: 8px;
          font-weight: 600;
          color: #6b7280;
          text-align: center;
          font-size: 12px;
          text-transform: uppercase;
        }
        
        .modern-calendar .react-calendar__month-view__days {
          gap: 2px;
        }
        
        .modern-calendar .react-calendar__tile {
          border: none;
          background: none;
          padding: 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
          position: relative;
          margin: 2px;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
        }
        
        .modern-calendar .react-calendar__tile:hover {
          background: #f3f4f6 !important;
          transform: scale(1.05);
        }
        
        .modern-calendar .react-calendar__tile--active {
          background: #3b82f6 !important;
          color: white !important;
        }
        
        .modern-calendar .react-calendar__tile--now {
          background: #dbeafe;
          color: #1d4ed8;
          font-weight: 700;
        }
        
        .modern-calendar .react-calendar__tile--neighboringMonth {
          color: #d1d5db !important;
        }
        
        .modern-calendar .registered-date {
          background: linear-gradient(135deg, #fbbf24, #f59e0b) !important;
          color: white !important;
          cursor: not-allowed !important;
          transform: none !important;
        }
        
        .modern-calendar .selected-date {
          background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          transform: scale(1.1) !important;
        }
        
        .modern-calendar .react-calendar__tile--disabled {
          background: #f9fafb !important;
          color: #d1d5db !important;
          cursor: not-allowed !important;
        }
        
        /* ✅ SỬA LAYOUT ĐỂ HIỂN THỊ ĐẦY ĐỦ 7 NGÀY */
        .modern-calendar .react-calendar__month-view__days {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr) !important;
          gap: 2px !important;
        }
        
        .modern-calendar .react-calendar__month-view__weekdays {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr) !important;
        }
      `}</style>
    </Modal>
  );
}
