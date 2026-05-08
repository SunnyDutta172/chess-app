// ChatBox.jsx — real time chat during a game
// Props:
//   roomCode → to emit messages to the right room
//   username → the logged in user's name
import { useState, useEffect, useRef } from "react"
import socket from "../../hooks/useSocket"
import "./ChatBox.css"

function ChatBox({ roomCode, username }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState("")

  // useRef on a DOM element gives us direct access to it
  // we use this to auto-scroll to the bottom when new messages arrive
  const bottomRef = useRef(null)

  useEffect(() => {
    // listen for incoming chat messages
    socket.on("chatMessage", (msg) => {
      setMessages(prev => [...prev, msg])
    })

    return () => socket.off("chatMessage")
  }, [])

  // auto scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return

    socket.emit("chatMessage", {
      roomCode,
      message: input.trim(),
      username
    })
    setInput("")
  }

  // send on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage()
  }

  return (
    <div className="chatbox">
      <h3 className="chat-title">Chat</h3>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet...</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.username === username ? "mine" : "theirs"}`}>
            <span className="chat-user">{msg.username}</span>
            <span className="chat-text">{msg.message}</span>
            <span className="chat-time">{msg.time}</span>
          </div>
        ))}
        {/* invisible div at the bottom — we scroll to this */}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Say something..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={200}
        />
        <button className="chat-send" onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}

export default ChatBox