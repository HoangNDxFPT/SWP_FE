import React, { useEffect, useState, useMemo } from "react";
import ConsultantHeader from "../components/Header";
import Footer from "../components/Footer";
import MiniStats from "../components/MiniStats";
import AppointmentTable from "../components/AppointmentTable";
import AppointmentDetailModal from "../components/AppointmentDetailModal";
import SuggestionModal from "../components/SuggestionModal";
import ConsultationCaseTable from "../components/ConsultationCaseTable";
import api from "../../config/axios";
import { Button, Tabs, message } from "antd";
import CreateAppointmentModal from "../components/CreateAppointmentModal";

function AppointmentList() {
  // State chính
  const [appointments, setAppointments] = useState([]);
  const [cases, setCases] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);

  // Modal state (KHÔNG còn showCreate nữa)
  const [showDetail, setShowDetail] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Item đang chọn
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Lấy dữ liệu từ API
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/consultant/appointments").catch(() => ({ data: [] })), // Lấy lịch hẹn
      api.get("/consultant/all-profiles").catch(() => ({ data: [] })),
      api.get("/consultant/cases").catch(() => ({ data: [] })),
    ]).then(([appointmentsRes, profilesRes, casesRes]) => {
      setAppointments(
        appointmentsRes.data.map((item) => ({
          ...item,
          userId: item.id, // id là user_id (THEO API MỚI)
          date: item.appointmentTime ? item.appointmentTime.split("T")[0] : "",
          time: item.appointmentTime
            ? item.appointmentTime.split("T")[1]?.slice(0, 5)
            : "",
        }))
      );
      setMembers(profilesRes.data.filter((p) => p.role === "MEMBER")); // lọc "MEMBER"
      setCases(casesRes.data);
      setLoading(false);
    });
  }, []);

  // Đếm số trạng thái
  const miniStats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => a.status === "PENDING").length;
    const confirmed = appointments.filter(
      (a) => a.status === "CONFIRMED"
    ).length;
    const completed = appointments.filter(
      (a) => a.status === "COMPLETED"
    ).length;
    const rejected = appointments.filter((a) => a.status === "REJECTED").length;
    return { total, pending, confirmed, completed, rejected };
  }, [appointments]);

  // Cập nhật trạng thái/note
  const handleUpdateAppointment = async (id, { status, note }) => {
    try {
      if (status) {
        await api.put(`/consultant/appointments/${id}/status`, { status });
      }
      if (note !== undefined) {
        await api.put(`/consultant/appointments/${id}/note`, { note });
      }
      // Refetch lại danh sách lịch hẹn
      const res = await api.get("/consultant/appointments");
      setAppointments(
        res.data.map((item) => ({
          ...item,
          userId: item.id,
          date: item.appointmentTime ? item.appointmentTime.split("T")[0] : "",
          time: item.appointmentTime
            ? item.appointmentTime.split("T")[1]?.slice(0, 5)
            : "",
        }))
      );
      setShowDetail(false);
      message.success("Cập nhật thành công!");
    } catch (e) {
      console.error("Lỗi cập nhật:", e);
      message.error("Cập nhật thất bại!");
    }
  };

  // Gửi đề xuất
  const handleSendSuggestion = async (userId, suggestion) => {
    try {
      await api.post(`/consultant/user/${userId}/suggestion`, { suggestion });
      setShowSuggestion(false);
      message.success("Đã gửi đề xuất!");
    } catch (error) {
      message.error("Gửi đề xuất thất bại!");
      if (error.response) {
        console.error("Lỗi API (response):", error.response.data);
      } else {
        console.error("Lỗi gửi đề xuất:", error);
      }
    }
  };
  const handleCreateAppointment = async (body) => {
    try {
      await api.post("/consultant/appointments", body);
      message.success("Tạo lịch hẹn thành công!");
      setShowCreate(false);
      // Refetch lại danh sách lịch hẹn
      const res = await api.get("/consultant/appointments");
      setAppointments(
        res.data.map((item) => ({
          ...item,
          userId: item.id,
          date: item.appointmentTime ? item.appointmentTime.split("T")[0] : "",
          time: item.appointmentTime
            ? item.appointmentTime.split("T")[1]?.slice(0, 5)
            : "",
        }))
      );
    } catch (error) {
      message.error("Tạo lịch hẹn thất bại!");
      console.error(error);
    }
  };

  return (
    <>
      <ConsultantHeader />
      <div className="max-w-7xl mx-auto py-10">
        <MiniStats stats={miniStats} />
        <Tabs
          defaultActiveKey="appointments"
          items={[
            {
              key: "appointments",
              label: "Lịch hẹn",
              children: (
                <>
                  <AppointmentTable
                    appointments={appointments}
                    members={members}
                    loading={loading}
                    onCreate={() => setShowCreate(true)}
                    // ĐÃ XÓA props tạo mới, chỉ giữ detail/suggest
                    onDetail={(app) => {
                      setSelectedAppointment(app);
                      setShowDetail(true);
                    }}
                    onSuggest={(app) => {
                      setSelectedAppointment(app);
                      setShowSuggestion(true);
                    }}
                  />
                  <AppointmentDetailModal
                    open={showDetail}
                    onCancel={() => setShowDetail(false)}
                    appointment={selectedAppointment}
                    onUpdate={handleUpdateAppointment}
                  />
                  <SuggestionModal
                    open={showSuggestion}
                    onCancel={() => setShowSuggestion(false)}
                    appointment={selectedAppointment}
                    onSend={handleSendSuggestion}
                  />
                  
                  <CreateAppointmentModal
                    open={showCreate}
                    onCancel={() => setShowCreate(false)}
                    members={members}
                    onCreate={handleCreateAppointment}
                  />
                </>
              ),
            },
            {
              key: "cases",
              label: "Hồ sơ tư vấn",
              children: (
                <ConsultationCaseTable cases={cases} loading={loading} />
              ),
            },
          ]}
          className="mb-6"
        />
      </div>
      <Footer />
    </>
  );
}

export default AppointmentList;
