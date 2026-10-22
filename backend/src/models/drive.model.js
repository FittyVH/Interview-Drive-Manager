const mongoose = require("mongoose");

const driveSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  members: [{
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }],

  startedAt: Date,
  endedAt: Date
}, { timestamps: true });

const driveModel = mongoose.model("drives", driveSchema);

module.exports = driveModel;