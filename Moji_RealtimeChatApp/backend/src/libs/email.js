import nodemailer from "nodemailer";

// Tạo transporter Gmail (cần EMAIL_USER + EMAIL_PASS = App Password trong .env)
const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendResetCodeEmail = async (to, code) => {
  const transporter = getTransporter();

  if (!transporter) {
    throw new Error(
      "Chưa cấu hình EMAIL_USER / EMAIL_PASS trong .env để gửi email"
    );
  }

  await transporter.sendMail({
    from: `"Hưng-SieuNhan" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Mã đặt lại mật khẩu - Hưng-SieuNhan",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0084FF;">Đặt lại mật khẩu</h2>
        <p>Mã xác nhận của bạn là:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0084FF;">${code}</p>
        <p>Mã có hiệu lực trong <b>10 phút</b>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `,
  });
};
