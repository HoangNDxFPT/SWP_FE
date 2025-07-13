import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../config/axios';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Modal } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons';

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
          <div className="hidden md:flex md:col-span-2 flex-col justify-center p-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-l-3xl shadow-xl">
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold">Bắt đầu hành trình</h1>
              <p className="text-lg opacity-90">
                Tạo tài khoản để trải nghiệm dịch vụ chuyên nghiệp và nhận sự hỗ trợ phù hợp với bạn.
              </p>
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
          <div className="md:col-span-3 bg-white p-8 md:p-10 rounded-3xl md:rounded-l-none shadow-xl">
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
                    Tôi đã đọc và đồng ý với{' '}
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      Điều khoản dịch vụ
                    </span>{' '}và{' '}
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPrivacyModal(true);
                      }}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      Chính sách bảo mật
                    </span>
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

      {/* Privacy Policy Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xl font-bold text-gray-800">Chính Sách Bảo Mật</span>
          </div>
        }
        open={showPrivacyModal}
        onCancel={() => setShowPrivacyModal(false)}
        footer={null}
        width={800}
        className="privacy-modal"
        style={{ top: 20 }}
      >
        <div className="max-h-96 overflow-y-auto pr-2">
          {/* Introduction */}
          <div className="mb-6">
            <div className="border-l-4 border-blue-500 pl-4 mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Tổng Quan</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Hệ thống Tư Vấn Tâm Lý Sinh Viên cam kết bảo vệ quyền riêng tư và thông tin cá nhân của người dùng. 
                Chính sách này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn.
              </p>
            </div>
          </div>

          {/* Information Collection */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-md font-bold text-gray-800 mb-2">Thu Thập Thông Tin</h4>
                <div className="space-y-3 text-gray-600 text-sm">
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-1">Thông tin cá nhân:</h5>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      <li>Họ tên, số điện thoại, email, địa chỉ</li>
                      <li>Ngày sinh, giới tính, thông tin học vụ</li>
                      <li>Ảnh đại diện (nếu cung cấp)</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-1">Thông tin tư vấn:</h5>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      <li>Kết quả đánh giá tâm lý, bài test</li>
                      <li>Lịch sử cuộc hẹn tư vấn</li>
                      <li>Ghi chú và phản hồi từ tư vấn viên</li>
                      <li>Tiến trình học tập các khóa học</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Usage */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-md font-bold text-gray-800 mb-2">Mục Đích Sử Dụng</h4>
                <div className="grid grid-cols-2 gap-4 text-gray-600 text-sm">
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-1">Cung cấp dịch vụ:</h5>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      <li>Đánh giá tình trạng tâm lý</li>
                      <li>Đặt lịch hẹn tư vấn</li>
                      <li>Cung cấp khóa học phù hợp</li>
                      <li>Theo dõi tiến trình phục hồi</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-1">Cải thiện chất lượng:</h5>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      <li>Phân tích hiệu quả tư vấn</li>
                      <li>Phát triển chương trình mới</li>
                      <li>Tối ưu hóa trải nghiệm</li>
                      <li>Báo cáo thống kê tổng quan</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Security */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-md font-bold text-gray-800 mb-2">Bảo Mật Thông Tin</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1 flex items-center text-xs">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Mã hóa dữ liệu
                    </h5>
                    <p className="text-xs text-gray-600">Thông tin được mã hóa khi truyền tải</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1 flex items-center text-xs">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Kiểm soát truy cập
                    </h5>
                    <p className="text-xs text-gray-600">Chỉ nhân viên ủy quyền truy cập</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1 flex items-center text-xs">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Sao lưu định kỳ
                    </h5>
                    <p className="text-xs text-gray-600">Dữ liệu được sao lưu thường xuyên</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1 flex items-center text-xs">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Giám sát 24/7
                    </h5>
                    <p className="text-xs text-gray-600">Phát hiện mối đe dọa kịp thời</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Rights */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-md font-bold text-gray-800 mb-2">Quyền Của Người Dùng</h4>
                <div className="grid grid-cols-2 gap-3 text-gray-600">
                  <div className="border-l-3 border-blue-400 pl-3">
                    <h5 className="font-semibold text-gray-700 text-xs">Quyền truy cập</h5>
                    <p className="text-xs">Xem thông tin cá nhân được lưu trữ</p>
                  </div>
                  <div className="border-l-3 border-green-400 pl-3">
                    <h5 className="font-semibold text-gray-700 text-xs">Quyền chỉnh sửa</h5>
                    <p className="text-xs">Cập nhật thông tin bất cứ lúc nào</p>
                  </div>
                  <div className="border-l-3 border-yellow-400 pl-3">
                    <h5 className="font-semibold text-gray-700 text-xs">Quyền xóa</h5>
                    <p className="text-xs">Yêu cầu xóa thông tin cá nhân</p>
                  </div>
                  <div className="border-l-3 border-red-400 pl-3">
                    <h5 className="font-semibold text-gray-700 text-xs">Quyền phản đối</h5>
                    <p className="text-xs">Từ chối xử lý dữ liệu cụ thể</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="bg-orange-100 p-2 rounded-lg mr-3">
                <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-md font-bold text-gray-800 mb-2">Chia Sẻ Thông Tin</h4>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h5 className="font-semibold text-green-800 mb-1 text-xs">✅ KHÔNG chia sẻ với:</h5>
                    <ul className="text-green-700 text-xs space-y-1">
                      <li>• Công ty quảng cáo hoặc marketing</li>
                      <li>• Bên thứ ba vì mục đích thương mại</li>
                      <li>• Tổ chức không liên quan giáo dục</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h5 className="font-semibold text-yellow-800 mb-1 text-xs">⚠️ Chia sẻ khi cần thiết:</h5>
                    <ul className="text-yellow-700 text-xs space-y-1">
                      <li>• Yêu cầu của cơ quan pháp luật</li>
                      <li>• Trường hợp khẩn cấp sức khỏe tâm thần</li>
                      <li>• Có sự đồng ý rõ ràng của bạn</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <h4 className="text-md font-bold text-gray-800 mb-2">Liên Hệ & Hỗ Trợ</h4>
            <p className="text-xs text-gray-600 mb-3">
              Có câu hỏi về chính sách bảo mật? Liên hệ với chúng tôi:
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="font-semibold text-gray-700">Email</div>
                <div className="text-gray-600">privacy@student-counseling.edu.vn</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Hotline</div>
                <div className="text-gray-600">1900 2024</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Địa chỉ</div>
                <div className="text-gray-600">Trường ĐH FPT, TP.HCM</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xl font-bold text-gray-800">Điều Khoản Dịch Vụ</span>
          </div>
        }
        open={showTermsModal}
        onCancel={() => setShowTermsModal(false)}
        footer={null}
        width={800}
        className="terms-modal"
        style={{ top: 20 }}
      >
        <div className="max-h-96 overflow-y-auto pr-2">
          {/* Introduction */}
          <div className="mb-6">
            <div className="border-l-4 border-green-500 pl-4 mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Giới Thiệu</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Chào mừng bạn đến với Hệ thống Tư Vấn Tâm Lý Sinh Viên. Bằng việc sử dụng dịch vụ của chúng tôi, 
                bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu dưới đây.
              </p>
            </div>
          </div>

          {/* Service Usage */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-md font-bold text-gray-800 mb-2">Sử Dụng Dịch Vụ</h4>
                <div className="space-y-3 text-gray-600 text-sm">
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-1">Quyền của người dùng:</h5>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      <li>Truy cập và sử dụng các dịch vụ tư vấn tâm lý</li>
                      <li>Tham gia các khóa học và chương trình hỗ trợ</li>
                      <li>Nhận thông tin và tài liệu từ hệ thống</li>
                      <li>Đặt lịch hẹn với các chuyên gia tư vấn</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-1">Trách nhiệm của người dùng:</h5>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      <li>Cung cấp thông tin chính xác và trung thực</li>
                      <li>Tuân thủ các quy định và hướng dẫn của hệ thống</li>
                      <li>Không lạm dụng hoặc sử dụng sai mục đích dịch vụ</li>
                      <li>Tôn trọng quyền riêng tư của người khác</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="text-md font-bold text-gray-800 mb-2">Bảo Mật Tài Khoản</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1 flex items-center text-xs">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Bảo vệ mật khẩu
                    </h5>
                    <p className="text-xs text-gray-600">Giữ bí mật thông tin đăng nhập</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1 flex items-center text-xs">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Cập nhật thông tin
                    </h5>
                    <p className="text-xs text-gray-600">Thông báo khi có thay đổi</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1 flex items-center text-xs">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Đăng xuất an toàn
                    </h5>
                    <p className="text-xs text-gray-600">Luôn đăng xuất sau khi sử dụng</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1 flex items-center text-xs">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Báo cáo sự cố
                    </h5>
                    <p className="text-xs text-gray-600">Thông báo ngay khi có vấn đề</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Quality */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="text-md font-bold text-gray-800 mb-2">Chất Lượng Dịch Vụ</h4>
                <div className="grid grid-cols-2 gap-3 text-gray-600">
                  <div className="border-l-3 border-blue-400 pl-3">
                    <h5 className="font-semibold text-gray-700 text-xs">Cam kết chất lượng</h5>
                    <p className="text-xs">Dịch vụ tư vấn chuyên nghiệp và hiệu quả</p>
                  </div>
                  <div className="border-l-3 border-green-400 pl-3">
                    <h5 className="font-semibold text-gray-700 text-xs">Hỗ trợ 24/7</h5>
                    <p className="text-xs">Đội ngũ hỗ trợ luôn sẵn sàng</p>
                  </div>
                  <div className="border-l-3 border-yellow-400 pl-3">
                    <h5 className="font-semibold text-gray-700 text-xs">Bảo mật thông tin</h5>
                    <p className="text-xs">Thông tin cá nhân được bảo vệ tuyệt đối</p>
                  </div>
                  <div className="border-l-3 border-red-400 pl-3">
                    <h5 className="font-semibold text-gray-700 text-xs">Cải tiến liên tục</h5>
                    <p className="text-xs">Luôn nâng cấp và cải thiện dịch vụ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prohibited Activities */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h4 className="text-md font-bold text-gray-800 mb-2">Hành Vi Bị Cấm</h4>
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h5 className="font-semibold text-red-800 mb-1 text-xs">🚫 NGHIÊM CẤM:</h5>
                    <ul className="text-red-700 text-xs space-y-1">
                      <li>• Cung cấp thông tin sai lệch hoặc gian lận</li>
                      <li>• Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                      <li>• Chia sẻ tài khoản hoặc thông tin đăng nhập</li>
                      <li>• Tấn công, làm hại hệ thống hoặc dữ liệu</li>
                    </ul>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <h5 className="font-semibold text-orange-800 mb-1 text-xs">⚠️ HẬU QUẢ VI PHẠM:</h5>
                    <ul className="text-orange-700 text-xs space-y-1">
                      <li>• Cảnh báo và yêu cầu chấm dứt hành vi</li>
                      <li>• Tạm ngưng hoặc khóa tài khoản</li>
                      <li>• Chuyển giao cho cơ quan pháp luật nếu cần thiết</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Terms */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="bg-gray-100 p-2 rounded-lg mr-3">
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div>
                <h4 className="text-md font-bold text-gray-800 mb-2">Điều Khoản Pháp Lý</h4>
                <div className="space-y-3 text-gray-600 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1 text-xs">Giới hạn trách nhiệm:</h5>
                    <p className="text-xs">Hệ thống cung cấp dịch vụ hỗ trợ tư vấn, không thay thế điều trị y tế chuyên nghiệp.</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1 text-xs">Thay đổi điều khoản:</h5>
                    <p className="text-xs">Chúng tôi có quyền cập nhật điều khoản và sẽ thông báo trước cho người dùng.</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-1 text-xs">Luật áp dụng:</h5>
                    <p className="text-xs">Điều khoản này tuân thủ theo pháp luật Việt Nam.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <h4 className="text-md font-bold text-gray-800 mb-2">Thông Tin Liên Hệ</h4>
            <p className="text-xs text-gray-600 mb-3">
              Có thắc mắc về điều khoản dịch vụ? Liên hệ với chúng tôi:
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="font-semibold text-gray-700">Email</div>
                <div className="text-gray-600">legal@student-counseling.edu.vn</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Hotline</div>
                <div className="text-gray-600">1900 2024</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Địa chỉ</div>
                <div className="text-gray-600">Trường ĐH FPT, TP.HCM</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RegisterPage;
