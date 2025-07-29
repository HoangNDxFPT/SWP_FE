import React, { useState } from 'react';
import { Button, Form, Input } from 'antd';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import api from '../../config/axios';

function ForgotPassword() {
  // Thêm state để kiểm soát hiển thị thông báo
  const [success, setSuccess] = useState(false);

  const onFinish = async (values) => {
    try {
      await api.post("/forgot-password", { email: values.email });
      setSuccess(true);
      toast.success("Hãy kiểm tra email của bạn!");
    } catch (e) {
      const statusCode = e.response?.status;
      let errorMessage = e.response?.data?.message || e.message || "Gửi yêu cầu thất bại!";
      // Nếu là lỗi 401 hoặc 404 thì báo rõ cho người dùng
      if (statusCode === 401 || statusCode === 404) {
        errorMessage = "Email này không tồn tại trong hệ thống!";
      }
      toast.error(` ${errorMessage}`);
    }
  };

  const onFinishFailed = () => {
    toast.error("Vui lòng kiểm tra lại thông tin nhập liệu!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">Quên mật khẩu</h1>
        {success ? (
          <div className="text-green-600 text-center text-lg font-semibold py-8">
            Hãy kiểm tra email của bạn để đặt lại mật khẩu.
          </div>
        ) : (
          <Form
            name="forgotPasswordForm"
            layout='vertical'
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            className="space-y-4"
          >
            <Form.Item
              label={<span className="font-semibold text-gray-700">Email</span>}
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nhập email của bạn" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-10 transition duration-200 ease-in-out"
                style={{ boxShadow: 'none', border: 'none' }}
              >
                Gửi yêu cầu
              </Button>
            </Form.Item>
            <Form.Item className="text-center">
              <Link to="/login" className="text-blue-500 hover:underline">Quay lại đăng nhập</Link>
            </Form.Item>
          </Form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
