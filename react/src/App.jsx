import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  timeout: 10000,
});

export default function App() {
  const [user, setUser] = useState(null);
  const [loginState, setLoginState] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const response = await api.get('/session');
      if (response.data.isLoggedIn) {
        setUser(response.data.userInfo);
        loadChatList();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadChatList() {
    try {
      const response = await api.get('/chat-list');
      setChats(response.data);
    } catch (err) {
      setError('Unable to load chats.');
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/login', loginState);
      setUser(response.data.userData.user);
      loadChatList();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  }

  async function openChat(threadId) {
    try {
      const response = await api.get(`/chat/${threadId}`);
      setSelectedChat(response.data);
    } catch (err) {
      setError('Unable to open chat.');
    }
  }

  async function sendMessage() {
    if (!selectedChat || !messageText.trim()) {
      return;
    }
    try {
      await api.post('/message', {
        chatId: selectedChat.thread_id,
        message: messageText.trim(),
      });
      setMessageText('');
      openChat(selectedChat.thread_id);
    } catch (err) {
      setError('Failed to send message.');
    }
  }

  if (!user) {
    return (
      <main className="container">
        <h1>IGdm React Client</h1>
        <form onSubmit={handleLogin} className="card">
          <label>
            Username
            <input
              value={loginState.username}
              onChange={(e) => setLoginState({ ...loginState, username: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={loginState.password}
              onChange={(e) => setLoginState({ ...loginState, password: e.target.value })}
              required
            />
          </label>
          <button type="submit">Login</button>
          {error && <p className="error">{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="container">
      <header>
        <h1>Instagram DM</h1>
        <p>Logged in as {user.username}</p>
      </header>

      <section className="layout">
        <aside className="sidebar">
          <h2>Chats</h2>
          {chats.length === 0 && <p>No recent chats</p>}
          <ul>
            {chats.map((chat) => (
              <li key={chat.thread_id} onClick={() => openChat(chat.thread_id)}>
                {chat.thread_title || chat.users.map((u) => u.username).join(', ')}
              </li>
            ))}
          </ul>
        </aside>

        <article className="chat-box">
          {selectedChat ? (
            <>
              <h2>{selectedChat.thread_title || 'Chat'}</h2>
              <div className="messages">
                {selectedChat.items?.map((item) => (
                  <div key={item.item_id} className="message-item">
                    <strong>{item.user_id === user.pk ? 'You' : item.user_id}</strong>
                    <p>{item.text || item.item_id}</p>
                  </div>
                ))}
              </div>
              <div className="composer">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message"
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </>
          ) : (
            <p>Select a chat to view messages.</p>
          )}
          {error && <p className="error">{error}</p>}
        </article>
      </section>
    </main>
  );
}
