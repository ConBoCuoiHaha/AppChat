// @ts-nocheck
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";
import PasswordReset from "../models/PasswordReset.js";
import { sendResetCodeEmail } from "../libs/email.js";

const RESET_CODE_TTL = 10 * 60 * 1000; // 10 phút

const ACCESS_TOKEN_TTL = "30m"; // thuờng là dưới 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, phone } = req.body;

    if (!username || !password || !email || !firstName || !lastName || !phone) {
      return res.status(400).json({
        message:
          "Vui lòng nhập đầy đủ thông tin (gồm cả số điện thoại)",
      });
    }

    const normUsername = username.toLowerCase().trim();
    const normEmail = email.toLowerCase().trim();
    const normPhone = phone.trim();

    // kiểm tra trùng username / email / số điện thoại
    const duplicate = await User.findOne({
      $or: [
        { username: normUsername },
        { email: normEmail },
        { phone: normPhone },
      ],
    });

    if (duplicate) {
      if (duplicate.username === normUsername) {
        return res.status(409).json({ message: "Tên đăng nhập đã tồn tại" });
      }
      if (duplicate.email === normEmail) {
        return res.status(409).json({ message: "Email đã được sử dụng" });
      }
      return res
        .status(409)
        .json({ message: "Số điện thoại đã được sử dụng" });
    }

    // mã hoá password
    const hashedPassword = await bcrypt.hash(password, 10); // salt = 10

    // tạo user mới
    await User.create({
      username: normUsername,
      hashedPassword,
      email: normEmail,
      phone: normPhone,
      displayName: `${lastName} ${firstName}`,
    });

    // return
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signIn = async (req, res) => {
  try {
    // lấy inputs (username có thể là tên đăng nhập hoặc số điện thoại)
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu tài khoản hoặc mật khẩu." });
    }

    const identifier = username.trim();

    // tìm theo username (đã lowercase) hoặc số điện thoại
    const user = await User.findOne({
      $or: [{ username: identifier.toLowerCase() }, { phone: identifier }],
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Tài khoản hoặc mật khẩu không chính xác" });
    }

    // kiểm tra password
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    if (user.isLocked) {
      return res
        .status(403)
        .json({ message: "Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên." });
    }

    // nếu khớp, tạo accessToken với JWT
    const accessToken = jwt.sign(
      { userId: user._id },
      // @ts-ignore
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // tạo session mới để lưu refresh token
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    // trả refresh token về trong cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // JS client không đọc được -> chống XSS đánh cắp token
      secure: true, // chỉ gửi qua HTTPS
      // LỚP 8: CHỐNG CSRF. "lax" -> trình duyệt KHÔNG gửi cookie này trong request
      // cross-site (từ web khác) -> chặn tấn công giả mạo request. Hoạt động tốt vì
      // frontend & backend giờ cùng origin (phục vụ chung). (Nếu sau này deploy tách
      // domain Render/Vercel thì đổi lại "none".)
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_TTL,
    });

    // trả access token về trong res
    return res
      .status(200)
      .json({ message: `User ${user.displayName} đã logged in!`, accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi signIn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signOut = async (req, res) => {
  try {
    // lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;

    if (token) {
      // xoá refresh token trong Session
      await Session.deleteOne({ refreshToken: token });

      // xoá cookie
      res.clearCookie("refreshToken");
    }

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// tạo access token mới từ refresh token
export const refreshToken = async (req, res) => {
  try {
    // lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Token không tồn tại." });
    }

    // so với refresh token trong db
    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // kiểm tra hết hạn chưa
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token đã hết hạn." });
    }

    // tạo access token mới
    const accessToken = jwt.sign(
      {
        userId: session.userId,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // return
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refreshToken", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ===== QUÊN MẬT KHẨU =====

// B1: nhập email -> gửi mã 4 số qua email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập email" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "Email chưa được đăng ký" });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 số

    await PasswordReset.findOneAndUpdate(
      { email: normalizedEmail },
      { code, expiresAt: new Date(Date.now() + RESET_CODE_TTL) },
      { upsert: true, new: true }
    );

    await sendResetCodeEmail(normalizedEmail, code);

    return res
      .status(200)
      .json({ message: "Đã gửi mã xác nhận tới email của bạn" });
  } catch (error) {
    console.error("Lỗi khi gửi mã đặt lại mật khẩu", error);
    return res
      .status(500)
      .json({ message: "Không gửi được email. Hãy thử lại sau." });
  }
};

// B2: xác minh mã 4 số
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Thiếu email hoặc mã" });
    }

    const record = await PasswordReset.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!record || record.code !== code || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Mã không đúng hoặc đã hết hạn" });
    }

    return res.status(200).json({ message: "Mã hợp lệ" });
  } catch (error) {
    console.error("Lỗi khi xác minh mã", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// B3: đặt lại mật khẩu mới
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await PasswordReset.findOne({ email: normalizedEmail });

    if (!record || record.code !== code || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Mã không đúng hoặc đã hết hạn" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    user.hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.save();

    await PasswordReset.deleteOne({ email: normalizedEmail });

    return res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi khi đặt lại mật khẩu", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
