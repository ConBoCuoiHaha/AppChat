import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useFriendStore } from "./useFriendStore";
import { toast } from "sonner";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return; // tránh tạo nhiều socket

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
    });

    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: conversation.lastMessage.senderId,
          displayName: "",
          avatarUrl: null,
        },
      };

      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };

      if (useChatStore.getState().activeConversationId === message.conversationId) {
        useChatStore.getState().markAsSeen();
      }

      useChatStore.getState().updateConversation(updatedConversation);
    });

    // read message
    socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    // lời mời kết bạn mới (realtime)
    socket.on("friend-request", (request) => {
      useFriendStore.getState().addReceivedRequest(request);

      const senderName = request?.from?.displayName ?? "Ai đó";
      toast.info(`${senderName} đã gửi cho bạn lời mời kết bạn 👋`);
    });

    // lời mời kết bạn được chấp nhận (realtime) - cập nhật cho người gửi
    socket.on("friend-request-accepted", ({ newFriend }) => {
      useFriendStore.getState().addFriendToList(newFriend);

      const friendName = newFriend?.displayName ?? "Ai đó";
      toast.success(`${friendName} đã chấp nhận lời mời kết bạn của bạn 🎉`);
    });

    // bị xoá khỏi danh sách bạn bè (realtime)
    socket.on("friend-removed", ({ userId }) => {
      useFriendStore.getState().removeFriendFromList(userId);
    });

    // nhóm bị xoá (realtime)
    socket.on("group-deleted", ({ conversationId }) => {
      useChatStore.getState().removeConversation(conversationId);
    });

    // nhóm cập nhật (thêm/rời thành viên...) (realtime)
    socket.on("group-updated", (conversation) => {
      useChatStore.getState().upsertConversation(conversation);
      // đảm bảo socket vào room của nhóm (cho thành viên mới được thêm)
      socket.emit("join-conversation", conversation._id);
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
