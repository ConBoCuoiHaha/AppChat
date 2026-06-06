import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (
      !type ||
      (type === "group" && !name) ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" });
    }

    let conversation;

    if (type === "direct") {
      const participantId = memberIds[0];

      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [userId, participantId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          type: "direct",
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });

        await conversation.save();
      }
    }

    if (type === "group") {
      conversation = new Conversation({
        type: "group",
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: "Conversation type không hợp lệ" });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      {
        path: "seenBy",
        select: "displayName avatarUrl",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const participants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    if (type === "group") {
      memberIds.forEach((userId) => {
        io.to(userId).emit("new-group", formatted);
      });
    }

    if (type === "direct") {
      io.to(userId).emit("new-group", formatted);
      io.to(memberIds[0]).emit("new-group", formatted);
    }

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi tạo conversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "seenBy",
        select: "displayName avatarUrl",
      });

    const formatted = conversations.map((convo) => {
      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        joinedAt: p.joinedAt,
      }));

      return {
        ...convo.toObject(),
        unreadCounts: convo.unreadCounts || {},
        participants,
      };
    });

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy conversations", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const query = { conversationId };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }

    messages = messages.reverse();

    return res.status(200).json({
      messages,
      nextCursor,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy messages", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find(
      { "participants.userId": userId },
      { _id: 1 },
    );

    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Lỗi khi fetch conversations: ", error);
    return [];
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation không tồn tại" });
    }

    const last = conversation.lastMessage;

    if (!last) {
      return res.status(200).json({ message: "Không có tin nhắn để mark as seen" });
    }

    if (last.senderId.toString() === userId) {
      return res.status(200).json({ message: "Sender không cần mark as seen" });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { seenBy: userId },
        $set: { [`unreadCounts.${userId}`]: 0 },
      },
      {
        new: true,
      },
    );

    io.to(conversationId).emit("read-message", {
      conversation: updated,
      lastMessage: {
        _id: updated?.lastMessage._id,
        content: updated?.lastMessage.content,
        createdAt: updated?.lastMessage.createdAt,
        sender: {
          _id: updated?.lastMessage.senderId,
        },
      },
    });

    return res.status(200).json({
      message: "Marked as seen",
      seenBy: updated?.sennBy || [],
      myUnreadCount: updated?.unreadCounts[userId] || 0,
    });
  } catch (error) {
    console.error("Lỗi khi mark as seen", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Rời khỏi nhóm
export const leaveGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Không tìm thấy nhóm" });
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId
    );

    if (!isMember) {
      return res.status(403).json({ message: "Bạn không ở trong nhóm này" });
    }

    // bỏ người này khỏi nhóm
    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== userId
    );

    // nếu nhóm trống -> xoá luôn nhóm + tin nhắn
    if (conversation.participants.length === 0) {
      await Message.deleteMany({ conversationId });
      await Conversation.findByIdAndDelete(conversationId);
      io.to(conversationId).emit("group-deleted", { conversationId });
      return res.status(200).json({ message: "Đã rời nhóm" });
    }

    // nếu trưởng nhóm rời -> chuyển quyền cho thành viên còn lại đầu tiên
    if (conversation.group?.createdBy?.toString() === userId) {
      conversation.group.createdBy = conversation.participants[0].userId;
    }

    await conversation.save();

    // báo cho các thành viên còn lại cập nhật danh sách
    await conversation.populate({
      path: "participants.userId",
      select: "displayName avatarUrl",
    });
    const participants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    io.to(conversationId).emit("group-updated", {
      _id: conversation._id,
      participants,
      group: conversation.group,
    });

    return res.status(200).json({ message: "Đã rời nhóm" });
  } catch (error) {
    console.error("Lỗi khi rời nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Xoá nhóm (chỉ trưởng nhóm)
export const deleteGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Không tìm thấy nhóm" });
    }

    if (conversation.group?.createdBy?.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Chỉ trưởng nhóm mới được xoá nhóm" });
    }

    await Message.deleteMany({ conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    io.to(conversationId).emit("group-deleted", { conversationId });

    return res.status(200).json({ message: "Đã xoá nhóm" });
  } catch (error) {
    console.error("Lỗi khi xoá nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Thêm thành viên vào nhóm
export const addGroupMembers = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id.toString();

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Cần chọn thành viên để thêm" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Không tìm thấy nhóm" });
    }

    const existingIds = new Set(
      conversation.participants.map((p) => p.userId.toString())
    );

    if (!existingIds.has(userId)) {
      return res.status(403).json({ message: "Bạn không ở trong nhóm này" });
    }

    const toAdd = memberIds.filter((id) => !existingIds.has(id.toString()));

    if (toAdd.length === 0) {
      return res
        .status(400)
        .json({ message: "Các thành viên đã ở trong nhóm" });
    }

    toAdd.forEach((id) =>
      conversation.participants.push({ userId: id, joinedAt: new Date() })
    );
    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
    ]);

    const participants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    // báo cho cả thành viên cũ và mới
    io.to(conversationId).emit("group-updated", formatted);
    toAdd.forEach((id) =>
      io.to(id.toString()).emit("group-updated", formatted)
    );

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi thêm thành viên nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
