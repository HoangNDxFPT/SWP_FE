import React from 'react'
import { Button, Checkbox, Form, Input } from 'antd';
import { toast } from 'react-toastify';
import api from '../../config/axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/features/userSlice';

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const onFinish = async (values) => {
    try {
      const response = await api.post("login", values);
      dispatch(login(response.data));
      localStorage.setItem("token", response.data.token);
      navigate("/dashboard");
      toast.success("Login successful", { autoClose: 2000 });
    } catch (e) {
      const status = e.response?.status;
      const message = e.response?.data?.message || "Đăng nhập thất bại!";
      toast.error(`Lỗi ${status || ''}: ${message}`);
    }
  };
  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">Đăng nhập</h1>
        <Form
          name="basic"
          layout='vertical'
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label={<span className="font-semibold">Tên đăng nhập</span>}
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên người dùng!' }]}
          >
            <Input
              className="py-1 text-sm"
              placeholder="Nhập tên người dùng (ví dụ: testuser)"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-semibold">Mật khẩu</span>}
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              className="py-1 text-sm"
              placeholder="Nhập mật khẩu (ví dụ: password123)"
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" label={null}>
            <Checkbox>Ghi nhớ tôi</Checkbox>
          </Form.Item>

          <Form.Item label={null}>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-10"
              style={{ boxShadow: 'none', border: 'none' }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default LoginPage;
