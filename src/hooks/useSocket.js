// useSocket.js — single shared socket connection
// Import this wherever you need socket access
// By keeping it here, only ONE connection is ever created
import { io } from "socket.io-client"

const socket = io("http://localhost:5000")

export default socket