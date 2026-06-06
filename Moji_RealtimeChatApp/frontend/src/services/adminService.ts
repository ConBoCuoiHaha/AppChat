import api from "@/lib/axios";

export const adminService = {
  getStats: async () => (await api.get("/admin/stats")).data,

  getAnalytics: async (params: { from?: string; to?: string }) =>
    (await api.get("/admin/analytics", { params })).data,

  getUsers: async (params: {
    search?: string;
    page?: number;
    limit?: number;
    all?: boolean;
  }) => (await api.get("/admin/users", { params })).data,

  getUserDetail: async (id: string) =>
    (await api.get(`/admin/users/${id}`)).data,

  resetPassword: async (id: string, newPassword: string) =>
    (await api.post(`/admin/users/${id}/reset-password`, { newPassword })).data,

  toggleLock: async (id: string) =>
    (await api.patch(`/admin/users/${id}/lock`)).data,

  toggleRole: async (id: string) =>
    (await api.patch(`/admin/users/${id}/role`)).data,

  deleteUser: async (id: string) => (await api.delete(`/admin/users/${id}`)).data,

  getGroups: async (params: { search?: string; page?: number; limit?: number }) =>
    (await api.get("/admin/groups", { params })).data,

  getGroupDetail: async (id: string) =>
    (await api.get(`/admin/groups/${id}`)).data,

  deleteGroup: async (id: string) =>
    (await api.delete(`/admin/groups/${id}`)).data,
};
