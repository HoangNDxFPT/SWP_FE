import React from "react";
import { Button, Checkbox, Form, Input } from "antd";
import { toast } from "react-toastify";
import api from "../../config/axios";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../redux/features/userSlice";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const clientId = "YOUR_GOOGLE_CLIENT_ID"; // Replace with actual Client ID

  const onFinish = async (values) => {
    try {
      const response = await api.post("login", values);
      dispatch(login(response.data));

      localStorage.setItem("user", JSON.stringify(response.data.user || response.data));
      localStorage.setItem("token", response.data.token || response.data.accessToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;

      toast.success("Đăng nhập thành công!", { autoClose: 2000 });

      navigate(response.data.role === "ADMIN" ? "/admin" : "/");
    } catch (e) {
      toast.error(`Lỗi đăng nhập: ${e.response?.data?.message || e.message}`);
    }
  };

  const onGoogleLoginSuccess = async (response) => {
    try {
      const res = await api.post("/api/google-login", { token: response.credential });

      dispatch(login(res.data));
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

      toast.success("Đăng nhập bằng Google thành công!", { autoClose: 2000 });

      navigate("/dashboard");
    } catch (e) {
      toast.error("Đăng nhập bằng Google thất bại!", e);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">Đăng nhập</h1>
          <Form name="loginForm" layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item name="userName" rules={[{ required: true, message: "Vui lòng nhập tên!" }]}>
              <Input placeholder="Tên đăng nhập" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}>
              <Input.Password placeholder="Mật khẩu" />
            </Form.Item>
            <Form.Item name="remember" valuePropName="checked">
              <div className="flex justify-between items-center">
                <Checkbox>Ghi nhớ tôi</Checkbox>
                <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">
                  Quên mật khẩu?
                </Link>
              </div>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>Đăng nhập</Button>
            </Form.Item>
          </Form>

          {/* Thêm phần đăng ký mới */}
          <div className="text-center mt-4 mb-6">
            <span className="text-gray-600">Chưa có tài khoản? </span>
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Đăng ký ngay
            </Link>
          </div>

          <div className="text-center my-4 text-gray-500">Hoặc</div>
          <GoogleLogin onSuccess={onGoogleLoginSuccess} onError={() => toast.error("Lỗi đăng nhập Google!")} />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default LoginPage;