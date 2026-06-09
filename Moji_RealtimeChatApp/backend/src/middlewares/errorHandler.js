// ===== LỚP 11: XỬ LÝ LỖI KHÔNG LỘ THÔNG TIN =====
// Mặc định Express trả NGUYÊN stack trace (đường dẫn server, thư viện, version...)
// ra client khi có lỗi -> lộ thông tin cho hacker. Ta thay bằng:
//  - log đầy đủ phía SERVER (cho dev xem)
//  - trả thông báo CHUNG CHUNG cho client (không kèm stack)

// 404 cho các route API không tồn tại (trả JSON, không trả trang HTML mặc định).
export const apiNotFound = (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "Không tìm thấy tài nguyên API" });
  }
  next(); // không phải /api -> để SPA fallback / handler khác xử lý
};

// Error handler tập trung. Express nhận biết qua việc hàm có ĐỦ 4 tham số (err đứng đầu).
// Phải đặt SAU CÙNG, sau tất cả route.
export const errorHandler = (err, req, res, next) => {
  // Log đầy đủ phía server (chỉ dev/admin xem được log này)
  console.error("[ERROR]", req.method, req.originalUrl, "->", err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  const status = err.status || err.statusCode || 500;

  // Client chỉ nhận thông báo chung chung, KHÔNG kèm stack trace
  res.status(status).json({
    message:
      status >= 500
        ? "Đã có lỗi xảy ra phía máy chủ. Vui lòng thử lại sau."
        : err.message || "Yêu cầu không hợp lệ",
  });
};
