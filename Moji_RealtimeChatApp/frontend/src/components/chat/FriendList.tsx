import { useEffect } from "react";
import { Users, MoreHorizontal, UserMinus } from "lucide-react";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";
import ChatCard from "./ChatCard";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import UnreadCountBadge from "./UnreadCountBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { Friend } from "@/types/user";

const FriendList = () => {
  const { friends, getFriends, removeFriend } = useFriendStore();
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    createConversation,
  } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();

  useEffect(() => {
    getFriends();
  }, []);

  if (!user) return null;

  const handleRemove = (friend: Friend) => {
    const ok = window.confirm(`Xoá ${friend.displayName} khỏi danh sách bạn bè?`);
    if (ok) {
      removeFriend(friend._id);
    }
  };

  // Tìm cuộc hội thoại direct (1-1) đang có với người bạn này (nếu có)
  const findConvo = (friendId: string) =>
    conversations.find(
      (c) => c.type === "direct" && c.participants?.some((p) => p._id === friendId)
    );

  const handleSelect = async (friendId: string) => {
    const convo = findConvo(friendId);
    if (convo) {
      // ChatWindowBody sẽ tự tải tin nhắn khi hội thoại được mở
      setActiveConversation(convo._id);
    } else {
      // chưa từng nhắn tin -> tạo hội thoại mới
      await createConversation("direct", "", [friendId]);
    }
  };

  if (!friends || friends.length === 0) {
    return (
      <div className="text-center py-6 px-2 text-muted-foreground text-sm">
        <Users className="size-8 mx-auto mb-2 opacity-50" />
        Chưa có bạn bè nào. Hãy kết bạn để bắt đầu trò chuyện!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {friends.map((friend) => {
        const convo = findConvo(friend._id);
        const lastMessage = convo?.lastMessage?.content ?? "";
        const unreadCount = convo ? convo.unreadCounts?.[user._id] ?? 0 : 0;

        return (
          <ChatCard
            key={friend._id}
            convoId={convo?._id ?? friend._id}
            name={friend.displayName}
            isActive={!!convo && activeConversationId === convo._id}
            onSelect={() => handleSelect(friend._id)}
            unreadCount={unreadCount}
            leftSection={
              <>
                <UserAvatar
                  type="sidebar"
                  name={friend.displayName}
                  avatarUrl={friend.avatarUrl}
                />
                <StatusBadge
                  status={onlineUsers.includes(friend._id) ? "online" : "offline"}
                />
                {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
              </>
            }
            subtitle={
              <p className="text-sm truncate text-muted-foreground">
                {lastMessage || `@${friend.username}`}
              </p>
            }
            action={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center size-6 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(friend);
                    }}
                  >
                    <UserMinus className="size-4 mr-2" />
                    Xoá bạn bè
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        );
      })}
    </div>
  );
};

export default FriendList;
