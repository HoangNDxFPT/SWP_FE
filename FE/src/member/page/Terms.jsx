import React from "react";

function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl bg-white p-8 md:p-12 rounded-2xl shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-700 mb-2">
              Điều khoản Dịch vụ
            </h1>
            <p className="text-gray-600">
              Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ
              của chúng tôi.
            </p>
          </div>
          <ol className="list-decimal list-inside space-y-4 text-gray-800">
            <li>
              <span className="font-semibold text-blue-600">
                Chấp nhận điều khoản:
              </span>{" "}
              Khi sử dụng dịch vụ, bạn đồng ý tuân thủ tất cả các điều khoản này.
            </li>
            <li>
              <span className="font-semibold text-blue-600">
                Quyền riêng tư:
              </span>{" "}
              Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo chính sách
              bảo mật.
            </li>
            <li>
              <span className="font-semibold text-blue-600">
                Quyền và nghĩa vụ:
              </span>{" "}
              Người dùng có trách nhiệm cung cấp thông tin chính xác và không sử
              dụng dịch vụ cho mục đích trái pháp luật.
            </li>
            <li>
              <span className="font-semibold text-blue-600">
                Thay đổi điều khoản:
              </span>{" "}
              Chúng tôi có quyền thay đổi điều khoản bất kỳ lúc nào và sẽ thông
              báo trên website.
            </li>
            <li>
              <span className="font-semibold text-blue-600">
                Giới hạn trách nhiệm:
              </span>{" "}
              Chúng tôi không chịu trách nhiệm cho các thiệt hại phát sinh từ
              việc sử dụng dịch vụ.
            </li>
          </ol>
          <p className="mt-8 text-gray-700 text-center">
            Nếu có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ khách hàng.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Terms;
