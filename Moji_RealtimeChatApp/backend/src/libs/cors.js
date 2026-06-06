// Cho phép các cổng dev thường gặp của Vite (5173/5174/5175...) + CLIENT_URL khi deploy.
// Tránh lỗi CORS khi Vite tự nhảy cổng nếu cổng mặc định bị chiếm.
const devOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
];

export const corsOrigin = (origin, callback) => {
  // không có origin: request cùng origin / công cụ (Postman) -> cho qua
  if (!origin) return callback(null, true);

  if (devOrigins.includes(origin) || origin === process.env.CLIENT_URL) {
    return callback(null, true);
  }

  return callback(new Error("Không được phép bởi CORS"), false);
};
