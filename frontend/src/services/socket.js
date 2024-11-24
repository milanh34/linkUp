import io from "socket.io-client";

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect(token) {
        if (!this.socket) {
            this.socket = io(process.env.REACT_APP_BACKEND_URL, {
                auth: { token },
                transports: ["websocket"]
            });

            this.socket.on("connect", () => {
                console.log("Socket connect ho gaya bhai");
            });

            this.socket.on("connect_error", (error) => {
                console.error("Socket connection error:", error);
            });

            this.socket.on("disconnect", () => {
                console.log("Socket disconnected");
            });
        }
        return this.socket;
    }

    joinRoom(userId) {
        console.log("join bhi hogaya");
        if (this.socket) {
            this.socket.emit("join", userId);
        }
    }

    emitTyping(chatId, userId) {
        if (this.socket) {
            this.socket.emit("typing", { chatId, userId });
        }
    }

    emitStopTyping(chatId, userId) {
        if (this.socket) {
            this.socket.emit("stopTyping", { chatId, userId });
        }
    }

    getSocket() {
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();