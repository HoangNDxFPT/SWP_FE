import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../config/axios';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';

function ActivationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    const activateAccount = async () => {
      // Check if token exists
      if (!token) {
        setStatus('error');
        setMessage('Token xác thực không hợp lệ hoặc không tồn tại.');
        toast.error('Token xác thực không hợp lệ!');
        return;
      }

      try {
        console.log('Activating with token:', token); // Debug log
        
        const response = await api.get(`/activate?token=${token}`);
        
        console.log('Activation response:', response); // Debug log
        
        // Success
        setStatus('success');
        setMessage('Tài khoản đã được kích hoạt thành công! Bạn có thể đăng nhập ngay bây giờ.');
        toast.success('Kích hoạt tài khoản thành công!');
        
        // Auto redirect to login after 5 seconds
        setTimeout(() => {
          navigate('/login');
        }, 5000);
        
      } catch (error) {
        console.error('Activation error:', error); // Debug log
        
        setStatus('error');
        
        // Handle specific error cases
        if (error.response?.status === 400) {
          setMessage('Token xác thực không hợp lệ hoặc đã hết hạn.');
          toast.error('Token xác thực không hợp lệ hoặc đã hết hạn!');
        } else if (error.response?.status === 404) {
          setMessage('Token không tồn tại trong hệ thống.');
          toast.error('Token không tồn tại!');
        } else if (error.response?.status === 409) {
          setMessage('Tài khoản đã được kích hoạt trước đó.');
          toast.warning('Tài khoản đã được kích hoạt!');
        } else {
          const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi kích hoạt tài khoản.';
          setMessage(errorMsg);
          toast.error('Kích hoạt tài khoản thất bại!');
        }
      }
    };

    // Only run activation if we have a token
    if (token) {
      activateAccount();
    } else {
      setStatus('error');
      setMessage('Liên kết xác thực không hợp lệ. Vui lòng kiểm tra lại email của bạn.');
      toast.error('Liên kết xác thực không hợp lệ!');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <LoadingOutlined className="text-4xl text-blue-600" spin />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Đang xác thực tài khoản...
            </h1>
            <p className="text-gray-600">
              Vui lòng đợi trong giây lát
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Token: {token ? token.substring(0, 20) + '...' : 'Không có'}
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleOutlined className="text-4xl text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-4">
              ✅ Xác thực thành công!
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              >
                Đăng nhập ngay
              </Link>
              <p className="text-sm text-gray-500">
                Tự động chuyển hướng sau 5 giây...
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CloseCircleOutlined className="text-4xl text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              ❌ Xác thực thất bại
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Link
                to="/register"
                className="block w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Đăng ký tài khoản mới
              </Link>
              <Link
                to="/login"
                className="block w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Về trang đăng nhập
              </Link>
            </div>
            
            {/* Debug info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                Debug: Token = {token || 'Không có token'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ActivationPage;