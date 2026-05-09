// useSocket.js — single shared socket connection
// Import this wherever you need socket access
// By keeping it here, only ONE connection is ever created
import { io } from "socket.io-client"
import BASE_URL from "../config"

const socket = io(BASE_URL)
export default socket