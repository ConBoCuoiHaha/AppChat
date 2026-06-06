import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";

const MAX_IMAGES = 6;

// chuẩn hoá danh sách ảnh: gộp imgUrl (cũ) + images (mới), giới hạn số lượng
const normalizeImages = (images, imgUrl) => {
  const list = Array.isArray(images) ? images : [];
  if (imgUrl) list.unshift(imgUrl);
  return list.filter(Boolean).slice(0, MAX_IMAGES);
};

// nhận file video đã upload (multer), trả về đường dẫn để gửi kèm tin nhắn
export const uploadVideoFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có video" });
    }
    return res.status(200).json({ url: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error("Lỗi khi upload video", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// nhận nhiều file ảnh đã upload, trả về danh sách đường dẫn
export const uploadImageFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Không có ảnh" });
    }
    const urls = req.files.map((f) => `/uploads/${f.filename}`);
    return res.status(200).json({ urls });
  } catch (error) {
    console.error("Lỗi khi upload ảnh", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, imgUrl, images, videoUrl } =
      req.body;
    const senderId = req.user._id;

    let conversation;

    const imageList = normalizeImages(images, imgUrl);

    if (!content && imageList.length === 0 && !videoUrl) {
      return res.status(400).json({ message: "Thiếu nội dung" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
      images: imageList,
      videoUrl,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, imgUrl, images, videoUrl } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    const imageList = normalizeImages(images, imgUrl);

    if (!content && imageList.length === 0 && !videoUrl) {
      return res.status(400).json("Thiếu nội dung");
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
      images: imageList,
      videoUrl,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
