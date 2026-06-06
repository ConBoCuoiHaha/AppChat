import { useCallback, useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserAvatar from "../chat/UserAvatar";
import {
  Users,
  MessageSquare,
  UsersRound,
  Lock,
  UserPlus,
  Send,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Stats {
  totals: { users: number; groups: number; messages: number; locked: number };
  registrations: {
    byMonth: { label: string; count: number }[];
    byYear: { label: string; count: number }[];
  };
}

interface Analytics {
  messagesPerDay: { label: string; date: string; count: number }[];
  topUsers: {
    _id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
    count: number;
  }[];
  newUsers: number;
  totalMessages: number;
}

const toYMD = (d: Date) => {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};

const DashboardOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [from, setFrom] = useState(toYMD(new Date(Date.now() - 13 * 86400000)));
  const [to, setTo] = useState(toYMD(new Date()));

  useEffect(() => {
    adminService.getStats().then(setStats).catch(console.error);
  }, []);

  const loadAnalytics = useCallback(() => {
    adminService.getAnalytics({ from, to }).then(setAnalytics).catch(console.error);
  }, [from, to]);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stats) {
    return <p className="text-muted-foreground">Đang tải thống kê...</p>;
  }

  const cards = [
    { label: "Tổng người dùng", value: stats.totals.users, icon: Users, color: "text-blue-500" },
    { label: "Tổng nhóm chat", value: stats.totals.groups, icon: UsersRound, color: "text-green-500" },
    { label: "Tổng tin nhắn", value: stats.totals.messages, icon: MessageSquare, color: "text-purple-500" },
    { label: "Tài khoản bị khoá", value: stats.totals.locked, icon: Lock, color: "text-red-500" },
  ];

  const maxTop = analytics?.topUsers?.[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Thẻ tổng quan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-4 flex items-center gap-3">
            <c.icon className={`size-8 ${c.color}`} />
            <div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Biểu đồ đăng ký (toàn thời gian) */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Đăng ký mới theo tháng</h3>
          {stats.registrations.byMonth.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.registrations.byMonth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" name="Số đăng ký" fill="#0084FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Đăng ký mới theo năm</h3>
          {stats.registrations.byYear.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.registrations.byYear}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" name="Số đăng ký" fill="#00B2FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Bộ lọc theo khoảng thời gian */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Từ ngày</p>
            <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Đến ngày</p>
            <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <Button onClick={loadAnalytics}>Áp dụng</Button>

          {analytics && (
            <div className="ml-auto flex gap-4">
              <div className="flex items-center gap-2">
                <UserPlus className="size-5 text-green-500" />
                <div>
                  <p className="font-bold">{analytics.newUsers}</p>
                  <p className="text-xs text-muted-foreground">User mới</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Send className="size-5 text-blue-500" />
                <div>
                  <p className="font-bold">{analytics.totalMessages}</p>
                  <p className="text-xs text-muted-foreground">Tin nhắn</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Tin nhắn theo ngày + Top user */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Tin nhắn theo ngày</h3>
          {!analytics || analytics.messagesPerDay.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có tin nhắn trong khoảng này</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics.messagesPerDay}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Tin nhắn"
                  stroke="#0084FF"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Top user hoạt động (gửi nhiều tin nhất)</h3>
          {!analytics || analytics.topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
          ) : (
            <div className="space-y-2">
              {analytics.topUsers.map((u, i) => (
                <div key={u._id} className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <UserAvatar type="chat" name={u.displayName} avatarUrl={u.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.displayName}</p>
                    <div className="h-1.5 rounded-full bg-muted mt-1">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${(u.count / maxTop) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">{u.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
