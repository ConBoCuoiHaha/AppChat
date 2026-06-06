import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import type { Conversation } from "@/types/chat";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

// Dọn dữ liệu cũ: trước đây từng persist conversations (kèm avatar base64) gây
// vượt dung lượng localStorage. Giờ luôn tải hội thoại từ server nên không cần nữa.
if (typeof localStorage !== "undefined") {
  localStorage.removeItem("chat-storage");
}

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: [],
  messages: {},
      activeConversationId: null,
      convoLoading: false, // convo loading
      messageLoading: false,
      loading: false,

      setActiveConversation: (id) => set({ activeConversationId: id }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
        });
      },
      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();

          set({ conversations, convoLoading: false });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchConversations:", error);
          set({ convoLoading: false });
        }
      },
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();

        const convoId = conversationId ?? activeConversationId;

        if (!convoId) return;

        const current = messages?.[convoId];
        const nextCursor =
          current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        set({ messageLoading: true });

        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor
          );

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));

          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            // chống trùng theo _id (phòng khi fetch bị gọi 2 lần)
            const existingIds = new Set(prev.map((m) => m._id));
            const newOnes = processed.filter((m) => !existingIds.has(m._id));
            const merged = [...newOnes, ...prev];

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchMessages:", error);
        } finally {
          set({ messageLoading: false });
        }
      },
      sendDirectMessage: async (recipientId, content, images, videoUrl) => {
        try {
          const { activeConversationId } = get();
          await chatService.sendDirectMessage(
            recipientId,
            content,
            images,
            activeConversationId || undefined,
            videoUrl
          );
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi direct message", error);
        }
      },
      sendGroupMessage: async (conversationId, content, images, videoUrl) => {
        try {
          await chatService.sendGroupMessage(
            conversationId,
            content,
            images,
            videoUrl
          );
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === get().activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra gửi group message", error);
        }
      },
      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();

          message.isOwn = message.senderId === user?._id;

          const convoId = message.conversationId;

          let prevItems = get().messages[convoId]?.items ?? [];

          if (prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[convoId]?.items ?? [];
          }

          set((state) => {
            if (prevItems.some((m) => m._id === message._id)) {
              return state;
            }

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: [...prevItems, message],
                  hasMore: state.messages[convoId].hasMore,
                  nextCursor: state.messages[convoId].nextCursor ?? undefined,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy khi ra add message:", error);
        }
      },
      updateConversation: (conversation) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c
          ),
        }));
      },
      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) {
            return;
          }

          const convo = conversations.find((c) => c._id === activeConversationId);

          if (!convo) {
            return;
          }

          if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
            return;
          }

          await chatService.markAsSeen(activeConversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? {
                    ...c,
                    unreadCounts: {
                      ...c.unreadCounts,
                      [user._id]: 0,
                    },
                  }
                : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi markAsSeen trong store", error);
        }
      },
      addConvo: (convo) => {
        set((state) => {
          const exists = state.conversations.some(
            (c) => c._id.toString() === convo._id.toString()
          );

          return {
            conversations: exists
              ? state.conversations
              : [convo, ...state.conversations],
            activeConversationId: convo._id,
          };
        });
      },
      upsertConversation: (convo) =>
        set((state) => {
          const exists = state.conversations.some((c) => c._id === convo._id);
          return {
            conversations: exists
              ? state.conversations.map((c) =>
                  c._id === convo._id ? { ...c, ...convo } : c
                )
              : [convo as Conversation, ...state.conversations],
          };
        }),
      removeConversation: (conversationId) =>
        set((state) => ({
          conversations: state.conversations.filter(
            (c) => c._id !== conversationId
          ),
          activeConversationId:
            state.activeConversationId === conversationId
              ? null
              : state.activeConversationId,
        })),
      addGroupMembers: async (conversationId, memberIds) => {
        try {
          const conversation = await chatService.addGroupMembers(
            conversationId,
            memberIds
          );
          get().upsertConversation(conversation);
        } catch (error) {
          console.error("Lỗi khi thêm thành viên nhóm", error);
        }
      },
      leaveGroup: async (conversationId) => {
        try {
          await chatService.leaveGroup(conversationId);
          get().removeConversation(conversationId);
        } catch (error) {
          console.error("Lỗi khi rời nhóm", error);
        }
      },
      deleteGroup: async (conversationId) => {
        try {
          await chatService.deleteGroup(conversationId);
          get().removeConversation(conversationId);
        } catch (error) {
          console.error("Lỗi khi xoá nhóm", error);
        }
      },
      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(
            type,
            name,
            memberIds
          );

          get().addConvo(conversation);

          useSocketStore
            .getState()
            .socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi createConversation trong store", error);
        } finally {
          set({ loading: false });
        }
      },
    })
);
