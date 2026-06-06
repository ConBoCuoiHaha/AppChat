import { friendService } from "@/services/friendService";
import type { FriendState } from "@/types/store";
import { create } from "zustand";
import { toast } from "sonner";
import axios from "axios";

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  loading: false,
  receivedList: [],
  sentList: [],
  notificationOpen: false,
  setNotificationOpen: (open) => set({ notificationOpen: open }),
  addReceivedRequest: (request) =>
    set((state) =>
      state.receivedList.some((r) => r._id === request._id)
        ? state
        : { receivedList: [request, ...state.receivedList] }
    ),
  addFriendToList: (friend) =>
    set((state) =>
      !friend || state.friends.some((f) => f._id === friend._id)
        ? state
        : { friends: [...state.friends, friend] }
    ),
  searchUsers: async (query) => {
    try {
      set({ loading: true });

      const users = await friendService.searchUsers(query);

      return users ?? [];
    } catch (error) {
      console.error("Lỗi xảy ra khi tìm user", error);
      return [];
    } finally {
      set({ loading: false });
    }
  },
  addFriend: async (to, message) => {
    try {
      set({ loading: true });
      const resultMessage = await friendService.sendFriendRequest(to, message);
      toast.success(resultMessage || "Đã gửi lời mời kết bạn");
      return true;
    } catch (error) {
      console.error("Lỗi xảy ra khi addFriend", error);
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;
      toast.error(msg || "Gửi kết bạn không thành công");
      return false;
    } finally {
      set({ loading: false });
    }
  },
  getAllFriendRequests: async () => {
    try {
      set({ loading: true });

      const result = await friendService.getAllFriendRequest();

      if (!result) return;

      const { received, sent } = result;

      set({ receivedList: received, sentList: sent });
    } catch (error) {
      console.error("Lỗi xảy ra khi getAllFriendRequests", error);
    } finally {
      set({ loading: false });
    }
  },
  acceptRequest: async (requestId) => {
    try {
      set({ loading: true });
      const newFriend = await friendService.acceptRequest(requestId);

      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
        friends:
          newFriend && !state.friends.some((f) => f._id === newFriend._id)
            ? [...state.friends, newFriend]
            : state.friends,
      }));
    } catch (error) {
      console.error("Lỗi xảy ra khi acceptRequest", error);
    } finally {
      set({ loading: false });
    }
  },
  declineRequest: async (requestId) => {
    try {
      set({ loading: true });
      await friendService.declineRequest(requestId);

      set((state) => ({
        receivedList: state.receivedList.filter((r) => r._id !== requestId),
      }));
    } catch (error) {
      console.error("Lỗi xảy ra khi declineRequest", error);
    } finally {
      set({ loading: false });
    }
  },
  getFriends: async () => {
    try {
      set({ loading: true });
      const friends = await friendService.getFriendList();
      set({ friends: friends });
    } catch (error) {
      console.error("Lỗi xảy ra khi load friends", error);
      set({ friends: [] });
    } finally {
      set({ loading: false });
    }
  },
  removeFriendFromList: (friendId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f._id !== friendId),
    })),
  removeFriend: async (friendId) => {
    try {
      await friendService.removeFriend(friendId);
      set((state) => ({
        friends: state.friends.filter((f) => f._id !== friendId),
      }));
      toast.success("Đã xoá bạn bè");
    } catch (error) {
      console.error("Lỗi xảy ra khi xoá bạn bè", error);
      toast.error("Xoá bạn bè không thành công");
    }
  },
}));
