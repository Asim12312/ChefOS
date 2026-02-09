import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import Restaurant from './models/Restaurant.js';
import { getDashboardSummary, getNotifications } from './controllers/analytics.controller.js';

// Load env
dotenv.config();

const runDebug = async () => {
    try {
        console.log("Connecting to DB...");
        await connectDB();

        console.log("Fetching a restaurant...");
        const restaurant = await Restaurant.findOne();
        if (!restaurant) {
            console.error("No restaurant found!");
            process.exit(1);
        }

        console.log(`Testing with Restaurant ID: ${restaurant._id}`);

        const req = {
            params: { restaurantId: restaurant._id.toString() }
        };

        const res = {
            status: (code) => ({
                json: (data) => console.log(`SUCCESS [${code}]:`, JSON.stringify(data, null, 2))
            })
        };

        const next = (err) => {
            console.error("ERROR CAUGHT IN NEXT:");
            console.error(err);
        };

        console.log("---------------------------------------------------");
        console.log("Testing getDashboardSummary...");
        await getDashboardSummary(req, res, next);

        console.log("---------------------------------------------------");
        console.log("Testing getNotifications...");
        await getNotifications(req, res, next);

        console.log("---------------------------------------------------");
        console.log("Done.");
        process.exit(0);
    } catch (error) {
        console.error("FATAL ERROR:", error);
        process.exit(1);
    }
};

runDebug();
