import React from "react";
import { Button, Checkbox, Form, Input } from "antd";
import { toast } from "react-toastify";
import api from "../../config/axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../redux/features/userSlice";

/**
 * Component LoginPage hoàn chỉnh, xử lý logic và giao diện người dùng cho trang đăng nhập.
 */
function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      const response = await api.post("login", values);

      dispatch(login(response.data));

      // Lưu thông tin user vào localStorage với key "user"
      if (response.data) {
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        } else {
          localStorage.setItem("user", JSON.stringify(response.data));
        }
      }

      // Lưu token và các thông tin khác
      if (response.data && response.data.token) {
        const newToken = response.data.token;
        localStorage.setItem("token", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      }
      if (response.data.role) {
        localStorage.setItem("role", response.data.role);
      }
      if (response.data.fullName) {
        localStorage.setItem("full_name", response.data.fullName);
      }

      toast.success("Đăng nhập thành công!", { autoClose: 2000 });

      // Điều hướng theo role (ưu tiên role là chuỗi "ADMIN", fallback role_id === 1)
      const user = response.data.user || response.data;
      if (user.role === "ADMIN" || user.role_id === 1) {
        navigate("/admin");
      } else if (user.role === "CONSULTANT") {
        navigate("/consultant/dashboard");
      } else {
        navigate("/");
      }
    } catch (e) {
      console.error("Lỗi đăng nhập:", e.response ? e.response.data : e.message);
      const errorMessage =
        e.response?.data?.message || e.message || "Đăng nhập thất bại!";
      const statusCode = e.response?.status;
      toast.error(`Lỗi ${statusCode ? statusCode + ": " : ""}${errorMessage}`);
    }
  };

  const onFinishFailed = (errorInfo) => {
    toast.error("Vui lòng kiểm tra lại thông tin nhập liệu!");
    console.log(errorInfo);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">
          Đăng nhập
        </h1>
        <Form
          name="loginForm"
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          className="space-y-4"
        >
          <Form.Item
            label={
              <span className="font-semibold text-gray-700">Tên đăng nhập</span>
            }
            name="userName"
            rules={[
              { required: true, message: "Vui lòng nhập tên người dùng!" },
            ]}
          >
            <Input
              className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nhập tên người dùng của bạn"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-semibold text-gray-700">Mật khẩu</span>
            }
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password
              className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nhập mật khẩu của bạn"
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" className="mb-4">
            <Checkbox className="text-gray-700">Ghi nhớ tôi</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-10 transition duration-200 ease-in-out"
              style={{ boxShadow: "none", border: "none" }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

/**
 * Component RequireAdmin để bảo vệ các route chỉ cho phép admin truy cập.
 * Nếu người dùng không phải là admin, họ sẽ bị chuyển hướng đến trang đăng nhập.
 */
export function RequireAdmin({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user || !(user.role === "ADMIN" || user.role_id === 1)) {
    return <LoginPage />;
  }
  return children;
}

export default LoginPage;
