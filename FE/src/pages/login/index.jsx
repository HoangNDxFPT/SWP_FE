import React from "react";
import { Form, Input, Button, Checkbox } from "antd";
import { toast } from "react-toastify";
import api from "../../config/axios";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

function LoginPage() {
  const navigate = useNavigate();
  const clientId = "YOUR_GOOGLE_CLIENT_ID"; // Replace with your actual Client ID

  const onFinish = async (values) => {
    try {
      const response = await api.post("/api/login", values);
      const user = response.data;
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("Đăng nhập thành công!");
      navigate("/");
    } catch (error) {
      toast.error("Đăng nhập thất bại!", error);
    }
  };

  const onGoogleLoginSuccess = async (response) => {
    try {
      const res = await api.post("/api/google-login", { token: response.credential });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      toast.success("Đăng nhập bằng Google thành công!");
      navigate("/");
    } catch (error) {
      toast.error("Đăng nhập bằng Google thất bại!", error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Đăng nhập</h2>
          <Form name="login" initialValues={{ remember: true }} onFinish={onFinish}>
            <Form.Item name="email" rules={[{ required: true, message: "Vui lòng nhập email!" }]}>
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}>
              <Input.Password placeholder="Mật khẩu" />
            </Form.Item>
            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>Ghi nhớ tôi</Checkbox>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>Đăng nhập</Button>
            </Form.Item>
          </Form>
          <div className="text-center my-4 text-gray-500">Hoặc</div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={onGoogleLoginSuccess}
              onError={() => toast.error("Lỗi đăng nhập Google!")}
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default LoginPage;

