const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestmessage: {
      type: String,
      default: "",
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.isGroup;
      },
    },
    name: {
      type: String,
      required: function () {
        return this.isGroup;
      },
    },
    groupPic: {
      type: String,
      default: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
    unreadCounts: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model("Conversation", ConversationSchema);
module.exports = Conversation;
