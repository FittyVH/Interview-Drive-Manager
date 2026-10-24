const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  driveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Drive",
    required: true
  },

  roomNumber: {
    type: String,
    required: true
  },

  assignedInterviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  selected: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ["AVAILABLE", "BUSY", "OFFLINE"],
    default: "OFFLINE"
  },

  currentStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "queueEntries",
    default: null
  }
}, { timestamps: true });

const roomModel = mongoose.model("rooms", roomSchema);

module.exports = roomModel;