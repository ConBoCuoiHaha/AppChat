import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import type { Conversation } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import { useSocketStore } from "@/stores/useSocketStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import { Button } from "../ui/button";
import { UserPlus } from "lucide-react";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  chat: Conversation;
}

const GroupMembersDialog = ({ open, setOpen, chat }: Props) => {
  const { onlineUsers } = useSocketStore();
  const { friends, getFriends } = useFriendStore();
  const { addGroupMembers } = useChatStore();
  const creatorId = chat.group?.createdBy;

  useEffect(() => {
    if (open) getFriends();
  }, [open]);

  const memberIds = new Set(chat.participants.map((p) => p._id));
  const addableFriends = friends.filter((f) => !memberIds.has(f._id));

  const handleAdd = (friendId: string) => {
    addGroupMembers(chat._id, [friendId]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Thành viên nhóm ({chat.participants.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {chat.participants.map((p) => (
            <div
              key={p._id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40"
            >
              <div className="relative">
                <UserAvatar
                  type="chat"
                  name={p.displayName}
                  avatarUrl={p.avatarUrl ?? undefined}
                />
                <StatusBadge
                  status={onlineUsers.includes(p._id) ? "online" : "offline"}
                />
              </div>

              <p className="flex-1 min-w-0 font-medium truncate">
                {p.displayName}
              </p>

              {creatorId === p._id && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium whitespace-nowrap">
                  Trưởng nhóm
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Thêm bạn bè vào nhóm */}
        {addableFriends.length > 0 && (
          <div className="border-t border-border/40 pt-3">
            <p className="text-sm font-medium mb-2">Thêm bạn bè vào nhóm</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {addableFriends.map((f) => (
                <div
                  key={f._id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40"
                >
                  <UserAvatar
                    type="chat"
                    name={f.displayName}
                    avatarUrl={f.avatarUrl}
                  />
                  <p className="flex-1 min-w-0 truncate">{f.displayName}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdd(f._id)}
                  >
                    <UserPlus className="size-4 mr-1" />
                    Thêm
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupMembersDialog;
