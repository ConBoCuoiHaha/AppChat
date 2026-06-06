import { useState } from "react";
import { Navigate, Link } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DashboardUsers from "@/components/dashboard/DashboardUsers";
import DashboardGroups from "@/components/dashboard/DashboardGroups";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, UsersRound, ArrowLeft } from "lucide-react";

type Section = "overview" | "users" | "groups";

const DashboardPage = () => {
  const { user } = useAuthStore();
  const [section, setSection] = useState<Section>("overview");

  if (!user) return null;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  const nav = [
    { key: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { key: "users", label: "Người dùng", icon: Users },
    { key: "groups", label: "Nhóm chat", icon: UsersRound },
  ] as const;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="size-5 text-primary" />
            <h1 className="text-lg font-bold">Bảng điều khiển quản trị</h1>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-1" /> Về trang chat
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {nav.map((n) => (
            <Button
              key={n.key}
              variant={section === n.key ? "default" : "outline"}
              onClick={() => setSection(n.key)}
            >
              <n.icon className="size-4 mr-1" /> {n.label}
            </Button>
          ))}
        </div>

        {section === "overview" && <DashboardOverview />}
        {section === "users" && <DashboardUsers />}
        {section === "groups" && <DashboardGroups />}
      </div>
    </div>
  );
};

export default DashboardPage;
