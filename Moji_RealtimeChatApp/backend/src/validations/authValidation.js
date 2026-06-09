// ===== LỚP 4: VALIDATION TẬP TRUNG (Zod) =====
// Định nghĩa "khuôn" dữ liệu hợp lệ cho từng endpoint auth. Zod sẽ tự kiểm:
//  - đúng kiểu (string/number...) -> đồng thời chặn injection kiểu { "$ne": null }
//  - đúng định dạng (email, số điện thoại, độ dài...)
//  - tự trim() và ép kiểu trả về dữ liệu sạch.
import { z } from "zod";

export const signupSchema = z.object({
  username: z
    .string({ error: "Tên đăng nhập không hợp lệ" })
    .trim()
    .min(3, { error: "Tên đăng nhập tối thiểu 3 ký tự" })
    .max(30, { error: "Tên đăng nhập tối đa 30 ký tự" })
    .regex(/^[a-zA-Z0-9_.]+$/, {
      error: "Tên đăng nhập chỉ gồm chữ, số, dấu _ và .",
    }),
  password: z
    .string({ error: "Mật khẩu không hợp lệ" })
    .min(6, { error: "Mật khẩu tối thiểu 6 ký tự" })
    .max(100, { error: "Mật khẩu quá dài" }),
  email: z.email({ error: "Email không hợp lệ" }),
  firstName: z.string({ error: "Thiếu tên" }).trim().min(1, { error: "Vui lòng nhập tên" }),
  lastName: z.string({ error: "Thiếu họ" }).trim().min(1, { error: "Vui lòng nhập họ" }),
  phone: z
    .string({ error: "Số điện thoại không hợp lệ" })
    .trim()
    .regex(/^[0-9]{9,11}$/, { error: "Số điện thoại phải gồm 9-11 chữ số" }),
});

export const signinSchema = z.object({
  username: z
    .string({ error: "Vui lòng nhập tài khoản" })
    .trim()
    .min(1, { error: "Vui lòng nhập tài khoản" }),
  password: z
    .string({ error: "Vui lòng nhập mật khẩu" })
    .min(1, { error: "Vui lòng nhập mật khẩu" }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Email không hợp lệ" }),
});

export const verifyResetCodeSchema = z.object({
  email: z.email({ error: "Email không hợp lệ" }),
  code: z
    .string({ error: "Thiếu mã xác nhận" })
    .trim()
    .regex(/^[0-9]{4}$/, { error: "Mã xác nhận gồm 4 chữ số" }),
});

export const resetPasswordSchema = z.object({
  email: z.email({ error: "Email không hợp lệ" }),
  code: z
    .string({ error: "Thiếu mã xác nhận" })
    .trim()
    .regex(/^[0-9]{4}$/, { error: "Mã xác nhận gồm 4 chữ số" }),
  newPassword: z
    .string({ error: "Mật khẩu mới không hợp lệ" })
    .min(6, { error: "Mật khẩu mới tối thiểu 6 ký tự" })
    .max(100, { error: "Mật khẩu quá dài" }),
});
