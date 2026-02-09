import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const performDetailedTest = async () => {
    try {
        console.log('Testing AI Endpoint...');

        // 1. Check API Key
        console.log('Detected GEMINI_API_KEY (first 5 chars):', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : 'MISSING');

        // 2. Connect to Database to get a Restaurant ID
        await mongoose.connect(process.env.MONGODB_URI);
        const restaurants = await mongoose.connection.db.collection('restaurants').find().limit(1).toArray();

        if (restaurants.length === 0) {
            console.error('No restaurants found in database. Cannot test AI.');
            process.exit(1);
        }

        const restaurantId = restaurants[0]._id.toString();
        console.log('Using Restaurant ID:', restaurantId);

        // 3. Make Request to AI Endpoint
        const response = await fetch('http://localhost:5000/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restaurantId: restaurantId,
                message: 'Hello, what are your specials today?',
                history: []
            })
        });

        const status = response.status;
        const text = await response.text();

        console.log('Response Status:', status);
        console.log('Response Body:', text);

        try {
            const json = JSON.parse(text);
            if (!json.success && json.error) {
                console.error('SERVER ERROR DETAILS:', json.error);
                console.error('SERVER ERROR MESSAGE:', json.message);
            }
        } catch (e) {
            // response was not json
        }

    } catch (error) {
        console.error('Test Script Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

performDetailedTest();
