import { Bell } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useFriendStore } from "@/stores/useFriendStore";
import FriendRequestDialog from "../friendRequest/FriendRequestDialog";

const NotificationsGroup = () => {
  const { receivedList, notificationOpen, setNotificationOpen } = useFriendStore();
  const count = receivedList?.length ?? 0;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="uppercase">thông báo</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setNotificationOpen(true)}
              className="cursor-pointer"
            >
              <span className="relative flex items-center justify-center">
                <Bell className="size-4" />
                {/* chấm đỏ báo có thông báo - giống Messenger, ẩn khi không có */}
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500 ring-2 ring-sidebar" />
                )}
              </span>

              <span>Lời mời kết bạn</span>

              {count > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>

      <FriendRequestDialog
        open={notificationOpen}
        setOpen={setNotificationOpen}
      />
    </SidebarGroup>
  );
};

export default NotificationsGroup;
