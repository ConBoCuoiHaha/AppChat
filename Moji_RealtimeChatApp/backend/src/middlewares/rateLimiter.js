import rateLimit from "express-rate-limit";

// ===== LỚP 7: RATE LIMIT =====
// Chặn brute-force (dò mật khẩu) và spam request.

// Giới hạn NGHIÊM cho các route nhạy cảm (đăng nhập, quên/đặt lại mật khẩu).
// Tối đa 20 request / 15 phút cho mỗi IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20, // 20 lần thử cho mỗi IP trong cửa sổ trên
  standardHeaders: "draft-7", // trả thông tin giới hạn qua header RateLimit-*
  legacyHeaders: false,
  message: {
    message:
      "Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.",
  },
});

// Giới hạn CHUNG cho toàn bộ API (lá chắn DoS cơ bản).
// Để rộng tay để không cản trở chat realtime (nhiều request hợp lệ).
export const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 1000, // 1000 request / 10 phút / IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
});
