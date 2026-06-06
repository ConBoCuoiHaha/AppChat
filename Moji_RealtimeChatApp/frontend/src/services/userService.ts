import api from "@/lib/axios";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.post("/users/change-password", {
      currentPassword,
      newPassword,
    });
    return res.data;
  },

  updateProfile: async (data: {
    displayName?: string;
    phone?: string;
    bio?: string;
    email?: string;
  }) => {
    const res = await api.patch("/users/me", data);
    return res.data.user;
  },
};
