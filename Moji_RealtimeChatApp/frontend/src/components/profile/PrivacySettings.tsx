import { useState } from "react";
import { Shield, Bell, ShieldBan } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import axios from "axios";

const PrivacySettings = () => {
  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập đầy đủ mật khẩu");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      await userService.changePassword(currentPassword, newPassword);
      toast.success("Đổi mật khẩu thành công");
      resetForm();
      setShowForm(false);
    } catch (error) {
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;
      toast.error(msg || "Đổi mật khẩu không thành công");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Quyền riêng tư & Bảo mật
        </CardTitle>
        <CardDescription>
          Quản lý cài đặt quyền riêng tư và bảo mật của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setShowForm((v) => !v)}
            className="w-full justify-start glass-light border-border/30 hover:text-warning"
          >
            <Shield className="h-4 w-4 mr-2" />
            Đổi mật khẩu
          </Button>

          {showForm && (
            <div className="space-y-3 rounded-lg border border-border/40 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="bg-gradient-primary"
                >
                  {loading ? "Đang lưu..." : "Lưu mật khẩu"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  disabled={loading}
                >
                  Huỷ
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full justify-start glass-light border-border/30 hover:text-info"
          >
            <Bell className="h-4 w-4 mr-2" />
            Cài đặt thông báo
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start glass-light border-border/30 hover:text-destructive"
          >
            <ShieldBan className="size-4 mr-2" />
            Chặn & Báo cáo
          </Button>
        </div>

        <div className="pt-4 border-t border-border/30">
          <h4 className="font-medium mb-3 text-destructive">Khu vực nguy hiểm</h4>
          <Button
            variant="destructive"
            className="w-full"
          >
            Xoá tài khoản
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;
