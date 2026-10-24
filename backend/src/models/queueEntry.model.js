const mongoose = require("mongoose");

const queueEntrySchema = new mongoose.Schema({
  driveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Drive",
    required: true,
    index: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  studentId: { // e.g. Roll number or University ID
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ["WAITING", "ASSIGNED", "COMPLETED", "SKIPPED"],
    default: "WAITING",
    index: true
  },
  assignedRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "rooms",
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Compound index for fast FIFO queue querying
queueEntrySchema.index({ driveId: 1, status: 1, createdAt: 1 });

const queueEntryModel = mongoose.model("queueEntries", queueEntrySchema);
module.exports = queueEntryModel;