import express from "express";
import { requireAdmin } from "../middlewares/adminMiddleware.js";
import {
  getStats,
  getAnalytics,
  getUsers,
  getUserDetail,
  resetUserPassword,
  toggleLockUser,
  toggleAdminRole,
  deleteUser,
  getGroups,
  getGroupDetail,
  deleteGroup,
} from "../controllers/adminController.js";

const router = express.Router();

// tất cả route admin đều phải là admin (protectedRoute đã chạy trước ở server.js)
router.use(requireAdmin);

router.get("/stats", getStats);
router.get("/analytics", getAnalytics);

router.get("/users", getUsers);
router.get("/users/:id", getUserDetail);
router.post("/users/:id/reset-password", resetUserPassword);
router.patch("/users/:id/lock", toggleLockUser);
router.patch("/users/:id/role", toggleAdminRole);
router.delete("/users/:id", deleteUser);

router.get("/groups", getGroups);
router.get("/groups/:id", getGroupDetail);
router.delete("/groups/:id", deleteGroup);

export default router;
