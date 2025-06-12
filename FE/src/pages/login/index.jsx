import React from 'react';
import { Button, Checkbox, Form, Input } from 'antd';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/features/userSlice';
import api from '../../config/axios';

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      const response = await api.post("login", values);
      dispatch(login(response.data));

      if (response.data?.token) {
        const newToken = response.data.token;
        localStorage.setItem("token", newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      }

      toast.success("Đăng nhập thành công!", { autoClose: 2000 });
      navigate("/");
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || "Đăng nhập thất bại!";
      const statusCode = e.response?.status;
      toast.error(`Lỗi ${statusCode ? statusCode + ': ' : ''}${errorMessage}`);
    }
  };

  const onFinishFailed = () => {
    toast.error("Vui lòng kiểm tra lại thông tin nhập liệu!");
  };

  const handleGoogleRegister = () => {
    // URL backend xử lý OAuth Google, chỉnh theo backend của bạn
    const googleRegisterURL = `${api.defaults.baseURL}register/google`;
    window.location.href = googleRegisterURL;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">Đăng nhập</h1>
        <Form
          name="loginForm"
          layout='vertical'
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          className="space-y-4"
        >
          <Form.Item
            label={<span className="font-semibold text-gray-700">Tên đăng nhập</span>}
            name="userName"
            rules={[{ required: true, message: 'Vui lòng nhập tên người dùng!' }]}
          >
            <Input className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nhập tên người dùng của bạn" />
          </Form.Item>

          <Form.Item
            label={<span className="font-semibold text-gray-700">Mật khẩu</span>}
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nhập mật khẩu của bạn" />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" className="mb-4">
            <Checkbox className="text-gray-700">Ghi nhớ tôi</Checkbox>
            <a
              href="/forgot-password"
              className="float-right text-blue-500 hover:underline text-sm"
              style={{ lineHeight: "32px" }}
            >
              Quên mật khẩu?
            </a>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-10 transition duration-200 ease-in-out"
              style={{ boxShadow: 'none', border: 'none' }}
            >
              Đăng nhập
            </Button>
          </Form.Item>

          <Form.Item className="text-center">
            <p className="text-sm text-gray-600">
              Bạn chưa có tài khoản?{' '}
              <a href="/register" className="text-blue-500 hover:underline">
                Đăng ký
              </a>
            </p>
          </Form.Item>

          <Form.Item>
            <Button
              className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 hover:bg-gray-100"
              onClick={handleGoogleRegister}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Đăng ký nhanh với Google</span>
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default LoginPage;
