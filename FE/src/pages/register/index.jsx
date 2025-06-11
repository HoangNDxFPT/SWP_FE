import React from 'react';
import { toast } from 'react-toastify';
import api from '../../config/axios';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox } from 'antd';

function RegisterPage() {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const {...data } = values;

    if (data.dateOfBirth instanceof Date) {
      data.dateOfBirth = data.dateOfBirth.toISOString().slice(0, 10);
    }

    try {
      await api.post("register", data);
      toast.success("Tạo tài khoản mới thành công!");
      navigate("/login");
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || "Đăng ký thất bại!";
      toast.error(`Lỗi: ${errorMessage}`);
    }
  };

  const onFinishFailed = () => {
    toast.error("Vui lòng kiểm tra lại thông tin nhập liệu!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">Đăng ký</h1>
        <Form
          name="registerForm"
          layout='vertical'
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          className="space-y-4"
        >
          <Form.Item
            label="Tên đăng nhập"
            name="userName"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              { min: 4, max: 20, message: 'Tên đăng nhập từ 4 đến 20 ký tự!' },
              { pattern: /^\S+$/, message: 'Tên đăng nhập không được chứa khoảng trắng!' }
            ]}
          >
            <Input className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Tên đăng nhập" />
          </Form.Item>

          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên!' },
              { max: 100, message: 'Họ tên tối đa 100 ký tự!' },
              { pattern: /^[a-zA-ZÀ-ỹ\s]+$/, message: 'Họ tên chỉ chứa chữ cái và khoảng trắng!' }
            ]}
          >
            <Input className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }
            ]}
            hasFeedback
          >
            <Input.Password className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Mật khẩu xác nhận không trùng khớp!');
                },
              }),
            ]}
          >
            <Input.Password className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nhập lại mật khẩu" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phoneNumber"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^(0[3|5|7|8|9])[0-9]{8}$/, message: 'Số điện thoại không hợp lệ!' }
            ]}
          >
            <Input className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[
              { max: 100, message: 'Địa chỉ tối đa 100 ký tự!' }
            ]}
          >
            <Input className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nhập địa chỉ" />
          </Form.Item>

          <Form.Item
            label="Ngày sinh"
            name="dateOfBirth"
            rules={[
              { required: true, message: 'Vui lòng chọn ngày sinh!' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const today = new Date();
                  const dob = new Date(value);
                  if (dob < today) return Promise.resolve();
                  return Promise.reject('Ngày sinh phải là ngày trong quá khứ!');
                }
              }
            ]}
          >
            <Input type="date" className="py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </Form.Item>

          <Form.Item
            label="Giới tính"
            name="gender"
            rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
          >
            <select className="w-full py-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" style={{ height: 42 }}>
              <option value="">Chọn giới tính</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </select>
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox className="text-gray-700">Ghi nhớ tôi</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-10 transition duration-200 ease-in-out"
              style={{ boxShadow: 'none', border: 'none' }}
            >
              Đăng ký
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default RegisterPage;
