import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Search, UserPlus } from "lucide-react";
import type { User } from "@/types/user";
import { useFriendStore } from "@/stores/useFriendStore";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import UserAvatar from "./UserAvatar";

const AddFriendModal = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[] | null>(null); // null = chưa tìm
  const [sentIds, setSentIds] = useState<string[]>([]);
  const { loading, searchUsers, addFriend } = useFriendStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const users = await searchUsers(q);
    setResults(users);
  };

  const handleAdd = async (u: User) => {
    const ok = await addFriend(u._id);
    if (ok) setSentIds((prev) => [...prev, u._id]);
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setQuery("");
          setResults(null);
          setSentIds([]);
        }
      }}
    >
      <DialogTrigger asChild>
        <div className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10">
          <UserPlus className="size-4" />
          <span className="sr-only">Kết bạn</span>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] border-none">
        <DialogHeader>
          <DialogTitle>Kết Bạn</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSearch}
          className="flex gap-2"
        >
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập tên hoặc số điện thoại..."
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-gradient-chat text-white hover:opacity-90"
          >
            {loading ? (
              "Đang tìm..."
            ) : (
              <>
                <Search className="size-4 mr-1" /> Tìm
              </>
            )}
          </Button>
        </form>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {results !== null && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Không tìm thấy người dùng nào
            </p>
          )}

          {results?.map((u) => (
            <div
              key={u._id}
              className="flex items-center gap-3 p-2 rounded-lg border border-border/40"
            >
              <UserAvatar
                type="sidebar"
                name={u.displayName}
                avatarUrl={u.avatarUrl}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{u.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  @{u.username}
                  {u.phone ? ` · ${u.phone}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                disabled={loading || sentIds.includes(u._id)}
                onClick={() => handleAdd(u)}
              >
                {sentIds.includes(u._id) ? "Đã gửi" : "Kết bạn"}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;
