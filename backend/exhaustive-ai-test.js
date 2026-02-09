import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const exhaustiveTest = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    const models = [
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.5-flash"
    ];

    for (const m of models) {
        console.log(`\n--- Testing ${m} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`SUCCESS [${m}]:`, response.text());
            return;
        } catch (err) {
            console.error(`FAILED [${m}]:`, err.message);
        }
    }
};

exhaustiveTest();
