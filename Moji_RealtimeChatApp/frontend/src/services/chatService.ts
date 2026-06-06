import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";

interface FetchMessageProps {
  messages: Message[];
  cursor?: string;
}

const pageLimit = 50;

export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },

  async fetchMessages(id: string, cursor?: string): Promise<FetchMessageProps> {
    const res = await api.get(
      `/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor}`
    );

    return { messages: res.data.messages, cursor: res.data.nextCursor };
  },

  async sendDirectMessage(
    recipientId: string,
    content: string = "",
    images?: string[],
    conversationId?: string,
    videoUrl?: string
  ) {
    const res = await api.post("/messages/direct", {
      recipientId,
      content,
      images,
      conversationId,
      videoUrl,
    });

    return res.data.message;
  },

  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    images?: string[],
    videoUrl?: string
  ) {
    const res = await api.post("/messages/group", {
      conversationId,
      content,
      images,
      videoUrl,
    });
    return res.data.message;
  },

  // upload video -> trả về đường dẫn tương đối (vd /uploads/xxx.mp4)
  async uploadVideo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("video", file);
    const res = await api.post("/messages/upload-video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url;
  },

  // upload nhiều ảnh -> trả về danh sách đường dẫn
  async uploadImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    const res = await api.post("/messages/upload-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.urls;
  },

  async markAsSeen(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/seen`);
    return res.data;
  },

  async createConversation(
    type: "direct" | "group",
    name: string,
    memberIds: string[]
  ) {
    const res = await api.post("/conversations", { type, name, memberIds });
    return res.data.conversation;
  },

  async leaveGroup(conversationId: string) {
    await api.post(`/conversations/${conversationId}/leave`);
  },

  async deleteGroup(conversationId: string) {
    await api.delete(`/conversations/${conversationId}`);
  },

  async addGroupMembers(conversationId: string, memberIds: string[]) {
    const res = await api.post(`/conversations/${conversationId}/members`, {
      memberIds,
    });
    return res.data.conversation;
  },
};
