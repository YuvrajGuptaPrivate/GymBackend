const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        required: true
    },
    clientname: { type: String, required: true}
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
