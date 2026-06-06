import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
  const { accessToken, user, loading, refresh, fetchMe } = useAuthStore();
  const [starting, setStarting] = useState(true);

  const init = async () => {
    try {
      // có thể xảy ra khi refresh trang
      if (!accessToken) {
        await refresh();
      }

      if (accessToken && !user) {
        await fetchMe();
      }

      // tải lại danh sách hội thoại từ server mỗi khi mở/refresh app
      if (useAuthStore.getState().accessToken) {
        await useChatStore.getState().fetchConversations();
      }
    } catch (error) {
      console.error("Lỗi khi khởi tạo app", error);
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  if (starting || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Đang tải trang...
      </div>
    );
  }

  if (!accessToken) {
    return (
      <Navigate
        to="/signin"
        replace
      />
    );
  }

  return <Outlet></Outlet>;
};

export default ProtectedRoute;
