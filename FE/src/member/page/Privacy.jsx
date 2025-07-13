import React from 'react'

function Privacy() {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-indigo-100">
            <div className="flex-grow flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-3xl bg-white p-8 md:p-12 rounded-2xl shadow-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-blue-700 mb-2">Chính sách bảo mật</h1>
                        <p className="text-gray-600">
                            Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Vui lòng đọc kỹ chính sách dưới đây.
                        </p>
                    </div>
                    <ol className="list-decimal list-inside space-y-4 text-gray-800">
                        <li>
                            <span className="font-semibold text-blue-600">Thu thập thông tin:</span>{" "}
                            Chúng tôi chỉ thu thập thông tin cần thiết để cung cấp dịch vụ tốt nhất cho bạn.
                        </li>
                        <li>
                            <span className="font-semibold text-blue-600">Sử dụng thông tin:</span>{" "}
                            Thông tin của bạn được sử dụng để cải thiện dịch vụ và hỗ trợ khách hàng.
                        </li>
                        <li>
                            <span className="font-semibold text-blue-600">Bảo mật thông tin:</span>{" "}
                            Chúng tôi áp dụng các biện pháp bảo mật để bảo vệ dữ liệu cá nhân của bạn.
                        </li>
                        <li>
                            <span className="font-semibold text-blue-600">Chia sẻ thông tin:</span>{" "}
                            Chúng tôi không chia sẻ thông tin cá nhân của bạn với bên thứ ba, trừ khi có sự đồng ý của bạn hoặc theo yêu cầu pháp luật.
                        </li>
                        <li>
                            <span className="font-semibold text-blue-600">Quyền của người dùng:</span>{" "}
                            Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân của mình bất cứ lúc nào.
                        </li>
                    </ol>
                    <p className="mt-8 text-gray-700 text-center">
                        Nếu có thắc mắc về chính sách bảo mật, vui lòng liên hệ bộ phận hỗ trợ khách hàng.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Privacy
