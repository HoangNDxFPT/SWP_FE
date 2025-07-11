import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../config/axios';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons';

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = () => {
    toast.error("Vui lòng kiểm tra lại thông tin nhập liệu!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-indigo-100">
      {/* Main content */}
      <div className="flex-grow flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="grid md:grid-cols-5 w-full max-w-6xl gap-8">
          {/* Left column - Image and intro */}
          <div className="hidden md:flex md:col-span-2 flex-col justify-center p-8 bg-blue-600 text-white rounded-l-2xl">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Bắt đầu hành trình</h1>
              <p className="text-lg opacity-90">
                Tạo tài khoản để trải nghiệm dịch vụ chuyên nghiệp và nhận sự hỗ trợ phù hợp với bạn.
              </p>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-transparent opacity-0"></div>
                <img 
                  src="/assets/registration-illustration.svg" 
                  alt="Registration Illustration" 
                  className="w-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://res.cloudinary.com/dwjtg28ti/image/upload/v1748824738/z6621531660497_00c45b7532add5b3a49055fb93d63a53_ewd8xj.jpg";
                  }}
                />
              </div>
              <div className="space-y-3">
                <p className="font-medium">Quyền lợi thành viên:</p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Tư vấn với các chuyên gia hàng đầu
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Tham gia chương trình cộng đồng
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Khóa học và tài liệu miễn phí
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-auto pt-6">
              <p>Đã có tài khoản?</p>
              <Link to="/login" className="inline-flex mt-2 items-center text-white bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-lg font-medium transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Đăng nhập ngay
              </Link>
            </div>
          </div>
          
          {/* Right column - Registration form */}
          <div className="md:col-span-3 bg-white p-8 md:p-10 rounded-2xl md:rounded-l-none shadow-xl">
            <div className="max-w-2xl mx-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              <div className="text-center md:text-left mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Đăng ký tài khoản</h2>
                <p className="mt-2 text-gray-600">
                  Điền đầy đủ thông tin để tạo tài khoản mới
                </p>
              </div>
              
              <Form
                name="registerForm"
                layout='vertical'
                initialValues={{ remember: true }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
                className="space-y-4"
                requiredMark={false}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Tên đăng nhập"
                    name="userName"
                    rules={[
                      { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                      { min: 4, max: 20, message: 'Tên đăng nhập từ 4 đến 20 ký tự!' },
                      { pattern: /^\S+$/, message: 'Tên đăng nhập không được chứa khoảng trắng!' }
                    ]}
                  >
                    <Input 
                      prefix={<UserOutlined className="text-gray-400" />} 
                      placeholder="Tên đăng nhập"
                      className="rounded-lg py-2.5" 
                    />
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
                    <Input 
                      prefix={<UserOutlined className="text-gray-400" />} 
                      placeholder="Họ và tên đầy đủ"
                      className="rounded-lg py-2.5" 
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Email không hợp lệ!' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined className="text-gray-400" />} 
                    placeholder="Email của bạn"
                    className="rounded-lg py-2.5" 
                  />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu!' },
                      { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }
                    ]}
                    hasFeedback
                  >
                    <Input.Password 
                      prefix={<LockOutlined className="text-gray-400" />} 
                      placeholder="Mật khẩu"
                      className="rounded-lg py-2.5" 
                    />
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
                    <Input.Password 
                      prefix={<LockOutlined className="text-gray-400" />} 
                      placeholder="Nhập lại mật khẩu"
                      className="rounded-lg py-2.5" 
                    />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Số điện thoại"
                    name="phoneNumber"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại!' },
                      { pattern: /^(0[3|5|7|8|9])[0-9]{8}$/, message: 'Số điện thoại không hợp lệ!' }
                    ]}
                  >
                    <Input 
                      prefix={<PhoneOutlined className="text-gray-400" />} 
                      placeholder="Số điện thoại"
                      className="rounded-lg py-2.5" 
                    />
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
                    <Input 
                      prefix={<CalendarOutlined className="text-gray-400" />} 
                      type="date" 
                      className="rounded-lg py-2.5" 
                    />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Địa chỉ"
                    name="address"
                    rules={[
                      { max: 100, message: 'Địa chỉ tối đa 100 ký tự!' }
                    ]}
                  >
                    <Input 
                      prefix={<HomeOutlined className="text-gray-400" />} 
                      placeholder="Địa chỉ của bạn"
                      className="rounded-lg py-2.5" 
                    />
                  </Form.Item>

                  <Form.Item
                    label="Giới tính"
                    name="gender"
                    rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
                  >
                    <select className="w-full py-2.5 px-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none">
                      <option value="">Chọn giới tính</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                    </select>
                  </Form.Item>
                </div>

                <Form.Item name="agreement" valuePropName="checked" rules={[
                  { validator: (_, value) => value ? Promise.resolve() : Promise.reject('Vui lòng đồng ý với điều khoản dịch vụ') },
                ]}>
                  <Checkbox>
                    Tôi đã đọc và đồng ý với <Link to="/terms" className="text-blue-600 hover:underline">Điều khoản dịch vụ</Link> và <Link to="/privacy" className="text-blue-600 hover:underline">Chính sách bảo mật</Link>
                  </Checkbox>
                </Form.Item>

                <Form.Item className="mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    className="h-12 rounded-lg bg-blue-600 hover:bg-blue-700 border-blue-600 font-medium"
                  >
                    Tạo tài khoản
                  </Button>
                </Form.Item>

                <div className="md:hidden text-center mt-8 pt-4 border-t">
                  <p className="text-gray-600">
                    Đã có tài khoản?{" "}
                    <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                      Đăng nhập
                    </Link>
                  </p>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
