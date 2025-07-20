// utils/uploadCloudinary.js
export async function uploadImageToCloudinary(file) {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'default_preset'); // đổi tên nếu bạn đặt preset khác
  data.append('cloud_name', 'ddd2cmuiu');

  const response = await fetch('https://api.cloudinary.com/v1_1/ddd2cmuiu/image/upload', {
    method: 'POST',
    body: data,
  });
  const result = await response.json();
  if (result.secure_url) return result.secure_url;
  throw new Error('Upload thất bại');
}
