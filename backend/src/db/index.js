import mongoose from "mongoose";
import { DB_NAME } from "../constanats.js";
import { env } from "../config/env.js";

export const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(`${env.MONGODB_URI}/${DB_NAME}`, {
            maxPoolSize: 100, // Optimize for heavy concurrency
            serverSelectionTimeoutMS: 5000, 
            socketTimeoutMS: 45000,
        });
        if(connectionInstance) {
            console.log(`DB connected at port ${connectionInstance.connection.host}`)
        }
    } catch (error) {
        console.log(`Error in DB connection: ${error.message}`)
        process.exit(1)
    }
}