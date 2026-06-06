import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "../ui/separator";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
import { useState } from "react";
import { MoreVertical, Users, LogOut, Trash2, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import GroupMembersDialog from "./GroupMembersDialog";
import { toast } from "sonner";

const ChatWindowHeader = ({ chat }: { chat?: Conversation }) => {
  const { conversations, activeConversationId, leaveGroup, deleteGroup } =
    useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const [membersOpen, setMembersOpen] = useState(false);

  let otherUser;

  chat = chat ?? conversations.find((c) => c._id === activeConversationId);

  if (!chat) {
    return (
      <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
      </header>
    );
  }

  if (chat.type === "direct") {
    const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if (!user || !otherUser) return;
  }

  const activeChat = chat;
  const isGroup = activeChat.type === "group";
  const isCreator = isGroup && activeChat.group?.createdBy === user?._id;

  const handleLeave = async () => {
    if (window.confirm("Bạn có chắc muốn rời nhóm này?")) {
      await leaveGroup(activeChat._id);
      toast.success("Đã rời nhóm");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Xoá nhóm này? Toàn bộ tin nhắn trong nhóm sẽ bị xoá.")) {
      await deleteGroup(activeChat._id);
      toast.success("Đã xoá nhóm");
    }
  };

  return (
    <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background">
      <div className="flex items-center gap-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />

        <div className="p-2 w-full flex items-center gap-3">
          {/* avatar */}
          <div className="relative">
            {activeChat.type === "direct" ? (
              <>
                <UserAvatar
                  type={"sidebar"}
                  name={otherUser?.displayName || "Hưng-SieuNhan"}
                  avatarUrl={otherUser?.avatarUrl || undefined}
                />
                <StatusBadge
                  status={
                    onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"
                  }
                />
              </>
            ) : (
              <GroupChatAvatar
                participants={activeChat.participants}
                type="sidebar"
              />
            )}
          </div>

          {/* name */}
          <h2 className="font-semibold text-foreground">
            {activeChat.type === "direct"
              ? otherUser?.displayName
              : activeChat.group?.name}
          </h2>

          {/* menu nhóm */}
          {isGroup && (
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    title="Tuỳ chọn nhóm"
                    className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth"
                  >
                    <MoreVertical className="size-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMembersOpen(true)}>
                    <Users className="size-4 mr-2" />
                    Xem thành viên
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMembersOpen(true)}>
                    <UserPlus className="size-4 mr-2" />
                    Thêm thành viên
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLeave}>
                    <LogOut className="size-4 mr-2" />
                    Rời nhóm
                  </DropdownMenuItem>
                  {isCreator && (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Xoá nhóm
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {isGroup && (
        <GroupMembersDialog
          open={membersOpen}
          setOpen={setMembersOpen}
          chat={activeChat}
        />
      )}
    </header>
  );
};

export default ChatWindowHeader;
