import multer from "multer";

// Lưu file tạm trong RAM để chuyển thành base64 rồi lưu thẳng vào MongoDB
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 2, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh"));
    }
  },
});

// Chuyển buffer ảnh thành chuỗi data URI (base64) để nhúng thẳng vào <img src=...>
export const bufferToDataUri = (file) => {
  const base64 = file.buffer.toString("base64");
  return `data:${file.mimetype};base64,${base64}`;
};
