import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const listModels = async () => {
    try {
        console.log('Listing available models...');
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);

        // The listModels method might be on the genAI instance or requires a direct fetch
        // In @google/generative-ai, there isn't a direct listModels method on the client usually, 
        // but we can try to fetch it via the REST API if needed.
        // However, let's try a different approach: try 'models/gemini-1.5-flash' (with prefix)

        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-pro-latest",
            "gemini-1.0-pro",
            "models/gemini-1.5-flash",
            "models/gemini-1.5-pro",
            "models/gemini-pro"
        ];

        for (const modelName of modelsToTry) {
            try {
                console.log(`\nTrying model: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = "OK";
                const result = await model.generateContent(prompt);
                const response = await result.response;
                console.log(`SUCCESS with ${modelName}:`, response.text());
                return;
            } catch (err) {
                console.error(`FAILED with ${modelName}:`, err.message);
            }
        }

    } catch (error) {
        console.error('List Models Script Error:', error);
    }
};

listModels();
