// Entry point: connect to MongoDB, seed the starter categories, then start
// listening
const app = require('./app');
const connectDB = require('./config/db');
const { ensureCategories } = require('./services/category.service');

const PORT = process.env.PORT || 5000; // 5000 for local dev without a .env PORT

// Only start serving once the database is reachable, so requests never hit a dead DB
connectDB()
    .then(async () => {
        // Categories are data now, and an empty collection would leave the public
        // report form with an empty dropdown and every submission rejected. Filling
        // it here means a fresh database works without running a seed script first
        //
        // A failure here is logged but does not stop the server: refusing to boot
        // would take down a running site because the starter list could not be read
        try {
            const { inserted, total } = await ensureCategories();

            if (inserted > 0) {
                console.log(`Categories seeded on boot: ${inserted} added, ${total} total`);
            }
        } catch (error) {
            console.log(`Category seed on boot skipped: ${error.message}`);
        }

        app.listen(PORT,()=>{
            console.log(`Server is running on port ${PORT}`);
        })
    })