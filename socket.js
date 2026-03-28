import { io } from "socket.io-client";

const socket = io("https://socket-server.onrender.com");

export default socket;