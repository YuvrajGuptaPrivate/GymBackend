const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true },  // Unique Payment ID
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true }, // Reference to Client
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }, // Reference to Gym Owner
    amountPaid: { type: Number, required: true }, // Amount Paid
    totalAmount: { type: Number, required: true }, // Total Amount (e.g., Monthly Fees)
    dueAmount: { type: Number, default: 0 }, // Remaining Due Amount
    paymentDate: { type: Date, default: Date.now }, // Date of Payment
    nextDueDate: { type: Date, required: true }, // Next Due Date
    paymentMode: { 
        type: String, 
        enum: ["Cash", "Card", "UPI", "Bank Transfer"], 
        required: true 
    }, // Payment Mode
    transactionId: { type: String, default: null }, // Transaction ID (For Digital Payments)
    status: { 
        type: String, 
        enum: ["Completed", "Pending", "Failed"], 
        default: "Completed" 
    }, // Payment Status
    notes: { type: String, default: "" } // Additional Notes
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
