const mongoose = require('mongoose');

async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URI)

        console.log("Connected to db")
    } catch (err) {
        console.log(err)
    }
}

module.exports = connectToDB;