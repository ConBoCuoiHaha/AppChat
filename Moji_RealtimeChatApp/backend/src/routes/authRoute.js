import express from "express";
import {
  refreshToken,
  signIn,
  signOut,
  signUp,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import {
  signupSchema,
  signinSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
} from "../validations/authValidation.js";

const router = express.Router();

// LỚP 4: validate(schema) chạy TRƯỚC controller -> chặn dữ liệu sai ngay từ cổng vào
router.post("/signup", validate(signupSchema), signUp);

router.post("/signin", validate(signinSchema), signIn);

router.post("/signout", signOut); // dùng cookie, không có body cần validate

router.post("/refresh", refreshToken); // dùng cookie, không có body cần validate

router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/verify-reset-code", validate(verifyResetCodeSchema), verifyResetCode);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
