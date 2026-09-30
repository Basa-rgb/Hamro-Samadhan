const mongoose = require('mongoose');

// Opens the single mongoose connection used by every model
const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGOOSE_URL)
        console.log("Connect the Database Successfuly",`${process.env.PORT}`);
        
    } catch (error) {
        console.log("Something went wrong",`${error.message}`);
        // Nothing works without the DB, so stop instead of serving broken requests
        process.exit(1)
    }
}


module.exports =connectDB;
