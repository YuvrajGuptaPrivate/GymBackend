const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },  
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true, match: /^[0-9]{10}$/ },
    password: { type: String, required: true },  // Store hashed password
    dateOfJoining: { type: Date, required: true, default: Date.now },
    paymentType: { 
        type: String, 
        required: true, 
        enum: ['Monthly', 'Quarterly', 'Yearly'], 
        trim: true 
    },  
    paymentStatus: { 
        type: String, 
        required: true, 
        enum: ['Pending', 'Paid', 'Overdue'], 
        default: 'Pending' 
    }
});


const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
