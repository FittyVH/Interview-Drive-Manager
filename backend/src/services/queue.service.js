// src/services/queue.service.js
const mongoose = require('mongoose');
const roomModel = require('../models/room.model');
const queueEntryModel = require('../models/queueEntry.model');
const { redisClient } = require('../db/redis');

/**
 * Attempts to match waiting students to available rooms for a drive.
 * Uses a Redis lock to ensure only one assignment cycle runs per drive at a time.
 */
async function dispatchDriveQueue(driveId) {
  const lockKey = `lock:drive:${driveId}:dispatch`;
  
  // 1. Acquire Redis Mutex Lock (NX: only set if not exists, EX: auto-expire after 5 seconds)
  const acquired = await redisClient.set(lockKey, "LOCKED", {
    NX: true,
    EX: 5
  });

  if (!acquired) {
    // Another worker is already assigning for this drive; it will process the queue
    return;
  }

  try {
    // Run loop as long as there is an available room and a waiting student
    while (true) {
      // 2. Atomically find and reserve ONE available room
      // By changing status to 'BUSY' conditionally, no other process can pick this room
      const availableRoom = await roomModel.findOneAndUpdate(
        { driveId, status: "AVAILABLE" },
        { $set: { status: "BUSY" } },
        { new: true }
      );

      if (!availableRoom) {
        // No available rooms; stop assigning
        break;
      }

      // 3. Atomically find and claim the oldest WAITING student (FIFO)
      const nextStudent = await queueEntryModel.findOneAndUpdate(
        { driveId, status: "WAITING" },
        { 
          $set: { 
            status: "ASSIGNED", 
            assignedRoom: availableRoom._id,
            assignedAt: new Date()
          } 
        },
        { sort: { createdAt: 1 }, new: true }
      );

      if (!nextStudent) {
        // No waiting student found! Rollback the room back to AVAILABLE
        await roomModel.findByIdAndUpdate(availableRoom._id, {
          $set: { status: "AVAILABLE", currentStudent: null }
        });
        break;
      }

      // 4. Link the student to the room
      availableRoom.currentStudent = nextStudent._id;
      await availableRoom.save();

      console.log(`Assigned student ${nextStudent.studentName} to Room ${availableRoom.roomNumber}`);
    }
  } finally {
    // Release the Redis lock
    await redisClient.del(lockKey);
  }
}

module.exports = { dispatchDriveQueue };