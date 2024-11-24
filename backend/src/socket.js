import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const initializeSocket = (server, corsOptions) => {
    const io = new Server(server, {
        cors: corsOptions,
        transports: ["websocket"],
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if(!token){
            return next(new Error("Authentication error"));
        }

        try{
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            socket.userId = decoded._id;
            next();
        } catch(err){
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connect hua hai: ${socket.id}`);

        socket.on("join", (userId) => {
            socket.join(userId);
            console.log(`User ne room join kiya: ${userId}`);
        });

        socket.on("typing", ({ chatId, userId }) => {
            socket.to(userId).emit("userTyping", { chatId, userId });
        });

        socket.on("stopTyping", ({ chatId, userId }) => {
            socket.to(userId).emit("userStoppedTyping", { chatId, userId });
        });

        socket.on("disconnect", () => {
            console.log(`User disconnect hua: ${socket.id}`);
        });
    });

    return io;
};

export const emitSocketEvents = {

    chatCreated: (io, roomIds, chat) => {
        roomIds.forEach((userId) => {
            io.to(userId).emit("chatCreated", chat);
        })
    },

    messageUpdated: (io, participantIds, messageData) => {
        participantIds.forEach((userId) => {
            io.to(userId).emit("chatUpdated", messageData);
        });
    },

    messageRead: (io, participantIds, readData) => {
        participantIds.forEach((userId) => {
            io.to(userId).emit("messageRead", readData);
        })
    },

    participantsAdded: (io, participantIds, chat) => {
        participantIds.forEach((userId) => {
            console.log("hi", userId)
            io.to(userId).emit("groupUpdated", chat);
        })
    },

    participantRemoved: (io, participantIds, chat) => {
        participantIds.forEach((userId) => {
            io.to(userId).emit("groupRemoved", chat);
        })
    },

    groupEdited: (io, participantIds, chat) => {
        participantIds.forEach((userId) => {
            io.to(userId).emit("groupEdited", chat);
        })
    },

    groupDeleted: (io, participantIds, chat) => {
        participantIds.forEach((userId) => {
            io.to(userId).emit("groupDeleted", chat);
        })
    }
};

export default initializeSocket;