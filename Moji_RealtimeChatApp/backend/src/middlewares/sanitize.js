// ===== LỚP 6: CHỐNG NOSQL INJECTION =====
// Kẻ tấn công có thể gửi body kiểu { "username": { "$ne": null } } để "lách" query
// MongoDB (vd đăng nhập không cần mật khẩu). Ta loại bỏ mọi key bắt đầu bằng "$"
// hoặc chứa dấu "." — đó là các toán tử/đường dẫn của MongoDB.
//
// Lưu ý: Express 5 khiến req.query/req.params chỉ-đọc (read-only), nên ta CHỈ
// làm sạch req.body (nơi nguy hiểm nhất vì nhận JSON tuỳ ý từ client).

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object") {
    const clean = {};
    for (const key of Object.keys(value)) {
      // Bỏ qua key nguy hiểm: toán tử MongoDB ($gt, $ne...) hoặc đường dẫn (a.b)
      if (key.startsWith("$") || key.includes(".")) continue;
      clean[key] = sanitizeValue(value[key]); // đệ quy cho object lồng nhau
    }
    return clean;
  }
  return value; // string/number/boolean -> giữ nguyên
};

export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
};
