import React from 'react';
import { Button, Checkbox, Form, Input } from 'antd';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function RegisterForm() {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    // Loại bỏ trường confirm và remember, chuẩn hóa dateOfBirth
    const {...data } = values;
    if (data.dateOfBirth instanceof Date) {
      data.dateOfBirth = data.dateOfBirth.toISOString().slice(0, 10);
    }
    try {
      await api.post("register", data);
      toast.success("Successfully created new account");
      navigate("/login");
    } catch (e) {
      console.log(e);
      toast.error(e.response?.data?.message || "Đăng ký thất bại!");
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div className="register_form">
      <h1>Register</h1>
      <Form
        name="register"
        layout='vertical'
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[
            { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
            { min: 4, max: 20, message: 'Tên đăng nhập từ 4 đến 20 ký tự!' },
            {
              pattern: /^\S+$/,
              message: 'Tên đăng nhập không được chứa khoảng trắng!'
            }
          ]}
        >
          <Input placeholder="Tên đăng nhập" />
        </Form.Item>

        <Form.Item
          label="Full Name"
          name="fullName"
          rules={[
            { required: true, message: 'Vui lòng nhập họ tên!' },
            { max: 100, message: 'Họ tên tối đa 100 ký tự!' },
            {
              pattern: /^[a-zA-ZÀ-ỹ\s]+$/,
              message: 'Họ tên chỉ chứa chữ cái và khoảng trắng!',
            }
          ]}
        >
          <Input placeholder="Nhập họ tên" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không hợp lệ!' }
          ]}
        >
          <Input placeholder="Nhập email" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu!' },
            { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }
          ]}
          hasFeedback
        >
          <Input.Password placeholder="Nhập mật khẩu" />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
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
          <Input.Password placeholder="Nhập lại mật khẩu" />
        </Form.Item>

        <Form.Item
          label="Phone Number"
          name="phoneNumber"
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại!' },
            { pattern: /^(0[3|5|7|8|9])[0-9]{8}$/, message: 'Số điện thoại không hợp lệ!' }
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item
          label="Address"
          name="address"
          rules={[
            { max: 100, message: 'Địa chỉ tối đa 100 ký tự!' }
          ]}
        >
          <Input placeholder="Nhập địa chỉ" />
        </Form.Item>

        <Form.Item
          label="Date of Birth"
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
          <Input type="date" />
        </Form.Item>

        <Form.Item
          label="Gender"
          name="gender"
          rules={[
            { required: true, message: 'Vui lòng chọn giới tính!' }
          ]}
        >
          <select style={{ width: '100%', height: 32, borderRadius: 4 }}>
            <option value="">Chọn giới tính</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
          </select>
        </Form.Item>

        <Form.Item name="remember" valuePropName="checked">
          <Checkbox>Ghi nhớ tôi</Checkbox>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Đăng ký
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default RegisterForm;
