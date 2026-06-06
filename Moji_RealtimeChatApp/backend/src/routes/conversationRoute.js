import express from "express";
import {
  createConversation,
  getConversations,
  getMessages,
  markAsSeen,
  leaveGroup,
  deleteGroup,
  addGroupMembers,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markAsSeen);

router.post("/:conversationId/leave", leaveGroup);
router.post("/:conversationId/members", addGroupMembers);
router.delete("/:conversationId", deleteGroup);

export default router;
