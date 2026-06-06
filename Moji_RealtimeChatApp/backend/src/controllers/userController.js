import bcrypt from "bcrypt";
import { bufferToDataUri } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Thiếu mật khẩu hiện tại hoặc mật khẩu mới" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const user = await User.findById(userId); // có hashedPassword

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const ok = await bcrypt.compare(currentPassword, user.hashedPassword);

    if (!ok) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    user.hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const authMe = async (req, res) => {
  try {
    const user = req.user; // lấy từ authMiddleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, phone, bio, email } = req.body;

    const setOps = {};
    const unsetOps = {};

    if (displayName !== undefined) setOps.displayName = displayName.trim();
    if (bio !== undefined) setOps.bio = bio;
    if (email !== undefined) setOps.email = email.toLowerCase().trim();
    if (phone !== undefined) {
      const p = phone.trim();
      if (p === "") unsetOps.phone = "";
      else setOps.phone = p;
    }

    // kiểm tra trùng email / số điện thoại với người khác
    if (setOps.email) {
      const dup = await User.findOne({
        email: setOps.email,
        _id: { $ne: userId },
      });
      if (dup) return res.status(409).json({ message: "Email đã được sử dụng" });
    }
    if (setOps.phone) {
      const dup = await User.findOne({
        phone: setOps.phone,
        _id: { $ne: userId },
      });
      if (dup)
        return res
          .status(409)
          .json({ message: "Số điện thoại đã được sử dụng" });
    }

    const update = {};
    if (Object.keys(setOps).length) update.$set = setOps;
    if (Object.keys(unsetOps).length) update.$unset = unsetOps;

    const user = await User.findByIdAndUpdate(userId, update, {
      new: true,
    }).select("-hashedPassword");

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi cập nhật hồ sơ", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    // hỗ trợ cả ?query= (mới) lẫn ?username= (cũ)
    const raw = (req.query.query ?? req.query.username ?? "").toString().trim();

    if (!raw) {
      return res.status(400).json({ message: "Cần nhập từ khoá tìm kiếm" });
    }

    // escape ký tự đặc biệt để dùng làm regex an toàn
    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i"); // không phân biệt hoa thường

    const users = await User.find({
      _id: { $ne: req.user._id }, // không tìm chính mình
      $or: [
        { username: regex }, // tên đăng nhập (chứa)
        { displayName: regex }, // tên hiển thị (chứa)
        { phone: raw }, // số điện thoại (chính xác)
      ],
    })
      .select("_id displayName username avatarUrl phone")
      .limit(15);

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Lỗi xảy ra khi searchUsers", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const avatarUrl = bufferToDataUri(file);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl,
      },
      {
        new: true,
      }
    ).select("avatarUrl");

    if (!updatedUser.avatarUrl) {
      return res.status(400).json({ message: "Avatar trả về null" });
    }

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload avatar", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};
