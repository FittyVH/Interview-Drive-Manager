const driveModel = require('../models/drive.model');
const roomModel = require('../models/room.model');
const queueEntryModel = require('../models/queueEntry.model');
const { dispatchDriveQueue } = require('../services/queue.service');

async function addStudentToQueue(req, res) {
    try {
        const { driveId } = req.params;
        const { studentName, studentId } = req.body;
        const admin = req.user;

        const drive = await driveModel.findById(driveId)

        if (!drive) return res.status(404).json({ message: "Drive not found" });

        if (!studentId || !studentName) {
            return res.status(400).json({ message: "studentName and studentId are required" });
        }

        const exists = await queueEntryModel.findOne({
            driveId,
            studentId,
            status: { $in: ["WAITING", "ASSIGNED"] }
        })

        if (exists) {
            return res.status(400).json({ message: "Student is already in queue or currently in an interview" });
        }

        const queueEntry = await queueEntryModel.create({
            driveId,
            studentName,
            studentId,
            status: "WAITING"
        });

        await dispatchDriveQueue(driveId);

        // Fetch updated entry to return whether they got assigned immediately or are waiting
        const updatedEntry = await queueEntryModel.findById(queueEntry._id).populate('assignedRoom');
        return res.status(201).json({
            message: "Student added to queue successfully",
            student: updatedEntry
        });

    } catch (err) {
        console.error("Add to queue error:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}

async function completeInterviewAndNext(req, res) {
    try {
        const { roomId } = req.params;
        const interviewer = req.user;
        const room = await roomModel.findById(roomId);

        if (!room) return res.status(404).json({ message: "Room not found" });

        // Verify interviewer owns this room
        if (room.assignedInterviewer.toString() !== (interviewer._id || interviewer.id).toString()) {
            return res.status(403).json({ message: "You are not assigned to this room" });
        }
        // Mark current student COMPLETED (if any)
        if (room.currentStudent) {
            await queueEntryModel.findByIdAndUpdate(room.currentStudent, {
                $set: { status: "COMPLETED" }
            });
        }
        // Free up room
        room.status = "AVAILABLE";
        room.currentStudent = null;
        await room.save();
        // Trigger queue assignment to pull the next student into this room
        await dispatchDriveQueue(room.driveId);

        const updatedRoom = await roomModel.findById(roomId).populate('currentStudent');

        return res.status(200).json({
            message: updatedRoom.currentStudent ? "Next student assigned" : "Interview completed, no students waiting",
            room: updatedRoom
        });
    } catch (err) {
        console.error("Complete interview error:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}

async function getDriveQueue(req, res) {
  try {
    const { driveId } = req.params;
    const queue = await queueEntryModel.find({ driveId }).sort({ createdAt: 1 });
    return res.status(200).json({ queue });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
}


module.exports = { addStudentToQueue, completeInterviewAndNext, getDriveQueue }