import express from "express";

import {
  sendDirectMessage,
  sendGroupMessage,
  uploadVideoFile,
  uploadImageFiles,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";
import { uploadVideo, uploadImages } from "../middlewares/videoUploadMiddleware.js";

const router = express.Router();

router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);

// upload video -> trả về đường dẫn để gửi kèm tin nhắn
router.post(
  "/upload-video",
  (req, res, next) => {
    uploadVideo.single("video")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadVideoFile
);

// upload nhiều ảnh -> trả về danh sách đường dẫn
router.post(
  "/upload-images",
  (req, res, next) => {
    uploadImages.array("images", 6)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadImageFiles
);

export default router;
