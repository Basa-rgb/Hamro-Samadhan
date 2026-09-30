// Entry point: connect to MongoDB, then start listening
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000; // 5000 for local dev without a .env PORT

connectDB();

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})