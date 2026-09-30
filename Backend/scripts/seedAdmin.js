require('dotenv').config()
const mongoose = require('mongoose');
const bcrypt= require('bcryptjs');
const User =require('../src/models/User');


// One-off script: creates the first admin account if it is missing
const adminSeed = async () => {
    try {
        // connectDb
        await mongoose.connect(process.env.MONGOOSE_URL);
        console.log("Database connected successfully");
        
        // admin infromation
        const name= 'system admin';
        const email = "admin@hamrosamadhan.com";
        const password = 'hamrosamadhan@123'

        // check if admin already exists

        const existingAdmin = await User.findOne({email})
        if(existingAdmin){
            console.log("Admin already exists");
            return;
        }
        // hash the password
        // 12 rounds keeps hashing slow enough to slow down brute force
        const passwordHash = await bcrypt.hash(password,12);

        //create admin

        const admin = await User.create({
            name,
            email,
            password:passwordHash,
            role:"admin",
            isActive:true,

        })
        
      console.log("Admin created successfully");
        console.log("Email:", admin.email);
        console.log("Password:", password);

    } catch (error) {
        console.error("Seed error:", error);
    } finally {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
    }
};

// Run it with: node scripts/seedAdmin.js
adminSeed();