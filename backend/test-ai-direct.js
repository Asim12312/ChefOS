import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const testGeminiDirectly = async () => {
    try {
        console.log('--- Direct Gemini Model Test ---');
        const key = process.env.GEMINI_API_KEY;
        if (!key) {
            console.error('No API Key found.');
            return;
        }
        console.log('API Key First 5 Chars:', key.substring(0, 5));

        const genAI = new GoogleGenerativeAI(key);

        // Try a few popular model names
        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ];

        for (const modelName of modelsToTry) {
            try {
                console.log(`\nTrying model: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello, are you working?");
                const response = result.response.text();
                console.log(`SUCCESS with ${modelName}! Response: ${response.substring(0, 50)}...`);
                // If successful, we found a working model!
                process.exit(0);
            } catch (error) {
                console.error(`FAILED with ${modelName}: ${error.message}`);
                if (error.response) {
                    console.error('Error Details:', JSON.stringify(error.response, null, 2));
                }
            }
        }

        console.error('\nALL MODELS FAILED.');
        process.exit(1);

    } catch (err) {
        console.error('Setup Error:', err);
    }
};

testGeminiDirectly();
