import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import pkg from "jsonwebtoken"; // Import jsonwebtoken as a default import
import { verifyJWT } from "../middlewares/auth.middleware.js";

const { verify } = pkg; // Destructure the `verify` method from jsonwebtoken

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)


export default router;
