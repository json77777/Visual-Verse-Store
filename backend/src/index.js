// import dotenv from "dotenv";
// dotenv.config()
// this is configured in config folder

import app from "./app.js";
import { connectDB } from "./db/index.js";
import { env } from "./config/env.js";

const PORT=env.PORT 

process.on("unhandledRejection", (reason) => {
    console.error("[UNHANDLED REJECTION]", reason)
})

process.on("uncaughtException", (error) => {
    console.error("[UNCAUGHT EXCEPTION]", error)
})

connectDB()
.then(()=>{
    app.listen(PORT, ()=> {
        console.log(`Server started at port: ${PORT}`)
    })
})
.catch((error)=>{
    console.log(`MONGO DB connection failled, ${error}`)
})
