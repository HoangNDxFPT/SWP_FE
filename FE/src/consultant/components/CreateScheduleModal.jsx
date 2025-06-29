import React from "react";
import { Modal, Form, InputNumber, DatePicker, TimePicker, Button, message, Switch } from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";

export default function CreateScheduleModal({ open, onCancel, onCreate, consultantId }) {
  const [form] = Form.useForm();

  const now = dayjs();

  const handleFinish = async (values) => {
    try {
      const body = {
        consultantId,
        workDate: values.workDate.format("YYYY-MM-DD"),
        startTime: {
          hour: values.startTime.hour(),
          minute: values.startTime.minute(),
          second: 0,
          nano: 0
        },
        endTime: {
          hour: values.endTime.hour(),
          minute: values.endTime.minute(),
          second: 0,
          nano: 0
        },
        isAvailable: values.isAvailable,
        maxAppointments: values.maxAppointments
      };
      await onCreate(body);
      toast.success("Đăng ký lịch làm việc thành công!");
      form.resetFields();
    } catch (error) {
      message.error("Đăng ký lịch làm việc thất bại!");
      console.error("Error creating schedule:", error);
      toast.error("Đăng ký lịch làm việc thất bại!");
    }
  };

  return (
    <Modal
      title="Đăng ký lịch làm việc"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          workDate: now,
          startTime: now.startOf("hour"),
          endTime: now.add(1, "hour").startOf("hour"),
          maxAppointments: 1,
          isAvailable: true
        }}
      >
        <Form.Item
          label="Ngày làm việc"
          name="workDate"
          rules={[{ required: true, message: "Chọn ngày làm việc!" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Bắt đầu"
          name="startTime"
          rules={[{ required: true, message: "Chọn giờ bắt đầu!" }]}
        >
          <TimePicker format="HH:mm" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Kết thúc"
          name="endTime"
          rules={[{ required: true, message: "Chọn giờ kết thúc!" }]}
        >
          <TimePicker format="HH:mm" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Số ca tối đa"
          name="maxAppointments"
          rules={[{ required: true, message: "Nhập số ca!" }]}
        >
          <InputNumber min={1} max={50} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Có sẵn" name="isAvailable" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Button type="primary" htmlType="submit" className="w-full">
          Đăng ký
        </Button>
      </Form>
    </Modal>
  );
}
