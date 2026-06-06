import express from "express";
import {
  authMe,
  searchUsers,
  uploadAvatar,
  changePassword,
  updateProfile,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUsers);
router.post("/change-password", changePassword);
router.patch("/me", updateProfile);
router.post(
  "/uploadAvatar",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadAvatar
);

export default router;
