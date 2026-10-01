const mongoose = require('mongoose');

// Opens the single mongoose connection used by every model
const connectDB = async () => {
    const uri = process.env.MONGOOSE_URL;

    // Fail fast on a missing variable instead of waiting for the server-selection timeout
    if (!uri) {
        console.error("MONGOOSE_URL is not set. Add it to the environment variables.");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
        console.log("Connect the Database Successfuly",`${process.env.PORT}`);

    } catch (error) {
        console.log("Something went wrong",`${error.message}`);
        // Nothing works without the DB, so stop instead of serving broken requests
        process.exit(1)
    }
}


module.exports =connectDB;
