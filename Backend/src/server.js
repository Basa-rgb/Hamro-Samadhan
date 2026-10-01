// Entry point: connect to MongoDB, then start listening
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000; // 5000 for local dev without a .env PORT

// Only start serving once the database is reachable, so requests never hit a dead DB
connectDB().then(() => {
    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
    })
})