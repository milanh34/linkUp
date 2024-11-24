import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import initializeSocket from "./socket.js";

const app = express();
const server = http.createServer(app);

const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST"],
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(express.urlencoded({ extended: true }) );

app.use(express.static("public"));

app.use(cookieParser());

const io = initializeSocket(server, corsOptions);

app.use((req, _, next) => {
    req.io = io;
    next();
});

// import routes
import userRouter from "./routes/user.routes.js";
import chatRouter from "./routes/chat.routes.js";

// declare routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/chats", chatRouter);

app.use((err, _, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({ success: false, message });
});

export { app, server };
