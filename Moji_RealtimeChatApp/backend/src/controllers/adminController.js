import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
import Session from "../models/Session.js";

// ===== THỐNG KÊ TỔNG QUAN =====
export const getStats = async (req, res) => {
  try {
    const [totalUsers, totalGroups, totalDirect, totalMessages, lockedUsers] =
      await Promise.all([
        User.countDocuments(),
        Conversation.countDocuments({ type: "group" }),
        Conversation.countDocuments({ type: "direct" }),
        Message.countDocuments(),
        User.countDocuments({ isLocked: true }),
      ]);

    // đăng ký theo tháng (12 tháng gần nhất)
    const byMonthRaw = await User.aggregate([
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
    ]);
    const byMonth = byMonthRaw.map((r) => ({
      label: `${String(r._id.m).padStart(2, "0")}/${r._id.y}`,
      year: r._id.y,
      month: r._id.m,
      count: r.count,
    }));

    // đăng ký theo năm
    const byYearRaw = await User.aggregate([
      { $group: { _id: { $year: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const byYear = byYearRaw.map((r) => ({ label: String(r._id), count: r.count }));

    return res.status(200).json({
      totals: {
        users: totalUsers,
        groups: totalGroups,
        direct: totalDirect,
        messages: totalMessages,
        locked: lockedUsers,
      },
      registrations: { byMonth, byYear },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê admin", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ===== PHÂN TÍCH THEO KHOẢNG THỜI GIAN =====
export const getAnalytics = async (req, res) => {
  try {
    const tz = "Asia/Ho_Chi_Minh";
    const to = req.query.to
      ? new Date(req.query.to + "T23:59:59.999")
      : new Date();
    const from = req.query.from
      ? new Date(req.query.from + "T00:00:00.000")
      : new Date(Date.now() - 13 * 24 * 60 * 60 * 1000); // mặc định 14 ngày

    // tin nhắn theo ngày
    const mpdRaw = await Message.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const messagesPerDay = mpdRaw.map((r) => {
      const [, m, d] = r._id.split("-");
      return { label: `${d}/${m}`, date: r._id, count: r.count };
    });

    // top user gửi nhiều tin nhắn nhất
    const topUsers = await Message.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$user._id",
          count: 1,
          displayName: "$user.displayName",
          username: "$user.username",
          avatarUrl: "$user.avatarUrl",
        },
      },
    ]);

    const [newUsers, totalMessages] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: from, $lte: to } }),
      Message.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    ]);

    return res
      .status(200)
      .json({ from, to, messagesPerDay, topUsers, newUsers, totalMessages });
  } catch (error) {
    console.error("Lỗi khi lấy phân tích", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ===== DANH SÁCH USER (tìm kiếm + phân trang + xuất CSV) =====
export const getUsers = async (req, res) => {
  try {
    const search = (req.query.search ?? "").toString().trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    let filter = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter = {
        $or: [
          { username: regex },
          { displayName: regex },
          { email: regex },
          { phone: search },
        ],
      };
    }

    // xuất CSV: trả về TẤT CẢ user khớp (không phân trang)
    if (req.query.all === "true" || req.query.all === "1") {
      const allUsers = await User.find(filter)
        .select("displayName username email phone role isLocked createdAt")
        .sort({ createdAt: -1 })
        .lean();
      return res
        .status(200)
        .json({ users: allUsers, total: allUsers.length, all: true });
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-hashedPassword")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách user", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ===== CHI TIẾT 1 USER =====
export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const user = await User.findById(id).select("-hashedPassword").lean();
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    const [friendsCount, groupsCount, messagesCount] = await Promise.all([
      Friend.countDocuments({ $or: [{ userA: id }, { userB: id }] }),
      Conversation.countDocuments({ type: "group", "participants.userId": id }),
      Message.countDocuments({ senderId: id }),
    ]);

    return res.status(200).json({
      user: { ...user, hasPassword: true },
      stats: { friendsCount, groupsCount, messagesCount },
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết user", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ===== ĐẶT LẠI MẬT KHẨU CHO USER =====
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    user.hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.save();

    // huỷ các phiên đăng nhập cũ của user đó
    await Session.deleteMany({ userId: id });

    return res.status(200).json({ message: "Đã đặt lại mật khẩu" });
  } catch (error) {
    console.error("Lỗi khi đặt lại mật khẩu", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ===== KHOÁ / MỞ KHOÁ USER =====
export const toggleLockUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "Không thể tự khoá chính mình" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    user.isLocked = !user.isLocked;
    await user.save();

    if (user.isLocked) {
      await Session.deleteMany({ userId: id }); // đẩy user ra khỏi phiên
    }

    return res
      .status(200)
      .json({ message: user.isLocked ? "Đã khoá tài khoản" : "Đã mở khoá", isLocked: user.isLocked });
  } catch (error) {
    console.error("Lỗi khi khoá/mở user", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ===== CẤP / GỠ QUYỀN ADMIN =====
export const toggleAdminRole = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Không thể tự đổi quyền của chính mình" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    user.role = user.role === "admin" ? "user" : "admin";
    await user.save();

    return res.status(200).json({ message: "Đã cập nhật quyền", role: user.role });
  } catch (error) {
    console.error("Lỗi khi đổi quyền user", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ===== XOÁ USER (kèm dọn dữ liệu liên quan) =====
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "Không thể tự xoá chính mình" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    // xoá các hội thoại direct của user + tin nhắn trong đó
    const directConvos = await Conversation.find({
      type: "direct",
      "participants.userId": id,
    }).select("_id");
    const directIds = directConvos.map((c) => c._id);
    await Message.deleteMany({ conversationId: { $in: directIds } });
    await Conversation.deleteMany({ _id: { $in: directIds } });

    // gỡ user khỏi các nhóm
    await Conversation.updateMany(
      { type: "group" },
      { $pull: { participants: { userId: id } } }
    );

    // dọn quan hệ
    await Promise.all([
      Friend.deleteMany({ $or: [{ userA: id }, { userB: id }] }),
      FriendRequest.deleteMany({ $or: [{ from: id }, { to: id }] }),
      Session.deleteMany({ userId: id }),
      Message.deleteMany({ senderId: id }),
      User.findByIdAndDelete(id),
    ]);

    return res.status(200).json({ message: "Đã xoá user" });
  } catch (error) {
    console.error("Lỗi khi xoá user", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ===== DANH SÁCH NHÓM =====
export const getGroups = async (req, res) => {
  try {
    const search = (req.query.search ?? "").toString().trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    let filter = { type: "group" };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter["group.name"] = new RegExp(escaped, "i");
    }

    const [groupsRaw, total] = await Promise.all([
      Conversation.find(filter)
        .populate("group.createdBy", "displayName username avatarUrl")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    const groups = groupsRaw.map((g) => ({
      _id: g._id,
      name: g.group?.name ?? "",
      memberCount: g.participants?.length ?? 0,
      creator: g.group?.createdBy ?? null,
      createdAt: g.createdAt,
      lastMessageAt: g.lastMessageAt,
    }));

    return res.status(200).json({
      groups,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ===== CHI TIẾT NHÓM (thành viên + trưởng nhóm) =====
export const getGroupDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const group = await Conversation.findOne({ _id: id, type: "group" })
      .populate("participants.userId", "displayName username avatarUrl email")
      .populate("group.createdBy", "displayName username")
      .lean();

    if (!group) return res.status(404).json({ message: "Không tìm thấy nhóm" });

    const creatorId = group.group?.createdBy?._id?.toString();
    const members = (group.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      username: p.userId?.username,
      avatarUrl: p.userId?.avatarUrl ?? null,
      email: p.userId?.email,
      joinedAt: p.joinedAt,
      isLeader: p.userId?._id?.toString() === creatorId,
    }));

    const messageCount = await Message.countDocuments({ conversationId: id });

    return res.status(200).json({
      group: {
        _id: group._id,
        name: group.group?.name ?? "",
        creator: group.group?.createdBy ?? null,
        createdAt: group.createdAt,
        memberCount: members.length,
        messageCount,
      },
      members,
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ===== XOÁ NHÓM =====
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Conversation.findOne({ _id: id, type: "group" });
    if (!group) return res.status(404).json({ message: "Không tìm thấy nhóm" });

    await Message.deleteMany({ conversationId: id });
    await Conversation.findByIdAndDelete(id);

    return res.status(200).json({ message: "Đã xoá nhóm" });
  } catch (error) {
    console.error("Lỗi khi xoá nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
