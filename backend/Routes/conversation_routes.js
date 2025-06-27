const express = require("express");
const router = express.Router();

const {
  createConversation,
  getConversation,
  getConversationList,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} = require("../Controllers/conversation_controller.js");
const fetchuser = require("../middleware/fetchUser.js");

router.post("/", fetchuser, createConversation);
router.get("/:id", fetchuser, getConversation);
router.get("/", fetchuser, getConversationList);
router.post("/group", fetchuser, createGroupChat);
router.put("/rename", fetchuser, renameGroup);
router.put("/groupadd", fetchuser, addToGroup);
router.put("/groupremove", fetchuser, removeFromGroup);

module.exports = router;
