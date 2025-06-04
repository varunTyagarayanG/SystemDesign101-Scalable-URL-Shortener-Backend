const mongoose = require('mongoose');

async function connectMongo() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            // newer Mongoose versions no longer require these options
            // useNewUrlParser: true,
            // useUnifiedTopology: true
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

module.exports = connectMongo;
