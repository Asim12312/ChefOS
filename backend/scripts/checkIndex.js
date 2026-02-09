import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

const checkIndex = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const collection = mongoose.connection.collection('reviews');
        const indexes = await collection.listIndexes().toArray();
        console.log('FINAL_INDEX_STATE:', JSON.stringify(indexes, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkIndex();
