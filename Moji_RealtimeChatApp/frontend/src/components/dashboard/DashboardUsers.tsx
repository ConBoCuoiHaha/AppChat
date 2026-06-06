import { useCallback, useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { useAuthStore } from "@/stores/useAuthStore";
import type { User } from "@/types/user";
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
import axios from "axios";
import {
  Search,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  Shield,
  ShieldOff,
  Eye,
  Download,
} from "lucide-react";

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("vi-VN") : "-";

const DashboardUsers = () => {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<{ user: User; stats: any } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers({ search, page, limit: 10 });
      setUsers(data.users);
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

  const apiErr = (e: unknown) =>
    axios.isAxiosError(e) ? e.response?.data?.message : null;

  const onResetPassword = async (u: User) => {
    const pw = window.prompt(`Nhập mật khẩu MỚI (≥ 6 ký tự) cho ${u.displayName}:`);
    if (!pw) return;
    try {
      await adminService.resetPassword(u._id, pw);
      toast.success("Đã đặt lại mật khẩu");
    } catch (e) {
      toast.error(apiErr(e) || "Lỗi khi đặt lại mật khẩu");
    }
  };

  const onToggleLock = async (u: User) => {
    if (!window.confirm(`${u.isLocked ? "Mở khoá" : "Khoá"} tài khoản ${u.displayName}?`))
      return;
    try {
      await adminService.toggleLock(u._id);
      toast.success(u.isLocked ? "Đã mở khoá" : "Đã khoá");
      load();
    } catch (e) {
      toast.error(apiErr(e) || "Lỗi");
    }
  };

  const onToggleRole = async (u: User) => {
    const makeAdmin = u.role !== "admin";
    if (!window.confirm(`${makeAdmin ? "Cấp quyền admin cho" : "Gỡ quyền admin của"} ${u.displayName}?`))
      return;
    try {
      await adminService.toggleRole(u._id);
      toast.success("Đã cập nhật quyền");
      load();
    } catch (e) {
      toast.error(apiErr(e) || "Lỗi");
    }
  };

  const onDelete = async (u: User) => {
    if (!window.confirm(`XOÁ vĩnh viễn tài khoản ${u.displayName}? Hành động không thể hoàn tác.`))
      return;
    try {
      await adminService.deleteUser(u._id);
      toast.success("Đã xoá user");
      load();
    } catch (e) {
      toast.error(apiErr(e) || "Lỗi khi xoá");
    }
  };

  const openDetail = async (u: User) => {
    try {
      const data = await adminService.getUserDetail(u._id);
      setDetail(data);
    } catch (e) {
      toast.error("Không tải được chi tiết");
    }
  };

  const exportCsv = async () => {
    try {
      const data = await adminService.getUsers({ search, all: true });
      const header = [
        "Tên hiển thị",
        "Username",
        "Email",
        "SĐT",
        "Quyền",
        "Trạng thái",
        "Ngày tạo",
      ];
      const rows = (data.users as User[]).map((u) => [
        u.displayName,
        u.username,
        u.email,
        u.phone || "",
        u.role === "admin" ? "Admin" : "User",
        u.isLocked ? "Đã khoá" : "Hoạt động",
        fmtDate(u.createdAt),
      ]);
      const csv = [header, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      // thêm BOM để Excel đọc đúng tiếng Việt (UTF-8)
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${data.users.length} người dùng`);
    } catch (e) {
      toast.error("Lỗi khi xuất CSV");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
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
            placeholder="Tìm theo tên, username, email, SĐT..."
            className="max-w-sm"
          />
          <Button type="submit" disabled={loading}>
            <Search className="size-4 mr-1" /> Tìm
          </Button>
        </form>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="size-4 mr-1" /> Xuất CSV
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left">
              <th className="p-3">Người dùng</th>
              <th className="p-3">Email</th>
              <th className="p-3">SĐT</th>
              <th className="p-3">Quyền</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Ngày tạo</th>
              <th className="p-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u._id === me?._id;
              return (
                <tr key={u._id} className="border-b hover:bg-muted/20">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar type="chat" name={u.displayName} avatarUrl={u.avatarUrl} />
                      <div>
                        <p className="font-medium">{u.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.phone || "-"}</td>
                  <td className="p-3">
                    {u.role === "admin" ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                        Admin
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">User</span>
                    )}
                  </td>
                  <td className="p-3">
                    {u.isLocked ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 font-medium">
                        Đã khoá
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 font-medium">
                        Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Xem chi tiết" onClick={() => openDetail(u)}>
                        <Eye className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Đặt lại mật khẩu" onClick={() => onResetPassword(u)}>
                        <KeyRound className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={u.isLocked ? "Mở khoá" : "Khoá"}
                        disabled={isSelf}
                        onClick={() => onToggleLock(u)}
                      >
                        {u.isLocked ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={u.role === "admin" ? "Gỡ quyền admin" : "Cấp quyền admin"}
                        disabled={isSelf}
                        onClick={() => onToggleRole(u)}
                      >
                        {u.role === "admin" ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Xoá"
                        disabled={isSelf}
                        onClick={() => onDelete(u)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Không có người dùng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Tổng: {total} người dùng</p>
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

      {/* Dialog chi tiết user */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar type="profile" name={detail.user.displayName} avatarUrl={detail.user.avatarUrl} />
                <div>
                  <p className="font-semibold text-lg">{detail.user.displayName}</p>
                  <p className="text-sm text-muted-foreground">@{detail.user.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Info label="Email" value={detail.user.email} />
                <Info label="Số điện thoại" value={detail.user.phone || "-"} />
                <Info label="Quyền" value={detail.user.role === "admin" ? "Admin" : "User"} />
                <Info label="Trạng thái" value={detail.user.isLocked ? "Đã khoá" : "Hoạt động"} />
                <Info label="Mật khẩu" value="•••••• (đã mã hoá, không thể xem)" />
                <Info label="Ngày tạo" value={fmtDate(detail.user.createdAt)} />
                <Info label="Bạn bè" value={String(detail.stats.friendsCount)} />
                <Info label="Số nhóm" value={String(detail.stats.groupsCount)} />
                <Info label="Tin nhắn đã gửi" value={String(detail.stats.messagesCount)} />
              </div>
              {detail.user.bio && (
                <Info label="Giới thiệu" value={detail.user.bio} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-medium break-words">{value}</p>
  </div>
);

export default DashboardUsers;
