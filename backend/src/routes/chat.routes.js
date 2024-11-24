import { Router } from "express";
import { sendMessage, getChatById, getChats, markAsRead, createGroup, editGroupSettings, addGroupParticipant, removeGroupParticipant, deleteGroup } from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/send-message").post(upload.single("media"), sendMessage);

router.route("/get-chat/:chatId").get(getChatById);

router.route("/get-chats").get(getChats);

router.route("/mark-as-read").post(markAsRead);

router.route("/create-group").post(upload.single("groupProfilePic"), createGroup);

router.route("/edit-group/:chatId").post(upload.single("groupProfilePic"), editGroupSettings);

router.route("/group/add/:chatId").post(addGroupParticipant);

router.route("/group/remove/:chatId").post(removeGroupParticipant);

router.route("/delete-group/:chatId").post(deleteGroup);

export default router;
