import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

const createPartialIndex = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const collection = mongoose.connection.collection('reviews');

        console.log('Creating partial index on order...');
        await collection.createIndex(
            { order: 1 },
            {
                unique: true,
                sparse: true,
                partialFilterExpression: { order: { $type: 'objectId' } }
            }
        );

        const indexes = await collection.listIndexes().toArray();
        console.log('UPDATED_INDEX_STATE:', JSON.stringify(indexes, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error creating index:', error);
        process.exit(1);
    }
};

createPartialIndex();
