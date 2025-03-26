
const mongoose = require("mongoose");
const express = require("express");
const Admin = require("./models/Admin.model.js");
const Client = require("./models/Client.model.js");
const Attendance = require("./models/Attendance.model.js")
const Payment = require("./models/Payment.model.js")
const moment = require("moment");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();  
const SECRET_KEY = process.env.JWT_SECRET ;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;

//mongo con

mongoose.connect(MONGO_URI)
.then(() => {
    console.log("Connected to database:");
})
.catch(() =>{
    console.log("Connection failed");
});

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("🏋️ Gym API is Running...");
});


app.post("/add-admins", async (req, res) => {
    try {
        const { email, password, mobile_Number } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin with only required fields & default values for others
        const admin = new Admin({
            AdminName: "New Admin", // Default name
            email,
            password: hashedPassword,
            mobile_Number,
            bussiness_name: "Your Business", // Default business name
            address: "Not Set" // Default address
        });

        await admin.save(); // Save admin to the database

        res.status(201).json({ message: "Admin created successfully", admin });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


//fetch admin data by giving admin id
app.get("/admin/:adminId", async (req, res) => {
    const { adminId } = req.params; // Extract adminId from URL

    try {
        if (!adminId) {
            return res.status(400).json({ message: "Admin ID is required" });
        }

        // Find the admin by adminId
        const admin = await Admin.findById(adminId).select("-password"); // Exclude password from response

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.json({ admin });

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});


//update admin details 
app.put("/admin/:adminId", async (req, res) => {
    const { adminId } = req.params; // Extract adminId from URL
    const updateData = req.body; // Extract update fields from request body

    try {
        if (!adminId) {
            return res.status(400).json({ message: "Admin ID is required" });
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No update data provided" });
        }

        // Find the admin and update only the provided fields
        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminId,
            { $set: updateData }, // Update only the given fields
            { new: true, runValidators: true } // Return updated document & apply validations
        ).select("-password"); // Exclude password from response

        if (!updatedAdmin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.json({ message: "Admin updated successfully", admin: updatedAdmin });

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

//ading client
app.post("/add-client", async (req, res) => {
    const { adminId, name, email, phone, password, dateOfJoining, paymentType, paymentStatus } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Check if admin exists
        const adminExists = await Admin.findById(adminId).session(session);
        if (!adminExists) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Invalid adminId. Admin does not exist." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create client
        const newClient = new Client({ adminId, name, email, phone, password: hashedPassword, dateOfJoining, paymentType, paymentStatus });
        await newClient.save({ session });

        // Create attendance record for the client
        const attendance = new Attendance({
            clientId: newClient._id,
            adminId,
            date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
            status: "Present", // Default status
            clientname: name
        });
        await attendance.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: "Client and attendance added successfully", attendance });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: "Server error", error });
    }
});


//creating single attendance record for a specific date
app.post("/attendance", async (req, res) =>{
    try {
        const { clientId, adminId, date, status, clientname} = req.body;

        // Validate required fields
        if (!clientId || !adminId || !date || !status) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if Client exists
        const clientExists = await Client.findById(clientId);
        if (!clientExists) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Check if Gym Owner exists
        const gymOwnerExists = await Admin.findById(adminId);
        if (!gymOwnerExists) {
            return res.status(404).json({ message: 'Gym Owner not found' });
        }

        // Create new attendance record
        const attendance = new Attendance({
            clientId,
            adminId,
            date,
            status,
            clientname
        });

        await attendance.save();
        res.status(201).json({ message: 'Attendance recorded successfully', attendance });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

//bulk attendance record 
app.post("/attendance/mark-attendance", async (req, res) =>{
    try {
        const { adminId } = req.body;

        if (!adminId) {
            return res.status(400).json({ message: 'Gym Owner ID is required' });
        }

        //  Validate if Gym Owner exists
        const gymOwnerExists = await Admin.findById(adminId);
        if (!gymOwnerExists) {
            return res.status(404).json({ message: 'Gym Owner not found' });
        }

        //  Fetch all clients under this Gym Owner
        const allClients = await Client.find({ adminId }).select('_id name');

        if (allClients.length === 0) {
            return res.status(404).json({ message: 'No clients found for this Gym Owner' });
        }

    
        const today = new Date();
const formattedDate = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'


        //  Prepare attendance records
        const attendanceRecords = allClients.map(client => ({
            clientId: client._id,
            adminId,
            date: formattedDate, // String date
            status: 'Absent',
            clientname: client.name
        }));

        //  Insert all attendance records in bulk
        await Attendance.insertMany(attendanceRecords);

        res.status(201).json({
            message: 'All clients marked absent successfully',
            totalClients: allClients.length
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
})




// add a new payment
app.post("/add-payment", async (req, res) => {
    try {
        const { paymentId, clientId, adminId, amountPaid, totalAmount, dueAmount, nextDueDate, paymentMode, transactionId, status, clientname } = req.body;

        const newPayment = new Payment({
            paymentId,
            clientId,
            adminId,
            amountPaid,
            totalAmount,
            dueAmount,
            nextDueDate,
            paymentMode,
            transactionId,
            status,
            clientname
        });

        await newPayment.save();
        res.status(201).json({ success: true, message: "Payment added successfully", payment: newPayment });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

//get Payments by client id
app.get("/get-payment/client/:clientId", async (req, res) => {
    try {
        const payments = await Payment.find({ clientId: req.params.clientId }).sort({ paymentDate: -1 });
        res.status(200).json({ success: true, payments });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

//delete old payments (auto cleanup)

app.delete("/cleanup", async (req, res) => {
    try {
        const deleteBeforeDate = moment().subtract(3, "months").toDate();
        await Payment.deleteMany({ paymentDate: { $lt: deleteBeforeDate } });
        res.status(200).json({ success: true, message: "Old payments deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

//  API to Get All Payments by Gym Owner (Admin)
app.get("/get-payments/admin/:adminId", async (req, res) => {
    try {
        const { adminId } = req.params;
        const payments = await Payment.find({ adminId });

        if (!payments.length) {
            return res.status(404).json({ success: false, message: "No payments found for this admin." });
        }

        res.status(200).json({ success: true, payments });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});




// ✅ 1️⃣ Client Login API
app.post("/api/auth/client-login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const client = await Client.findOne({ email });

        if (!client) return res.status(404).json({ message: "Client not found" });

        const isMatch = await bcrypt.compare(password, client.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: client._id, role: "client" }, SECRET_KEY, { expiresIn: "7d" });
        res.json({ token, user: { id: client._id, name: client.name, email: client.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ 2️⃣ Admin Login API
app.post("/api/auth/admin-login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin) return res.status(404).json({ message: "Admin not found" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: admin._id, role: "admin" }, SECRET_KEY, { expiresIn: "7d" });
        res.json({ token, user: { id: admin._id, name: admin.AdminName, email: admin.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Update Client Information API
app.put('/update-client/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const { name, email, phone, password } = req.body;

        // Find client by ID
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        // Prepare update data
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;

        // If password is provided, hash it
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        // Update client information
        const updatedClient = await Client.findByIdAndUpdate(clientId, updateData, { new: true });

        res.json({ success: true, message: 'Client updated successfully', client: updatedClient });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

//update attendane

app.patch('/attendance/update', async (req, res) => {
    const { attendanceId, status } = req.body;

    try {
        // Validate status input
        if (!['Present', 'Absent'].includes(status)) {
            return res.status(400).json({ message: "Invalid status value. Use 'Present' or 'Absent'." });
        }

        // Find and update attendance
        const updatedAttendance = await Attendance.findByIdAndUpdate(
            attendanceId,
            { status },
            { new: true } // Returns the updated document
        );

        if (!updatedAttendance) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        res.json({
            message: "Attendance updated successfully",
            attendance: updatedAttendance
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});


//update payment details
app.patch("/payment/update/:paymentId", async (req, res) => {
    const { paymentId } = req.params; // Extract paymentId from URL parameter
    const { status, paymentMode, amountPaid, paymentDate, nextDueDate, dueAmount, totalAmount } = req.body;

    try {
        if (!paymentId) {
            return res.status(400).json({ message: "Payment ID is required" });
        }

        const updateFields = {};

        // Add fields to update only if they are provided
        if (status) {
            if (!["Completed", "Pending", "Failed"].includes(status)) {
                return res.status(400).json({ message: "Invalid status. Use 'Completed', 'Pending', or 'Failed'." });
            }
            updateFields.status = status;
        }

        if (paymentMode) {
            if (!["Cash", "Card", "UPI", "Bank Transfer"].includes(paymentMode)) {
                return res.status(400).json({ message: "Invalid payment mode." });
            }
            updateFields.paymentMode = paymentMode;
        }

        if (amountPaid !== undefined) updateFields.amountPaid = amountPaid;
        if (paymentDate !== undefined) updateFields.paymentDate = paymentDate;
        if (nextDueDate !== undefined) updateFields.nextDueDate = nextDueDate;
        if (dueAmount !== undefined) updateFields.dueAmount = dueAmount;
        if (totalAmount !== undefined) updateFields.totalAmount = totalAmount;

        // If no valid fields are provided, return an error
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "No valid fields provided for update." });
        }

        // Update only provided fields
        const updatedPayment = await Payment.findOneAndUpdate(
            { paymentId },
            { $set: updateFields },
            { new: true } // Return updated document
        );

        if (!updatedPayment) {
            return res.status(404).json({ message: "Payment record not found" });
        }

        res.json({
            message: "Payment record updated successfully",
            updatedPayment
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

//Delete a client (admin only)
app.delete("/client/delete/:adminId", async (req, res) => {
    const { adminId } = req.params;  // Extract adminId from URL
    const { clientId } = req.body;   // Extract clientId from request body

    try {
        if (!adminId || !clientId) {
            return res.status(400).json({ message: "Admin ID and Client ID are required" });
        }

        // Find the client by clientId and ensure it belongs to the provided adminId
        const client = await Client.findOne({ _id: clientId, adminId });

        if (!client) {
            return res.status(404).json({ message: "Client not found or does not belong to this admin" });
        }

        // Delete the client
        await Client.findByIdAndDelete(clientId);

        res.json({
            message: "Client deleted successfully",
            deletedClientId: clientId
        });

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});


//get client details
app.get("/client/:clientId", async (req, res) => {
    const { clientId } = req.params;  // Extract clientId from URL

    try {
        if (!clientId) {
            return res.status(400).json({ message: "Client ID is required" });
        }

        // Find the client by clientId
        const client = await Client.findById(clientId).select("-password"); // Exclude password from response

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        res.json({ client });

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

// Get all clients for a specific admin
app.get("/clients/:adminId", async (req, res) => {
    const { adminId } = req.params;  // Extract adminId from URL

    try {
        if (!adminId) {
            return res.status(400).json({ message: "Admin ID is required" });
        }

        // Find all clients belonging to the given adminId
        const clients = await Client.find({ adminId }).select("-password"); // Exclude password from response

        if (clients.length === 0) {
            return res.status(404).json({ message: "No clients found for this admin" });
        }

        res.json({ clients });

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});


// Delete a payment record
app.delete("/delete-payment/:paymentId", async (req, res) => {
    const { paymentId } = req.params; // Extract paymentId from URL

    try {
        if (!paymentId) {
            return res.status(400).json({ message: "Payment ID is required" });
        }

        // Find and delete the payment record
        const deletedPayment = await Payment.findOneAndDelete({ paymentId });

        if (!deletedPayment) {
            return res.status(404).json({ message: "Payment record not found" });
        }

        res.json({ message: "Payment record deleted successfully", deletedPayment });

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

// API to Fetch All Attendance Records for a Client
app.get("/get-all-attendance/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const records = await Attendance.find({ clientId });
  
      if (records.length === 0) {
        return res.status(404).json({ message: "No attendance records found" });
      }
  
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });


  // Update password API
app.put("/update-password/:email", async (req, res) => {
    const { email } = req.params;
    const { newPassword } = req.body;
  
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }
  
    try {
      const admin = await Admin.findOne({ email });
  
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      admin.password = hashedPassword;
      await admin.save();
  
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });


// Reset Password API for Clients
app.put("/client/reset-password/:email", async (req, res) => {
    const { email } = req.params;
    const { newPassword } = req.body;
  
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }
  
    try {
      const client = await Client.findOne({ email });
  
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      client.password = hashedPassword;
      await client.save();
  
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

 // GET /attendance/:adminId 
app.get("/attendance/:adminId", async (req, res) => {
    try {
        const { adminId } = req.params;

        const attendanceRecords = await Attendance.find({ adminId });

        if (!attendanceRecords.length) {
            return res.status(404).json({ message: "No attendance records found" });
        }

        res.json({ success: true, data: attendanceRecords });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});


app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
