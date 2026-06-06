// Chỉ cho phép admin truy cập (đặt SAU protectedRoute để có req.user)
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Chỉ quản trị viên mới được truy cập" });
  }
  next();
};
