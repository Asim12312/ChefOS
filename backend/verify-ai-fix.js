import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const verifyFix = async () => {
    try {
        console.log('Verifying AI Fix...');

        // Connect to DB
        await mongoose.connect(process.env.MONGODB_URI);
        const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({ name: String }));

        const restaurant = await Restaurant.findOne();
        if (!restaurant) {
            console.error('No restaurant found to test with');
            process.exit(1);
        }

        console.log(`Testing with restaurant: ${restaurant.name} (${restaurant._id})`);

        // Test the actual endpoint
        const response = await fetch('http://127.0.0.1:5000/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restaurantId: restaurant._id.toString(),
                message: 'Hello Chef! What do you recommend?',
                history: []
            })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            console.log('SUCCESS: AI responded correctly!');
            console.log('Chef AI:', data.data);
        } else {
            console.error('FAILURE: Endpoint returned error');
            console.error(JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Verification Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

verifyFix();
