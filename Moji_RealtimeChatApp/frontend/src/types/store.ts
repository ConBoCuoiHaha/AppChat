import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearState: () => void;
  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
    phone: string
  ) => Promise<boolean>;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // infinite-scroll
      nextCursor?: string | null; // phân trang
    }
  >;
  activeConversationId: string | null;
  convoLoading: boolean;
  messageLoading: boolean;
  loading: boolean;
  reset: () => void;

  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    images?: string[],
    videoUrl?: string
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    images?: string[],
    videoUrl?: string
  ) => Promise<void>;
  // add message
  addMessage: (message: Message) => Promise<void>;
  // update convo
  updateConversation: (conversation: Partial<Conversation> & { _id: string }) => void;
  markAsSeen: () => Promise<void>;
  addConvo: (convo: Conversation) => void;
  upsertConversation: (convo: Partial<Conversation> & { _id: string }) => void;
  removeConversation: (conversationId: string) => void;
  leaveGroup: (conversationId: string) => Promise<void>;
  deleteGroup: (conversationId: string) => Promise<void>;
  addGroupMembers: (conversationId: string, memberIds: string[]) => Promise<void>;
  createConversation: (
    type: "group" | "direct",
    name: string,
    memberIds: string[]
  ) => Promise<void>;
}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  notificationOpen: boolean;
  setNotificationOpen: (open: boolean) => void;
  addReceivedRequest: (request: FriendRequest) => void;
  addFriendToList: (friend: Friend) => void;
  searchUsers: (query: string) => Promise<User[]>;
  addFriend: (to: string, message?: string) => Promise<boolean>;
  getAllFriendRequests: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  removeFriendFromList: (friendId: string) => void;
}

export interface UserState {
  updateAvatarUrl: (formData: FormData) => Promise<void>;
}
