import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../consultant/components/style.css"; // Tạo file này để custom sâu hơn nếu muốn

function PrettyCalendar({ appointments }) {
  // State cho tháng/năm đang xem
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Hàm đổi tháng/năm nhanh
  const handleMonthChange = (e) => {
    const month = Number(e.target.value);
    const newDate = new Date(viewDate);
    newDate.setMonth(month);
    setViewDate(new Date(newDate));
  };

  const handleYearChange = (e) => {
    const year = Number(e.target.value);
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(new Date(newDate));
  };

  // Lấy danh sách năm hợp lệ, ví dụ từ 2020 tới 2030
  const years = [];
  for (let y = 2020; y <= 2030; y++) years.push(y);

  // tileClassName theo status
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const dateStr = date.toISOString().split("T")[0];
      const found = appointments.find((app) => app.date === dateStr);
      if (found) {
        if (found.status === "PENDING") return "calendar-pending";
        if (found.status === "CONFIRMED") return "calendar-confirmed";
        if (found.status === "REJECTED") return "calendar-rejected";
        if (found.status === "COMPLETED") return "calendar-completed";
      }
    }
    return "";
  };

  // Hiệu ứng mượt mà khi chuyển tháng/năm
  return (
    <motion.div
      className="flex flex-col items-center bg-white rounded-3xl shadow-2xl p-8 calendar-wrapper w-full max-w-[540px] min-h-[540px]"
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 80 }}
      style={{ minWidth: "420px", maxWidth: "100%", margin: "0 auto" }}
    >
      {/* Thanh chọn tháng/năm */}
      <div className="flex gap-4 mb-4 items-center">
        <select
          value={viewDate.getMonth()}
          onChange={handleMonthChange}
          className="p-2 rounded border text-lg shadow focus:ring-2 focus:ring-blue-300"
        >
          {Array.from({ length: 12 }).map((_, idx) => (
            <option value={idx} key={idx}>
              {`Tháng ${idx + 1}`}
            </option>
          ))}
        </select>
        <select
          value={viewDate.getFullYear()}
          onChange={handleYearChange}
          className="p-2 rounded border text-lg shadow focus:ring-2 focus:ring-blue-300"
        >
          {years.map((y) => (
            <option value={y} key={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      {/* Calendar lớn, custom class */}
      <Calendar
        value={selectedDate}
        onChange={setSelectedDate}
        activeStartDate={viewDate}
        onActiveStartDateChange={({ activeStartDate }) =>
          setViewDate(activeStartDate)
        }
        tileClassName={tileClassName}
        className="large-pretty-calendar"
        prev2Label={null}
        next2Label={null}
        formatShortWeekday={(locale, date) =>
          ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()]
        }
      />

      {/* Show nội dung lịch hẹn nếu click ngày */}
      <div className="mt-4 min-h-[32px] text-center">
        {selectedDate &&
          appointments
            .filter(
              (app) => app.date === selectedDate.toISOString().split("T")[0]
            )
            .map((app, idx) => (
              <div key={idx}>
                <span className="font-bold text-blue-700">{app.title}</span>
              </div>
            ))}
      </div>
    </motion.div>
  );
}
export default PrettyCalendar;
