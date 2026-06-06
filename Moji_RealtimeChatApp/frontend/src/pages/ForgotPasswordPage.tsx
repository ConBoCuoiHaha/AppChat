import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";

type Step = "email" | "code" | "password";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getError = (error: unknown) =>
    axios.isAxiosError(error) ? error.response?.data?.message : null;

  const handleSendCode = async () => {
    if (!email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }
    try {
      setLoading(true);
      await authService.forgotPassword(email.trim());
      toast.success("Đã gửi mã 4 số tới email của bạn");
      setStep("code");
    } catch (error) {
      toast.error(getError(error) || "Không gửi được mã. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.trim().length !== 4) {
      toast.error("Mã gồm 4 số");
      return;
    }
    try {
      setLoading(true);
      await authService.verifyResetCode(email.trim(), code.trim());
      setStep("password");
    } catch (error) {
      toast.error(getError(error) || "Mã không đúng hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
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
      await authService.resetPassword(email.trim(), code.trim(), newPassword);
      toast.success("Đặt lại mật khẩu thành công! Hãy đăng nhập lại.");
      navigate("/signin");
    } catch (error) {
      toast.error(getError(error) || "Đặt lại mật khẩu không thành công");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 absolute inset-0 z-0 bg-gradient-purple">
      <div className="w-full max-w-sm">
        <Card className="border-border">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center gap-2">
                <img
                  src="/logo.svg"
                  alt="logo"
                  className="size-10"
                />
                <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
                <p className="text-muted-foreground text-sm">
                  {step === "email" && "Nhập email để nhận mã xác nhận 4 số"}
                  {step === "code" && `Nhập mã 4 số đã gửi tới ${email}`}
                  {step === "password" && "Tạo mật khẩu mới cho tài khoản"}
                </p>
              </div>

              {step === "email" && (
                <div className="flex flex-col gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                  />
                  <Button onClick={handleSendCode} disabled={loading}>
                    {loading ? "Đang gửi..." : "Gửi mã"}
                  </Button>
                </div>
              )}

              {step === "code" && (
                <div className="flex flex-col gap-3">
                  <Label htmlFor="code">Mã xác nhận (4 số)</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="1234"
                    className="text-center text-2xl tracking-[0.5em]"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                  />
                  <Button onClick={handleVerifyCode} disabled={loading}>
                    {loading ? "Đang kiểm tra..." : "Xác nhận"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSendCode}
                    disabled={loading}
                  >
                    Gửi lại mã
                  </Button>
                </div>
              )}

              {step === "password" && (
                <div className="flex flex-col gap-3">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  />
                  <Button onClick={handleResetPassword} disabled={loading}>
                    {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
                  </Button>
                </div>
              )}

              <div className="text-center text-sm">
                <a href="/signin" className="underline underline-offset-4">
                  Quay lại đăng nhập
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
