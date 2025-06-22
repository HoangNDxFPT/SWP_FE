import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';

function AppointmentDetailModal({ open, onCancel, appointment, onUpdate }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (appointment && open) {
      form.setFieldsValue({
        status: appointment.status,
        note: appointment.note,
      });
    }
    if (!open) {
      form.resetFields();
    }
  }, [appointment, form, open]);

  const handleOk = async () => {
    const status = form.getFieldValue('status');
    const note = form.getFieldValue('note');
    onUpdate(appointment?.id, {
      status,
      note,
      userId: appointment?.userId,
    });
  };

  return (
    <Modal
      title="Chi tiết lịch hẹn"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Cập nhật"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Họ tên">
          <Input value={appointment?.userFullName || ""} disabled />
        </Form.Item>
        <Form.Item label="Email">
          <Input value={appointment?.userEmail || ""} disabled />
        </Form.Item>
        <Form.Item label="Số điện thoại">
          <Input value={appointment?.userPhone || ""} disabled />
        </Form.Item>
        <Form.Item label="Thời gian">
          <Input value={appointment ? (appointment.date + ' ' + appointment.time) : ""} disabled />
        </Form.Item>
        <Form.Item label="Trạng thái" name="status">
          <Select>
            <Select.Option value="PENDING">Chờ xác nhận</Select.Option>
            <Select.Option value="CONFIRMED">Đã xác nhận</Select.Option>
            <Select.Option value="COMPLETED">Hoàn thành</Select.Option>
            <Select.Option value="REJECTED">Bị từ chối</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AppointmentDetailModal;
