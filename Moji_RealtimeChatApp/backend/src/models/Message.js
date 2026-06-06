import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    imgUrl: {
      type: String, // giữ lại cho tương thích tin nhắn cũ (1 ảnh)
    },
    images: {
      type: [String], // nhiều ảnh trong 1 tin nhắn (base64 data URI)
    },
    videoUrl: {
      type: String, // đường dẫn video (file lưu trên server, vd /uploads/xxx.mp4)
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
