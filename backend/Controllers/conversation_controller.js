const Conversation = require("../Models/Conversation.js");

const createConversation = async (req, res) => {
  try {
    const { members: memberIds } = req.body;

    if (!memberIds) {
      return res.status(400).json({
        error: "Please fill all the fields",
      });
    }

    const conv = await Conversation.findOne({
      members: { $all: memberIds },
    }).populate("members", "-password");

    if (conv) {
      conv.members = conv.members.filter(
        (memberId) => memberId !== req.user.id
      );
      return res.status(200).json(conv);
    }

    const newConversation = await Conversation.create({
      members: memberIds,
      unreadCounts: memberIds.map((memberId) => ({
        userId: memberId,
        count: 0,
      })),
    });

    await newConversation.populate("members", "-password");

    newConversation.members = newConversation.members.filter(
      (member) => member.id !== req.user.id
    );

    return res.status(200).json(newConversation);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id).populate(
      "members",
      "-password",
      "-phoneNum"
    );

    if (!conversation) {
      return res.status(404).json({
        error: "No conversation found",
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const getConversationList = async (req, res) => {
  const userId = req.user.id;

  try {
    const conversationList = await Conversation.find({
      members: { $in: userId },
    }).populate("members", "-password");

    if (!conversationList) {
      return res.status(404).json({
        error: "No conversation found",
      });
    }

    // remove user from members and also other chatbots
    for (let i = 0; i < conversationList.length; i++) {
      conversationList[i].members = conversationList[i].members.filter(
        (member) => member.id !== userId
      );
    }

    conversationList.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    res.status(200).json(conversationList);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// Add these new functions to your existing controller

const createGroupChat = async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name || !members) {
      return res.status(400).json({ error: "Please fill all fields" });
    }

    members.push(req.user.id); // Add group creator to members

    const groupChat = await Conversation.create({
      name,
      members,
      isGroup: true,
      groupAdmin: req.user.id,
      unreadCounts: members.map((memberId) => ({
        userId: memberId,
        count: 0,
      })),
    });

    const fullGroupChat = await Conversation.findOne({ _id: groupChat._id })
      .populate("members", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create group chat" });
  }
};

const renameGroup = async (req, res) => {
  try {
    const { chatId, name } = req.body;
    const updatedChat = await Conversation.findByIdAndUpdate(
      chatId,
      { name },
      { new: true }
    )
      .populate("members", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ error: "Failed to rename group" });
  }
};

const addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const chat = await Conversation.findById(chatId);
    
    if (!chat.isGroup) {
      return res.status(400).json({ error: "Not a group chat" });
    }

    const added = await Conversation.findByIdAndUpdate(
      chatId,
      {
        $push: { 
          members: userId,
          unreadCounts: { userId, count: 0 }
        }
      },
      { new: true }
    )
      .populate("members", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(added);
  } catch (error) {
    res.status(500).json({ error: "Failed to add user" });
  }
};

const removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const removed = await Conversation.findByIdAndUpdate(
      chatId,
      {
        $pull: { 
          members: userId,
          unreadCounts: { userId }
        }
      },
      { new: true }
    )
      .populate("members", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(removed);
  } catch (error) {
    res.status(500).json({ error: "Failed to remove user" });
  }
};

module.exports = {
  createConversation,
  getConversation,
  getConversationList,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
