// FriendsList.jsx — shows friends + add friend
import { useState } from "react"
import "./FriendsList.css"

function FriendsList({ friends, friendRequests, onRefresh }) {
  const [searchQuery, setSearchQuery]   = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]       = useState(false)

  const token = localStorage.getItem("token")

  // search for users by username
  const searchUsers = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res  = await fetch(
        `http://localhost:5000/api/users/search?username=${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setSearchResults(data)
    } catch (err) {
      console.log(err)
    }
    setSearching(false)
  }

  // send friend request
  const sendRequest = async (targetUserId) => {
    try {
      await fetch("http://localhost:5000/api/users/friend-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
      })
      alert("Friend request sent!")
      setSearchResults([])
      setSearchQuery("")
    } catch (err) {
      console.log(err)
    }
  }

  // accept friend request
  const acceptRequest = async (requesterId) => {
    try {
      await fetch("http://localhost:5000/api/users/accept-friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requesterId })
      })
      onRefresh()  // refresh profile data to show new friend
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className="friends-list">
      <h3 className="section-title">Friends</h3>

      {/* SEARCH */}
      <div className="friend-search">
        <input
          className="friend-search-input"
          placeholder="Search players..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && searchUsers()}
        />
        <button className="friend-search-btn" onClick={searchUsers}>
          {searching ? "..." : "Search"}
        </button>
      </div>

      {/* SEARCH RESULTS */}
      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(u => (
            <div key={u._id} className="search-result-row">
              <div className="friend-avatar">{u.username[0].toUpperCase()}</div>
              <div className="friend-info">
                <span className="friend-name">{u.username}</span>
                <span className="friend-elo">{u.elo} ELO</span>
              </div>
              <button className="add-btn" onClick={() => sendRequest(u._id)}>
                + Add
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FRIEND REQUESTS */}
      {friendRequests?.length > 0 && (
        <div className="requests-section">
          <p className="subsection-title">Requests ({friendRequests.length})</p>
          {friendRequests.map(req => (
            <div key={req._id} className="friend-row">
              <div className="friend-avatar">{req.username[0].toUpperCase()}</div>
              <div className="friend-info">
                <span className="friend-name">{req.username}</span>
                <span className="friend-elo">{req.elo} ELO</span>
              </div>
              <button className="accept-btn" onClick={() => acceptRequest(req._id)}>
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FRIENDS LIST */}
      <div className="friends-section">
        {(!friends || friends.length === 0) && (
          <p className="no-friends">No friends yet. Search for players!</p>
        )}
        {friends?.map(friend => (
          <div key={friend._id} className="friend-row">
            <div className="friend-avatar">{friend.username[0].toUpperCase()}</div>
            <div className="friend-info">
              <span className="friend-name">{friend.username}</span>
              <span className="friend-elo">{friend.elo} ELO</span>
            </div>
            <div className={`online-dot ${friend.isOnline ? "online" : "offline"}`}></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FriendsList