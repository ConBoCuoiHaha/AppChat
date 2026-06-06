import { useState } from "react";
import { Heart } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import axios from "axios";

type Props = {
  userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
  const { setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(userInfo?.displayName ?? "");
  const [email, setEmail] = useState(userInfo?.email ?? "");
  const [phone, setPhone] = useState(userInfo?.phone ?? "");
  const [bio, setBio] = useState(userInfo?.bio ?? "");
  const [loading, setLoading] = useState(false);

  if (!userInfo) return null;

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await userService.updateProfile({
        displayName,
        email,
        phone,
        bio,
      });
      setUser(updated);
      toast.success("Cập nhật hồ sơ thành công");
    } catch (error) {
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;
      toast.error(msg || "Cập nhật không thành công");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>
        <CardDescription>
          Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Tên hiển thị</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="glass-light border-border/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Tên người dùng</Label>
            <Input
              id="username"
              value={userInfo.username}
              disabled
              className="glass-light border-border/30 opacity-70"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-light border-border/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              placeholder="Chưa có - thêm số điện thoại"
              onChange={(e) => setPhone(e.target.value)}
              className="glass-light border-border/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Giới thiệu</Label>
          <Textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="glass-light border-border/30 resize-none"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
