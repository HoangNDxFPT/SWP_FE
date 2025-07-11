import React, { useState } from "react";
import { Form, Input, Checkbox, Button } from "antd";
import { toast } from "react-toastify";
import api from "../../config/axios";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../redux/features/userSlice";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const clientId = "YOUR_GOOGLE_CLIENT_ID"; // Replace with actual Client ID

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await api.post("login", values);

      let userData = response.data.user || response.data;
      // Nếu không có id, cố gắng lấy từ trường khác
      if (!userData.id && userData.userId) {
        userData.id = userData.userId;
      }
      dispatch(login(userData));
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", response.data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;

      toast.success("Đăng nhập thành công!", { autoClose: 2000 });

      if (response.data.role === "ADMIN") {
        navigate("/admin");
      } else if (response.data.role === "CONSULTANT") {
        navigate("/consultant/dashboard");
      } else {
        navigate("/");
      }
    } catch (e) {
      toast.error(`Lỗi đăng nhập: ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLoginSuccess = async (response) => {
    try {
      setLoading(true);
      const res = await api.post("/api/google-login", {
        token: response.credential,
      });

      dispatch(login(res.data));
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

      toast.success("Đăng nhập bằng Google thành công!", { autoClose: 2000 });

      navigate("/");
    } catch (e) {
      toast.error("Đăng nhập bằng Google thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-indigo-100">
        {/* Main content */}
        <div className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="grid md:grid-cols-5 w-full max-w-6xl gap-8">
            {/* Left column - Image and intro */}
            <div className="hidden md:flex md:col-span-2 flex-col justify-center p-8 bg-blue-600 text-white rounded-l-2xl">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Xin chào</h1>
                <p className="text-lg opacity-90">
                  Đăng nhập để kết nối với chúng tôi và nhận sự hỗ trợ bạn
                  cần.
                </p>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-transparent opacity-0"></div>
                  <img
                    src="/assets/counseling-illustration.svg"
                    alt="Counseling Illustration"
                    className="w-full"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://res.cloudinary.com/dwjtg28ti/image/upload/v1748824738/z6621531660497_00c45b7532add5b3a49055fb93d63a53_ewd8xj.jpg";
                    }}
                  />
                </div>
                <div className="space-y-3">
                  <p className="font-medium">Lợi ích của việc đăng nhập:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Đặt lịch hẹn với chuyên gia
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Tham gia các khóa học
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Các chương trình hỗ trợ sức khỏe tinh thần
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right column - Login form */}
            <div className="md:col-span-3 bg-white p-8 md:p-12 rounded-2xl md:rounded-l-none shadow-xl">
              <div className="max-w-md mx-auto">
                <div className="text-center md:text-left mb-8">
                  <h2 className="text-3xl font-bold text-gray-800">Đăng nhập</h2>
                  <p className="mt-2 text-gray-600">
                    Đăng nhập để tiếp tục hành trình chăm sóc sức khỏe tinh thần
                    của bạn
                  </p>
                </div>

                <Form
                  name="loginForm"
                  layout="vertical"
                  onFinish={onFinish}
                  autoComplete="off"
                  size="large"
                >
                  <Form.Item
                    name="userName"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên đăng nhập!" },
                    ]}
                  >
                    <Input
                      prefix={
                        <UserOutlined className="site-form-item-icon text-gray-400" />
                      }
                      placeholder="Tên đăng nhập"
                      className="rounded-lg py-2.5"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
                  >
                    <Input.Password
                      prefix={
                        <LockOutlined className="site-form-item-icon text-gray-400" />
                      }
                      placeholder="Mật khẩu"
                      className="rounded-lg py-2.5"
                      iconRender={(visible) =>
                        visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                      }
                    />
                  </Form.Item>

                  <Form.Item>
                    <div className="flex items-center justify-between">
                      <Form.Item name="remember" valuePropName="checked" noStyle>
                        <Checkbox>Ghi nhớ tôi</Checkbox>
                      </Form.Item>
                      <Link
                        to="/forgot-password"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      className="h-12 rounded-lg bg-blue-600 hover:bg-blue-700 border-blue-600"
                    >
                      Đăng nhập
                    </Button>
                  </Form.Item>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-gray-500">
                        Hoặc tiếp tục với
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <GoogleLogin
                      onSuccess={onGoogleLoginSuccess}
                      onError={() => toast.error("Lỗi đăng nhập Google!")}
                      theme="outline"
                      size="large"
                      width="100%"
                      text="signin_with"
                      shape="rectangular"
                      logo_alignment="left"
                      locale="vi"
                    />
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-gray-600">
                      Chưa có tài khoản?{" "}
                      <Link
                        to="/register"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Đăng ký ngay
                      </Link>
                    </p>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>     
      </div>
    </GoogleOAuthProvider>
  );
}

export default LoginPage;

