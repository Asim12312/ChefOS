import { GoogleGenerativeAI } from '@google/generative-ai';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';

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
            console.error('GEMINI_API_KEY missing from environment variables');
            throw new Error('GEMINI_API_KEY is not defined in environment variables');
        }

        if (!genAI) {
            console.log('Initializing Gemini with key:', process.env.GEMINI_API_KEY.substring(0, 5) + '...');
            genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }

        const { message, history, restaurantId } = req.body;
        console.log(`Chef AI Request - Restaurant: ${restaurantId}, Message: "${message}"`);

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
            `- ${item.name}: ${item.description} (Price: ${item.price} ${restaurant.currency || 'USD'})`
        ).join('\n');

        const systemPrompt = `
You are "Chef AI", the friendly and expert virtual chef for ${restaurant.name}. 
Your goal is to help customers navigate the menu, make recommendations based on their preferences, and answer questions about the restaurant.

### Restaurant Context:
Name: ${restaurant.name}
Description: ${restaurant.description}
Address: ${restaurant.address}
Cuisine: ${restaurant.cuisineType}

### Available Menu:
${menuContext}

### Guidelines:
1. **Personality**: Be welcoming, professional, and slightly enthusiastic about the food.
2. **Knowledge**: Only recommend items that are in the "Available Menu" list above. If an item is not listed, politely explain that it's not currently on the menu.
3. **Dietary Needs**: Be helpful with dietary restrictions (vegan, gluten-free, etc.) based on item descriptions.
4. **Ordering**: If the user wants to order, guide them to add items to their cart in the app interface.
5. **Conciseness**: Keep responses helpful but relatively concise for a chat interface.
6. **Formatting**: Use bolding for menu item names. Use bullet points for lists.

### Conversation History:
${history ? JSON.stringify(history) : 'No previous history.'}

Customer's current message: "${message}"
`;

        // Use gemini-flash-latest as it's authorized for this API key
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        console.log('Chef AI Response generated successfully');

        res.status(200).json({
            success: true,
            data: responseText
        });
    } catch (error) {
        console.error('Chef AI Error Detailed:', error);

        // Return a more descriptive error in development to help debugging
        const errorMessage = error.message || 'An error occurred while communicating with Chef AI';
        const isQuotaError = errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('limit');

        res.status(500).json({
            success: false,
            message: isQuotaError
                ? 'Chef AI is currently busy (rate limit reached). Please try again in a minute.'
                : 'An error occurred while communicating with Chef AI. Please ensure your API key is valid.',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
};
