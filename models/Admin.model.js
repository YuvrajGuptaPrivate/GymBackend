const mongoose = require("mongoose");

const AdminSchema = mongoose.Schema(
    {
        AdminName: { type: String, required: true, trim: true },
   
        email: { type: String, required: true, unique: true, lowercase: true },
    
        password: { type: String, required: true },
   
        mobile_Number: { type: String, required: true, unique: true, match: /^[0-9]{10}$/ },
    
        bussiness_name: { type: String, required: true, trim: true },
    
        address: { type: String, required: true, trim: true }

    }
);

const Admin = mongoose.model("Admin",AdminSchema);
module.exports = Admin;