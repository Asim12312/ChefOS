import { GoogleGenerativeAI } from '@google/generative-ai';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import logger from '../utils/logger.js';

// Initialize Gemini Lazily
let genAI;

/**
 * @desc    Chat with Chef AI
 * @route   POST /api/ai/chat
 * @access  Public
 */
export const chatWithChef = async (req, res, next) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            logger.error('GEMINI_API_KEY missing from environment variables');
            throw new Error('GEMINI_API_KEY is not defined in environment variables');
        }

        if (!genAI) {
            logger.info('Initializing Gemini AI...');
            genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }

        const { message, history, restaurantId } = req.body;
        logger.info(`Chef AI Request - Restaurant: ${restaurantId}`);

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        // Fetch restaurant and menu items for context
        const [restaurant, menuItems] = await Promise.all([
            Restaurant.findById(restaurantId),
            MenuItem.find({ restaurant: restaurantId, isAvailable: true, isDeleted: false })
        ]);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Prepare context
        const menuContext = menuItems.map(item =>
            `- ${item.name}: ${item.description} (Price: ${item.price})`
        ).join('\n');

        const systemPrompt = `
You are "Chef AI", the friendly and expert virtual chef for ${restaurant.name}. 
Your goal is to help customers navigate the menu, make recommendations based on their preferences, and answer questions about the restaurant.

### Restaurant Context:
Name: ${restaurant.name}
Description: ${restaurant.description}
Address: ${restaurant.address ? `${restaurant.address.street || ''}, ${restaurant.address.city || ''}, ${restaurant.address.state || ''}` : 'N/A'}
Cuisine: ${restaurant.cuisine || 'N/A'}

### Available Menu:
${menuContext}

### Guidelines:
1. **Personality**: Be welcoming, professional, and slightly enthusiastic about the food.
2. **Knowledge**: Only recommend items that are in the "Available Menu" list above. If an item is not listed, politely explain that it's not currently on the menu.
3. **Dietary Needs**: Be helpful with dietary restrictions (vegan, gluten-free, etc.) based on item descriptions.
4. **Ordering**: If the user wants to order, guide them to add items to their cart in the app interface.
5. **Conciseness**: Keep responses helpful but relatively concise for a chat interface.
6. **Formatting**: Use bolding for menu item names. Use bullet points for lists.
7. **Pricing**: When mentioning prices, just state the number. Do NOT mention currency names like 'USD' or any other symbols.

### Conversation History:
${history ? JSON.stringify(history) : 'No previous history.'}

Customer's current message: "${message}"
`;

        // Try gemini-2.5-flash-preview-09-2025 first (available to this key), then fallback to lite
        let result;
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });
            result = await model.generateContent(systemPrompt);
        } catch (modelError) {
            logger.warn(`Primary model gemini-2.5-flash-preview-09-2025 failed, trying fallback: ${modelError.message}`);
            // Fallback to gemini-flash-lite-latest which appeared in the available list
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
            result = await fallbackModel.generateContent(systemPrompt);
        }

        const responseText = result.response.text();
        logger.info('Chef AI Response generated successfully');

        res.status(200).json({
            success: true,
            data: responseText
        });
    } catch (error) {
        logger.error(`Chef AI Error: ${error.message}`);
        console.error('FULL AI ERROR:', error);

        // Return more specific error details if available
        const errorDetail = error.response?.data?.error?.message || error.message;
        const isQuotaError = errorDetail?.toLowerCase().includes('quota') || errorDetail?.toLowerCase().includes('limit');

        res.status(500).json({
            success: false,
            message: isQuotaError
                ? 'Chef AI is currently busy (rate limit reached). Please try again in a minute.'
                : `An error occurred while communicating with Chef AI: ${errorDetail}`,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
