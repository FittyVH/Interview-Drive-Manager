const driveModel = require('../models/drive.model')
const roomModel = require('../models/room.model')

async function createDrive(req, res) {
    try{
        const admin = req.user

        const { name } = req.body

        const drive = await driveModel.create({
            name: name,
            adminId: admin.id,
            members: [],
            startedAt: new Date()
        })

        return res.status(201).json({
            message: "Drive created successfully",
            drive: {
                name: drive.name,
                admin: drive.adminId,
                members: drive.members
            }
        })

    } catch (err){
        console.error("Drive could not be created: ", err)
        return res.status(500).json({ message: err.message || "Internal server error" })
    }
}

async function joinDrive(req, res) {
    try{
        const { driveCode } = req.body
        const interviewer = req.user

        const drive = await driveModel.findById(driveCode)

        if(!drive){
            return res.status(404).json({ message: "drive not found" });
        }

        if(drive.members.includes(interviewer.id)){
            return res.status(400).json({ message: "You are already a member of this drive!" });
        }

        drive.members.push(interviewer.id)
        await drive.save()

        res.status(200).json({
            message: "Successfully joined the drive!",
            drive
        });

    } catch(err){
        console.error("Join drive error:", err);

        // Catch invalid MongoDB ObjectIDs
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid drive ID format" });
        }
        res.status(500).json({ message: "Server error joining drive" });
    }
}

async function assignInterviewer(req, res){
    try {
        // 1. Extract driveId and interviewer details
        const { driveId } = req.params;
        const { interviewerId, roomNumber } = req.body;
        const admin = req.user;

        // 2. Validate Drive existence and Admin ownership
        const drive = await driveModel.findById(driveId);
        if (!drive) {
            return res.status(404).json({ message: "Drive not found" });
        }
        if (drive.adminId.toString() !== (admin._id || admin.id).toString()) {
            return res.status(403).json({ message: "You are not authorized to manage this drive" });
        }

        // 3. Optional: Verify interviewer is part of this drive
        const isMember = drive.members.some(
            (m) => m._id?.toString() === interviewerId || m.toString() === interviewerId
        );
        if (!isMember) {
            return res.status(400).json({ message: "Interviewer has not joined this drive" });
        }

        // 4. Check if a room is already assigned to this interviewer in this drive
        const existingRoom = await roomModel.findOne({ driveId, assignedInterviewer: interviewerId });
        if (existingRoom) {
            return res.status(400).json({ message: "Interviewer is already assigned to a room in this drive" });
        }

        // 5. Create Room
        const room = await roomModel.create({
            driveId,
            roomNumber,
            assignedInterviewer: interviewerId,
            status: "AVAILABLE"
        });

        return res.status(201).json({
            message: "Room assigned successfully",
            room
        });

    } catch (err) {
        console.error("Assign interviewer error:", err);
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
}

module.exports = { createDrive, joinDrive, assignInterviewer }