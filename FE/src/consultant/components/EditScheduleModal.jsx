import React, { useEffect } from "react";
import { Modal, Form, InputNumber, DatePicker, TimePicker, Button, Switch, message } from "antd";
import dayjs from "dayjs";

export default function EditScheduleModal({ open, onCancel, onEdit, schedule }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (schedule && open) {
      form.setFieldsValue({
        workDate: dayjs(schedule.workDate),
        startTime: dayjs().hour(schedule.startTime.hour).minute(schedule.startTime.minute),
        endTime: dayjs().hour(schedule.endTime.hour).minute(schedule.endTime.minute),
        maxAppointments: schedule.maxAppointments,
        isAvailable: schedule.isAvailable,
      });
    }
    if (!open) form.resetFields();
  }, [schedule, open, form]);

  const handleFinish = async (values) => {
    try {
      const body = {
        consultantId: schedule.consultantId,
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
      await onEdit(schedule.scheduleId, body);
      form.resetFields();
    } catch (error) {
      message.error("Cập nhật lịch làm việc thất bại!");
      console.error("Error updating schedule:", error);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa lịch làm việc"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Ngày làm việc" name="workDate" rules={[{ required: true }]}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Bắt đầu" name="startTime" rules={[{ required: true }]}>
          <TimePicker format="HH:mm" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Kết thúc" name="endTime" rules={[{ required: true }]}>
          <TimePicker format="HH:mm" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Số ca tối đa" name="maxAppointments" rules={[{ required: true }]}>
          <InputNumber min={1} max={50} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Có sẵn" name="isAvailable" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Button type="primary" htmlType="submit" className="w-full">Lưu</Button>
      </Form>
    </Modal>
  );
}
