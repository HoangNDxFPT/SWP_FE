import React from 'react';
import { Form, Input, Button } from 'antd';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../config/axios';

function EnterNewPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy token từ query string
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    try {
      await api.post('http://localhost:8080/api/reset-password', {
        token,
        newPassword: values.password,
      });
      toast.success("Đặt lại mật khẩu thành công!");
      navigate("/login");
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || "Đặt lại mật khẩu thất bại!";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-8 text-gray-800 text-center">Đặt lại mật khẩu</h1>
        <Form
          name="resetPasswordForm"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Mật khẩu mới"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
            hasFeedback
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>
          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-10"
              style={{ boxShadow: 'none', border: 'none' }}
            >
              Đặt lại mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default EnterNewPassword;