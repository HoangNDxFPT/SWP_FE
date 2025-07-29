// consultant/components/AppointmentManagement.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Table,
  Button,
  Tag,
  message,
  Modal,
  Form,
  DatePicker,
  Empty,
  Spin,
  AutoComplete,
  Input,
  Row,
  Col,
  Select,
  Divider,
  Card,
} from "antd";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Video,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import api from "../../config/axios";
import AnimatedCard from "./AnimatedCard";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const { Option } = Select;

export default function AppointmentManagement({ onAppointmentCreated }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("PENDING");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);

  // ✅ States for member search
  const [allMembers, setAllMembers] = useState([]);
  const [searchOptions, setSearchOptions] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [consultantWorkDays, setConsultantWorkDays] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await api.put("/appointment/consultant/status", {
        appointmentId,
        status: newStatus,
      });
      message.success("Cập nhật trạng thái thành công!");
      fetchAppointments(currentStatus); // reload list
    } catch (error) {
      message.error(
        error.response?.data?.message || "Cập nhật trạng thái thất bại!"
      );
    }
  };

  // fetch tất cả members khi component mount
  useEffect(() => {
    fetchAllMembers();
  }, []);

  // ✅ Fetch appointments by status
  const fetchAppointments = async (status) => {
    setLoading(true);
    try {
      const response = await api.get("appointment/appointments/consultant", {
        params: { status },
      });
      setAppointments(response.data);
      console.log(
        `✅ Loaded ${response.data.length} appointments with status: ${status}`
      );
    } catch (error) {
      console.error("❌ Error fetching appointments:", error);
      message.error("Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch all members (only MEMBER role)
  const fetchAllMembers = async () => {
    setSearchLoading(true);
    try {
      const response = await api.get("consultant/all-profiles");
      const members = response.data.filter(
        (profile) => profile.role === "MEMBER"
      );
      setAllMembers(members);
      console.log(`✅ Loaded ${members.length} members`);
    } catch (error) {
      console.error("❌ Error fetching members:", error);
      message.error("Không thể tải danh sách thành viên");
    } finally {
      setSearchLoading(false);
    }
  };

  // ✅ Fetch consultant work days (from slot API)
  const fetchConsultantWorkDays = async () => {
    try {
      // Get consultant profile to get consultantId
      const consultantProfile = await api.get("/consultant/profile");
      const consultantId = consultantProfile.data.consultantId;

      const today = new Date();
      const workDays = [];

      // Check 3 months: previous, current, next
      for (let monthOffset = -1; monthOffset <= 1; monthOffset++) {
        const targetDate = new Date(
          today.getFullYear(),
          today.getMonth() + monthOffset,
          1
        );
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(year, month, d);
          const dateStr = dateObj.toISOString().slice(0, 10);

          try {
            const response = await api.get("/slot/registered", {
              params: { consultantId, date: dateStr },
            });

            if (response.data && response.data.length > 0) {
              workDays.push(dateStr);
            }
          } catch (error) {
            console.error("❌ Error fetching registered slots:", error);
            // Skip errors for individual days
          }
        }
      }

      setConsultantWorkDays(workDays);
      console.log(`✅ Found ${workDays.length} work days`);
    } catch (error) {
      console.error("❌ Error fetching work days:", error);
    }
  };

  // ✅ Handle search members with auto-complete
  const handleSearchMembers = (searchText) => {
    if (!searchText || searchText.length < 1) {
      setSearchOptions([]);
      return;
    }

    const filteredMembers = allMembers.filter(
      (member) =>
        member.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        member.email.toLowerCase().includes(searchText.toLowerCase()) ||
        member.phoneNumber.includes(searchText)
    );

    const options = filteredMembers.map((member) => ({
      value: member.id.toString(),
      label: (
        <div className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg transition-colors">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-800">{member.fullName}</div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail className="w-3 h-3" />
              {member.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="w-3 h-3" />
              {member.phoneNumber}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-3 h-3" />
              {member.address || "Chưa có địa chỉ"}
            </div>
          </div>
        </div>
      ),
      member: member,
    }));

    setSearchOptions(options);
  };

  // ✅ Handle select member
  const handleSelectMember = (value, option) => {
    const selectedMember = option.member;
    setSelectedMember(selectedMember);
    setSearchValue(selectedMember.fullName);
    // Auto-fill all information to form
    createForm.setFieldsValue({
      userId: selectedMember.id,
      customerName: selectedMember.fullName,
      customerEmail: selectedMember.email,
      customerPhone: selectedMember.phoneNumber,
      customerAddress: selectedMember.address || "",
    });

    console.log("✅ Selected member:", selectedMember);
    message.success(`Đã chọn khách hàng: ${selectedMember.fullName}`);
  };

  // ✅ Fetch available slots for selected date
  const fetchAvailableSlots = async (date) => {
    if (!date) return;

    try {
      const consultantProfile = await api.get("/consultant/profile");
      const consultantId = consultantProfile.data.consultantId;

      const response = await api.get("/slot/registered", {
        params: {
          consultantId,
          date: date.format("YYYY-MM-DD"),
        },
      });

      // Filter only available slots
      const availableSlots = response.data.filter((slot) => slot.available);
      setAvailableSlots(availableSlots);
      console.log(
        `✅ Found ${availableSlots.length} available slots for ${date.format(
          "YYYY-MM-DD"
        )}`
      );
    } catch (error) {
      console.error("❌ Error fetching slots:", error);
      setAvailableSlots([]);
      message.error("Không thể tải danh sách slot");
    }
  };

  useEffect(() => {
    if (!selectedMember) {
      setSearchValue("");
      setSearchOptions([]);
    }
  }, [selectedMember]);

  // ✅ Load data when component mounts and status changes
  useEffect(() => {
    fetchAppointments(currentStatus);
    fetchConsultantWorkDays();
  }, [currentStatus]);

  // ✅ Handle status change
  const handleStatusChange = (status) => {
    setCurrentStatus(status);
  };

  // ✅ Handle create appointment with correct API format
  const handleCreateAppointment = async (values) => {
    if (!selectedMember) {
      message.error("Vui lòng chọn khách hàng");
      return;
    }

    setCreateLoading(true);
    try {
      const appointmentData = {
        userId: selectedMember.id, // Use selected member's id
        slotId: values.slotId,
        appointmentDate: values.appointmentDate.format("YYYY-MM-DD"),
      };

      await api.post("appointment/consultant", appointmentData);
      message.success("Tạo lịch hẹn thành công!");
      toast.success("Tạo lịch hẹn thành công!");

      // Reset everything
      createForm.resetFields();
      setShowCreateModal(false);
      setSelectedDate(null);
      setAvailableSlots([]);
      setSelectedMember(null);
      setSearchOptions([]);

      // Refresh appointment list
      fetchAppointments(currentStatus);

      // Notify parent component
      if (onAppointmentCreated) {
        onAppointmentCreated();
      }
    } catch (error) {
      console.error("❌ Error creating appointment:", error);
      message.error(error.response?.data?.message || "Tạo lịch hẹn thất bại!");
      toast.error(error.response?.data?.message || "Tạo lịch hẹn thất bại!");
    } finally {
      setCreateLoading(false);
    }
  };

  // ✅ Handle date change in form
  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchAvailableSlots(date);
  };

  // ✅ Disable dates that are not in work days
  const disabledDate = (current) => {
    if (!current) return false;
    if (current < dayjs().startOf("day")) return true;
    const currentDateStr = current.format("YYYY-MM-DD");
    return !consultantWorkDays.includes(currentDateStr);
  };

  // ✅ Handle open create modal
  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    fetchConsultantWorkDays();
    createForm.resetFields();
    setSelectedDate(null);
    setAvailableSlots([]);
    setSelectedUser(null);
    setSearchOptions([]);
    setShowCreateModal(true);
    setSelectedMember(null);
    setSearchValue("");
  };

  // ✅ Table columns
  const columnsPending = [
    {
      title: () => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>Thông tin khách hàng</span>
        </div>
      ),
      key: "member",
      render: (record) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              {record.memberName}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="w-3 h-3" />
              {record.memberPhoneNumber}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail className="w-3 h-3" />
              {record.memberEmail}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: () => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          <span>Thời gian</span>
        </div>
      ),
      key: "datetime",
      render: (record) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
            <Clock className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              {dayjs(record.date).format("DD/MM/YYYY")}
            </div>
            <div className="text-sm text-gray-500">
              {record.startTime} - {record.endTime}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusConfig = {
          PENDING: { color: "orange", text: "Chờ xác nhận" },
          
          COMPLETED: { color: "green", text: "Hoàn thành" },
        };

        const config = statusConfig[status] || { color: "gray", text: status };

        return (
          <Tag color={config.color} className="px-3 py-1 rounded-full">
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (record) => {
        if (record.status !== "PENDING") return null;
        return (
          <div className="flex gap-2">
            
            <Button
              type="primary"
              onClick={() => updateAppointmentStatus(record.id, "COMPLETED")}
            >
              Hoàn thành
            </Button>
          </div>
        );
      },
    },
    {
      title: "Google Meet",
      dataIndex: "googleMeetLink",
      key: "googleMeetLink",
      render: (link) =>
        link ? (
          <Button
            type="link"
            icon={<Video className="w-4 h-4" />}
            href={link}
            target="_blank"
            className="p-0"
          >
            Tham gia
          </Button>
        ) : (
          <span className="text-gray-400">Chưa có</span>
        ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
  ];

  const columnsOther = [
    {
      title: () => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>Thông tin khách hàng</span>
        </div>
      ),
      key: "member",
      render: (record) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              {record.memberName}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="w-3 h-3" />
              {record.memberPhoneNumber}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail className="w-3 h-3" />
              {record.memberEmail}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: () => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          <span>Thời gian</span>
        </div>
      ),
      key: "datetime",
      render: (record) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
            <Clock className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              {dayjs(record.date).format("DD/MM/YYYY")}
            </div>
            <div className="text-sm text-gray-500">
              {record.startTime} - {record.endTime}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusConfig = {
          
          CANCELLED: { color: "red", text: "Đã hủy" },
          COMPLETED: { color: "green", text: "Hoàn thành" },
        };

        const config = statusConfig[status] || { color: "gray", text: status };

        return (
          <Tag color={config.color} className="px-3 py-1 rounded-full">
            {config.text}
          </Tag>
        );
      },
    },
    
    
    {
      title: "Ngày tạo",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
  ];

  // ✅ Status tabs
  const statusTabs = [
    { key: "PENDING", label: "Chờ xác nhận", color: "orange" },
    { key: "CANCELLED", label: "Đã hủy", color: "red" },
    { key: "COMPLETED", label: "Hoàn thành", color: "green" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            📅 Quản lý lịch hẹn
          </h2>
          <p className="text-gray-600">
            Tạo mới và quản lý các lịch hẹn với khách hàng
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleOpenCreateModal}
          className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Tạo lịch hẹn mới
        </Button>
      </motion.div>

      {/* Status Filter & Table */}
      <AnimatedCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {statusTabs.map((tab) => (
              <Button
                key={tab.key}
                type={currentStatus === tab.key ? "primary" : "default"}
                onClick={() => handleStatusChange(tab.key)}
                className={`${
                  currentStatus === tab.key
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 border-0"
                    : ""
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => fetchAppointments(currentStatus)}
            loading={loading}
          >
            Làm mới
          </Button>
        </div>

        <Spin spinning={loading}>
          {appointments.length === 0 ? (
            <Empty
              description={`Không có lịch hẹn nào ở trạng thái "${
                statusTabs.find((t) => t.key === currentStatus)?.label
              }"`}
              className="py-8"
            />
          ) : (
            <Table
              dataSource={appointments}
              columns={
                currentStatus === "PENDING" ? columnsPending : columnsOther
              }
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} lịch hẹn`,
              }}
              className="modern-table"
            />
          )}
        </Spin>
      </AnimatedCard>

      {/* ✅ Create Appointment Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold">Tạo lịch hẹn mới</div>
              <div className="text-sm text-gray-500 font-normal">
                Điền thông tin để tạo cuộc hẹn
              </div>
            </div>
          </div>
        }
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          createForm.resetFields();
          setSelectedDate(null);
          setAvailableSlots([]);
          setSelectedMember(null);
          setSearchOptions([]);
          setSearchValue("");
        }}
        footer={null}
        width={900}
        className="appointment-modal"
      >
        <Divider />

        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateAppointment}
          className="space-y-6"
        >
          {/* ✅ Customer Search Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">
                Tìm kiếm khách hàng
              </h3>
            </div>

            <AutoComplete
              value={searchValue}
              placeholder="🔍 Nhập tên, email hoặc số điện thoại để tìm kiếm khách hàng..."
              options={searchOptions}
              onSearch={handleSearchMembers}
              onSelect={handleSelectMember}
              onChange={(value) => setSearchValue(value)}
              className="w-full"
              size="large"
              loading={searchLoading}
              filterOption={false}
              dropdownClassName="customer-search-dropdown"
            />

            <div className="text-sm text-blue-600 mt-2">
              💡 Nhập ít nhất 1 ký tự để bắt đầu tìm kiếm
            </div>
          </Card>

          {/* ✅ Selected Member Indicator */}
          {selectedMember && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <div className="font-semibold text-green-800">
                    ✅ Đã chọn khách hàng: {selectedMember.fullName}
                  </div>
                  <div className="text-sm text-green-600">
                    Email: {selectedMember.email} | SĐT:{" "}
                    {selectedMember.phoneNumber}
                  </div>
                </div>
              </div>
              <Button
                type="text"
                shape="circle"
                size="small"
                onClick={() => {
                  setSelectedMember(null);
                  setSearchValue("");
                  createForm.resetFields([
                    "userId",
                    "customerName",
                    "customerEmail",
                    "customerPhone",
                    "customerAddress",
                  ]);
                  // Nếu muốn clear luôn thanh tìm kiếm:
                  setSearchOptions([]);
                }}
                icon={
                  <span
                    style={{
                      color: "#c53030",
                      fontWeight: "bold",
                      fontSize: 20,
                    }}
                  >
                    ×
                  </span>
                }
                style={{ marginLeft: 12 }}
                aria-label="Xóa khách hàng"
              />
            </motion.div>
          )}

          {/* ✅ Appointment Details */}
          <Card className="bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Chi tiết cuộc hẹn
            </h3>

            <Row gutter={[24, 16]}>
              <Col span={12}>
                <Form.Item
                  label="Ngày hẹn"
                  name="appointmentDate"
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày hẹn" },
                  ]}
                >
                  <DatePicker
                    placeholder="Chọn ngày hẹn"
                    className="w-full"
                    size="large"
                    format="DD/MM/YYYY"
                    disabledDate={disabledDate}
                    onChange={handleDateChange}
                  />
                </Form.Item>

                <div className="text-xs text-gray-500 mt-1">
                  💡 Chỉ có thể chọn những ngày đã đăng ký làm việc (
                  {consultantWorkDays.length} ngày)
                </div>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  label="Slot thời gian"
                  name="slotId"
                  rules={[
                    { required: true, message: "Vui lòng chọn slot thời gian" },
                  ]}
                >
                  <Select
                    placeholder={
                      !selectedDate
                        ? "Vui lòng chọn ngày trước"
                        : availableSlots.length === 0
                        ? "Không có slot nào khả dụng"
                        : "Chọn slot thời gian"
                    }
                    disabled={!selectedDate || availableSlots.length === 0}
                    size="large"
                    className="w-full"
                  >
                    {availableSlots.map((slot) => (
                      <Option key={slot.slotId} value={slot.slotId}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{slot.label}</span>
                          <span className="text-gray-500 text-sm">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {selectedDate && (
                  <div className="text-xs text-gray-500 mt-1">
                    📅 {availableSlots.length} slot khả dụng cho ngày{" "}
                    {selectedDate.format("DD/MM/YYYY")}
                  </div>
                )}
              </Col>
            </Row>
          </Card>

          {/* ✅ Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              size="large"
              onClick={() => setShowCreateModal(false)}
              disabled={createLoading}
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 px-8"
              disabled={
                !selectedMember || !selectedDate || availableSlots.length === 0
              }
              loading={createLoading}
            >
              Tạo lịch hẹn
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ✅ Custom Styles */}
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

        .modern-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }

        .appointment-modal .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
        }

        .appointment-modal .ant-modal-header {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-bottom: 1px solid #e2e8f0;
        }

        .customer-search-dropdown .ant-select-item {
          padding: 0 !important;
        }

        .customer-search-dropdown .ant-select-item:hover {
          background: #f0f9ff !important;
        }

        .member-search-dropdown .ant-select-item {
          padding: 0 !important;
        }

        .member-search-dropdown .ant-select-item:hover {
          background: #f0f9ff !important;
        }

        .ant-form-item-label > label {
          font-weight: 600;
        }

        .ant-input-affix-wrapper {
          border-radius: 8px;
        }

        .ant-select-selector {
          border-radius: 8px !important;
        }

        .ant-picker {
          border-radius: 8px;
        }

        .ant-card {
          border-radius: 12px;
        }

        .ant-card-body {
          padding: 20px;
        }

        /* ✅ Additional improvements */
        .ant-select-disabled {
          background: #f5f5f5;
          color: #999;
        }

        .ant-select-dropdown {
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .ant-btn-primary:disabled {
          background: #d1d5db;
          border-color: #d1d5db;
        }

        .ant-form-item-explain-error {
          color: #ef4444;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}
