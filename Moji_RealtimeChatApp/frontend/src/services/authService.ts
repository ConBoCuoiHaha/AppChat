import api from "@/lib/axios";

export const authService = {
  signUp: async (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
    phone: string
  ) => {
    const res = await api.post(
      "/auth/signup",
      { username, password, email, firstName, lastName, phone },
      { withCredentials: true }
    );

    return res.data;
  },

  signIn: async (username: string, password: string) => {
    const res = await api.post(
      "auth/signin",
      { username, password },
      { withCredentials: true }
    );
    return res.data; // access token
  },

  signOut: async () => {
    return api.post("/auth/signout", { withCredentials: true });
  },

  fetchMe: async () => {
    const res = await api.get("/users/me", { withCredentials: true });
    return res.data.user;
  },

  refresh: async () => {
    const res = await api.post("/auth/refresh", { withCredentials: true });
    return res.data.accessToken;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },

  verifyResetCode: async (email: string, code: string) => {
    const res = await api.post("/auth/verify-reset-code", { email, code });
    return res.data;
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    const res = await api.post("/auth/reset-password", {
      email,
      code,
      newPassword,
    });
    return res.data;
  },
};
