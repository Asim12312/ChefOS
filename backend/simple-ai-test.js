import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const testGemini = async () => {
    try {
        console.log('Testing Gemini API Key...');
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is missing');
            return;
        }
        console.log('API Key (first 5):', apiKey.substring(0, 5));

        const genAI = new GoogleGenerativeAI(apiKey);

        const modelsToTry = ["gemini-flash-latest", "gemini-pro-latest", "gemini-2.0-flash"];

        for (const modelName of modelsToTry) {
            try {
                console.log(`\nTrying model: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = "Say 'OK' if you can read this.";
                const result = await model.generateContent(prompt);
                const response = await result.response;
                console.log(`SUCCESS with ${modelName}:`, response.text());
                break; // Stop if one works
            } catch (err) {
                console.error(`FAILED with ${modelName}:`, err.message);
            }
        }
    } catch (error) {
        console.error('FAILURE: Gemini API Test Failed');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.stack) console.error('Stack:', error.stack);
    }
};

testGemini();
