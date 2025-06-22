import React, { useState } from "react";
import { Input, Select, DatePicker, TimePicker, Button } from "antd";

function AppointmentTable({
  appointments,
  loading,
  onCreate,
  onDetail,
  onSuggest,
}) {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState(null);
  const [searchTime, setSearchTime] = useState(null);

  const filteredAppointments = appointments.filter((a) => {
    const matchStatus = filterStatus === "ALL" || a.status === filterStatus;
    const matchText =
      searchText === "" ||
      a.userFullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      a.userEmail?.toLowerCase().includes(searchText.toLowerCase());
    const matchDate = !searchDate || a.date === searchDate.format("YYYY-MM-DD");
    const matchTime = !searchTime || a.time === searchTime.format("HH:mm");
    return matchStatus && matchText && matchDate && matchTime;
  });

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <Input.Search
          placeholder="Tìm tên/email..."
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 220 }}
          allowClear
        />
        <DatePicker
          placeholder="Ngày"
          onChange={setSearchDate}
          allowClear
          style={{ width: 140 }}
        />
        <TimePicker
          placeholder="Giờ"
          onChange={setSearchTime}
          allowClear
          format="HH:mm"
          style={{ width: 120 }}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 160 }}
        >
          <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
          <Select.Option value="PENDING">Chờ xác nhận</Select.Option>
          <Select.Option value="CONFIRMED">Đã xác nhận</Select.Option>
          <Select.Option value="COMPLETED">Hoàn thành</Select.Option>
          <Select.Option value="REJECTED">Bị từ chối</Select.Option>
        </Select>

        <div className="ml-auto">
          <Button type="primary" onClick={onCreate}>
            Tạo lịch hẹn
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="w-full bg-white">
          <thead className="bg-blue-50">
            <tr>
              <th className="p-2">Ngày</th>
              <th className="p-2">Giờ</th>
              <th className="p-2">Tên khách</th>
              <th className="p-2">Email</th>
              <th className="p-2">Trạng thái</th>
              <th className="p-2">Ghi chú</th>
              <th className="p-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  Đang tải...
                </td>
              </tr>
            ) : filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  Không có lịch hẹn nào.
                </td>
              </tr>
            ) : (
              filteredAppointments.map((a) => (
                <tr key={a.id} className="transition hover:bg-blue-50">
                  <td className="p-2">{a.date}</td>
                  <td className="p-2">{a.time}</td>
                  <td className="p-2">{a.userFullName}</td>
                  <td className="p-2">{a.userEmail}</td>
                  <td className="p-2">
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold
                      ${
                        a.status === "PENDING"
                          ? "bg-yellow-200 text-yellow-800"
                          : a.status === "CONFIRMED"
                          ? "bg-green-200 text-green-800"
                          : a.status === "REJECTED"
                          ? "bg-red-200 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-2">{a.note}</td>
                  <td className="p-2 flex gap-2">
                    <Button size="small" onClick={() => onDetail(a)}>
                      Chi tiết
                    </Button>
                    <Button size="small" onClick={() => onSuggest(a)}>
                      Đề xuất
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
export default AppointmentTable;
