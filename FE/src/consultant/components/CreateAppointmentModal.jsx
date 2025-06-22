import {
  AutoComplete,
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  TimePicker,
} from "antd";
import dayjs from "dayjs";
import React from "react";

function CreateAppointmentModal({ open, onCancel, members, onCreate }) {
  const [form] = Form.useForm();
  const [memberOptions, setMemberOptions] = React.useState([]);
  const [selectedMember, setSelectedMember] = React.useState(null);

  //tim kiem danh sach members
  const handleSearch = (value) => {
    if (!value) {
      setMemberOptions([]);
      return;
    }

    setMemberOptions(
      members
        .filter(
          (m) =>
            m.fullName && m.fullName.toLowerCase().includes(value.toLowerCase())
        )
        .map((m) => ({
          key: m.id,
          value: String(m.id),
          label: (
            <span>
              <b>{m.fullName}</b> | {m.phoneNumber}| {m.email}
            </span>
          ),
          member: m,
        }))
    );
  };

  const handleSelect = (value, option) => {
    const member = members.find((m) => String(m.id) === value);
    setSelectedMember(member);
    form.setFieldsValue({
      userFullName: member?.fullName || "",
      userPhone: member?.phoneNumber || "",
      userEmail: member?.email || "",
    });
  };

  const handleFinish = async (values) => {
    try {
      if (!selectedMember || !selectedMember.id) {
        message.error("Bạn phải chọn khách hàng từ bảng gợi ý!");
        return;
      }
      const appointmentTime = dayjs(
        values.date.format("YYYY-MM-DD") + "T" + values.time.format("HH:mm")
      ).toISOString();
      const body = {
        userId: selectedMember.id,
        fullName: selectedMember.fullName,
        appointmentTime,
        note: values.note || "",
      };
      await onCreate(body);
      form.resetFields();
      setMemberOptions([]);
      setSelectedMember(null);
    } catch (error) {
      message.error("Tạo lịch hẹn thất bại!");
      console.error(error);
    }
  };

  const now = dayjs();

  return (
    <Modal
      title="Tạo lịch hẹn mới"
      open={open}
      onCancel={() => {
        form.resetFields();
        setMemberOptions([]);
        setSelectedMember(null);
        onCancel();
      }}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          date: now,
          time: now,
        }}
      >
        <Form.Item
          label="Tên khách hàng"
          name="userFullName"
          rules={[{ required: true, message: "Chọn khách hàng!" }]}
        >
          <AutoComplete
            options={memberOptions}
            onSearch={handleSearch}
            onSelect={handleSelect}
            placeholder="Nhập tên khách hàng"
            filterOption={false}
            style={{ width: "100%" }}
            optionLabelProp="label"
          />
        </Form.Item>
        <Form.Item label="Email" name="userEmail">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Số điện thoại" name="userPhone">
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Ngày"
          name="date"
          rules={[{ required: true, message: "Chọn ngày!" }]}
        >
          <DatePicker
            format="YYYY-MM-DD"
            style={{ width: "100%" }}
            allowClear={false}
          />
        </Form.Item>
        <Form.Item
          label="Giờ"
          name="time"
          rules={[{ required: true, message: "Chọn giờ!" }]}
        >
          <TimePicker
            format="HH:mm"
            style={{ width: "100%" }}
            allowClear={false}
          />
        </Form.Item>
        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea />
        </Form.Item>
        <Button type="primary" htmlType="submit" className="w-full">
          Tạo mới
        </Button>
      </Form>
    </Modal>
  );
}

export default CreateAppointmentModal;
