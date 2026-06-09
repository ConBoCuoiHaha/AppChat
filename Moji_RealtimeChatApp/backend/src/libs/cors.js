// Quy tắc CORS: chỉ cho phép các origin tin cậy (whitelist), KHÔNG phản chiếu
// origin lạ (chống lỗ hổng "CORS reflect any origin + credentials").
const devOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
];

export const corsOrigin = (origin, callback) => {
  // Không có origin: request cùng origin / công cụ (Postman) -> cho qua
  if (!origin) return callback(null, true);

  // Các origin dev + CLIENT_URL khi deploy
  if (devOrigins.includes(origin) || origin === process.env.CLIENT_URL) {
    return callback(null, true);
  }

  // Cho phép mọi tunnel Dev Tunnels (vd: https://hung-sieunhan-5001.asse.devtunnels.ms)
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith(".devtunnels.ms")) {
      return callback(null, true);
    }
  } catch {
    // origin không hợp lệ -> coi như không thuộc whitelist
  }

  // Origin KHÔNG thuộc whitelist:
  // callback(null, false) -> cors KHÔNG gắn header Access-Control-Allow-Origin
  // (trình duyệt sẽ tự chặn). KHÔNG ném Error để tránh trả 500.
  return callback(null, false);
};
