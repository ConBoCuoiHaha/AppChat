// Cho phép các cổng dev thường gặp của Vite (5173/5174/5175...) + CLIENT_URL khi deploy.
// Tránh lỗi CORS khi Vite tự nhảy cổng nếu cổng mặc định bị chiếm.
const devOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
];

export const corsOrigin = (origin, callback) => {
  // App cá nhân chạy sau Dev Tunnel: CHO PHÉP MỌI ORIGIN (phản chiếu lại origin).
  // Lý do: Dev Tunnels relay có thể đổi/biến dạng header Origin khi chuyển tiếp
  // (dạng có cổng ":5001" vs dạng gạch ngang "-5001"), nên kiểm tra theo origin
  // không đáng tin. Bảo mật API đã được JWT (access token) + cookie đảm nhiệm,
  // nên việc cho phép mọi origin là an toàn cho mục đích này.
  // (devOrigins giữ lại để tham khảo, không còn dùng để chặn.)
  void devOrigins;
  return callback(null, true);
};
