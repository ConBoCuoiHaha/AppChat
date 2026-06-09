// ===== LỚP 4: MIDDLEWARE VALIDATION =====
// Nhận 1 schema Zod, kiểm tra req.body. Nếu sai -> trả 400 kèm thông báo rõ ràng.
// Nếu đúng -> thay req.body bằng dữ liệu ĐÃ LÀM SẠCH (trim, ép kiểu) rồi cho qua.
//
// Cách dùng trong route:
//   router.post("/signup", validate(signupSchema), signUp);

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const issues = result.error.issues;
    return res.status(400).json({
      message: issues[0]?.message || "Dữ liệu không hợp lệ",
      // liệt kê chi tiết từng field sai (hữu ích cho frontend hiển thị)
      errors: issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  req.body = result.data; // dùng dữ liệu đã được Zod làm sạch
  next();
};
