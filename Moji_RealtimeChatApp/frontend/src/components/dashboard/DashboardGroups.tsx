import { useCallback, useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserAvatar from "../chat/UserAvatar";
import { toast } from "sonner";
import { Search, Eye, Trash2, Crown } from "lucide-react";

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("vi-VN") : "-";

interface GroupRow {
  _id: string;
  name: string;
  memberCount: number;
  creator: { displayName?: string; username?: string } | null;
  createdAt?: string;
}

const DashboardGroups = () => {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getGroups({ search, page, limit: 10 });
      setGroups(data.groups);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id: string) => {
    try {
      const data = await adminService.getGroupDetail(id);
      setDetail(data);
    } catch (e) {
      toast.error("Không tải được chi tiết nhóm");
    }
  };

  const onDelete = async (g: GroupRow) => {
    if (!window.confirm(`XOÁ nhóm "${g.name}" và toàn bộ tin nhắn? Không thể hoàn tác.`))
      return;
    try {
      await adminService.deleteGroup(g._id);
      toast.success("Đã xoá nhóm");
      load();
    } catch (e) {
      toast.error("Lỗi khi xoá nhóm");
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
        className="flex gap-2"
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm nhóm theo tên..."
          className="max-w-sm"
        />
        <Button type="submit" disabled={loading}>
          <Search className="size-4 mr-1" /> Tìm
        </Button>
      </form>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left">
              <th className="p-3">Tên nhóm</th>
              <th className="p-3">Số thành viên</th>
              <th className="p-3">Trưởng nhóm</th>
              <th className="p-3">Ngày tạo</th>
              <th className="p-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g._id} className="border-b hover:bg-muted/20">
                <td className="p-3 font-medium">{g.name}</td>
                <td className="p-3">{g.memberCount} thành viên</td>
                <td className="p-3">
                  {g.creator ? (
                    <span className="flex items-center gap-1">
                      <Crown className="size-3.5 text-yellow-500" />
                      {g.creator.displayName}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{fmtDate(g.createdAt)}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" title="Xem thành viên" onClick={() => openDetail(g._id)}>
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Xoá nhóm"
                      onClick={() => onDelete(g)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Không có nhóm nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Tổng: {total} nhóm</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <span className="text-sm">
            Trang {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Sau
          </Button>
        </div>
      </div>

      {/* Dialog chi tiết nhóm */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{detail?.group?.name}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Số thành viên</p>
                  <p className="font-medium">{detail.group.memberCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Số tin nhắn</p>
                  <p className="font-medium">{detail.group.messageCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trưởng nhóm</p>
                  <p className="font-medium">{detail.group.creator?.displayName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">{fmtDate(detail.group.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Danh sách thành viên</p>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {detail.members.map((m: any) => (
                    <div key={m._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40">
                      <UserAvatar type="chat" name={m.displayName} avatarUrl={m.avatarUrl} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{m.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">@{m.username}</p>
                      </div>
                      {m.isLeader && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-600 font-medium whitespace-nowrap">
                          <Crown className="size-3" /> Trưởng nhóm
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardGroups;
