import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import friendRoute from "./routes/friendRoute.js";
import messageRoute from "./routes/messageRoute.js";
import conversationRoute from "./routes/conversationRoute.js";
import adminRoute from "./routes/adminRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { app, server } from "./socket/index.js";
import { uploadsDir } from "./middlewares/videoUploadMiddleware.js";
import { corsOrigin } from "./libs/cors.js";
import helmet from "helmet";
import { authLimiter, apiLimiter } from "./middlewares/rateLimiter.js";
import { sanitizeBody } from "./middlewares/sanitize.js";
import { apiNotFound, errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

// const app = express();
const PORT = process.env.PORT || 5001;

// Tin tưởng 1 lớp proxy (Dev Tunnel/Cloudflare) -> rate-limit đọc đúng IP thật từ X-Forwarded-For
app.set("trust proxy", 1);

// ===== LỚP 9: SECURITY HEADERS (Helmet) =====
// Thêm hàng loạt header bảo mật (X-Frame-Options, HSTS, X-Content-Type-Options...).
// Tắt CSP vì frontend được build thành 1 file HTML có inline script/style (CSP sẽ chặn).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// middlewares
app.use(express.json({ limit: "10mb" })); // limit lớn để nhận ảnh base64
app.use(sanitizeBody); // LỚP 6: chống NoSQL injection (làm sạch req.body)

// === Parse cookie CHỐNG CRASH ===
// Dev Tunnels chèn cookie ".Tunnels.Relay.*" (đôi khi bị chunk hoá / ký tự lạ) khiến
// cookie-parser ném lỗi -> request 500. Ta loại bỏ chúng trước, rồi parse với decode an toàn.
app.use((req, res, next) => {
  if (req.headers.cookie) {
    const cleaned = req.headers.cookie
      .split(/;\s*/)
      .filter((c) => c && !c.startsWith(".Tunnels.Relay"))
      .join("; ");
    if (cleaned) req.headers.cookie = cleaned;
    else delete req.headers.cookie;
  }
  next();
});
app.use(
  cookieParser(undefined, {
    // decode an toàn: cookie lỗi (sai mã hoá %) cũng không ném exception
    decode: (v) => {
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    },
  })
);

app.use(cors({ origin: corsOrigin, credentials: true }));

// LỚP 7: rate-limit CHUNG cho toàn API (lá chắn DoS cơ bản)
app.use("/api", apiLimiter);

// phục vụ file video tĩnh (công khai, để thẻ <video> tải được)
app.use("/uploads", express.static(uploadsDir));

// === Phục vụ frontend đã build (cùng origin với backend -> chỉ cần 1 tunnel) ===
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));

// swagger
const swaggerDocument = JSON.parse(fs.readFileSync("./src/swagger.json", "utf8"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// public routes — LỚP 7: rate-limit NGHIÊM cho auth (chống brute-force mật khẩu)
app.use("/api/auth", authLimiter, authRoute);

// SPA fallback: mọi GET không thuộc /api, /uploads, /api-docs -> trả index.html
// (đặt TRƯỚC protectedRoute để trang web công khai, không cần đăng nhập mới tải được)
app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api") &&
    !req.path.startsWith("/uploads") &&
    !req.path.startsWith("/api-docs")
  ) {
    return res.sendFile(path.join(frontendDist, "index.html"));
  }
  next();
});

// private routes
app.use(protectedRoute);
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/messages", messageRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/admin", adminRoute);

// ===== LỚP 11: 404 cho API + xử lý lỗi tập trung (KHÔNG lộ stack trace) =====
// Đặt SAU CÙNG, sau tất cả route.
app.use(apiNotFound);
app.use(errorHandler);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);
  });
});
