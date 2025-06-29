import React from "react";
import { Button, Tag } from "antd";
import dayjs from "dayjs";

function formatTime(timeObj) {
  if (!timeObj) return "--:--";
  const h = String(timeObj.hour).padStart(2, "0");
  const m = String(timeObj.minute).padStart(2, "0");
  return `${h}:${m}`;
}

export default function ScheduleTable({ schedules, loading, onEdit }) {
  return (
    <div className="overflow-x-auto rounded-xl shadow mt-4">
      <table className="w-full bg-white">
        <thead className="bg-blue-50">
          <tr>
            <th className="p-2">Ngày làm việc</th>
            <th className="p-2">Bắt đầu</th>
            <th className="p-2">Kết thúc</th>
            <th className="p-2">Số ca tối đa</th>
            <th className="p-2">Trạng thái</th>
            <th className="p-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-8">Đang tải...</td>
            </tr>
          ) : schedules.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8">Chưa có lịch làm việc nào.</td>
            </tr>
          ) : (
            schedules.map(sch => (
              <tr key={sch.scheduleId}>
                <td className="p-2">{sch.workDate}</td>
                <td className="p-2">{formatTime(sch.startTime)}</td>
                <td className="p-2">{formatTime(sch.endTime)}</td>
                <td className="p-2">{sch.maxAppointments}</td>
                <td className="p-2">
                  {sch.isAvailable
                    ? <Tag color="green">Có sẵn</Tag>
                    : <Tag color="red">Không có sẵn</Tag>
                  }
                </td>
                <td className="p-2">
                  <Button size="small" onClick={() => onEdit(sch)}>
                    Sửa
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
