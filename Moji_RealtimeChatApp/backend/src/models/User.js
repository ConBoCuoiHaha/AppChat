import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String, // ảnh avatar dạng base64 data URI, lưu thẳng trong MongoDB
    },
    bio: {
      type: String,
      maxlength: 500, // tuỳ
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, // cho phép null, nhưng không được trùng (chỉ check khi có giá trị)
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isLocked: {
      type: Boolean,
      default: false, // admin có thể khoá tài khoản
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
