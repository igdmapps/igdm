const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const ig = require('./instagramService');
const config = require('./config');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('CORS policy: origin not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const userData = await ig.login(username, password);
    return res.json({ success: true, userData });
  } catch (error) {
    if (ig.isCheckpointError(error)) {
      return res.status(402).json({ error: 'checkpoint_required' });
    }
    if (ig.isTwoFactorError(error)) {
      return res.status(403).json({ error: 'two_factor_required', details: error.response.body.two_factor_info });
    }
    return res.status(500).json({ error: error.message || 'login_failed' });
  }
});

app.post('/logout', async (_req, res) => {
  try {
    await ig.logout();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'logout_failed' });
  }
});

app.get('/session', async (_req, res) => {
  try {
    const session = await ig.hasActiveSession();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message || 'session_check_failed' });
  }
});

app.get('/chat-list', async (_req, res) => {
  try {
    const chats = await ig.getChatList();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message || 'chat_list_failed' });
  }
});

app.get('/chat/:threadId', async (req, res) => {
  try {
    const thread = await ig.getChat(req.params.threadId);
    res.json(thread);
  } catch (error) {
    res.status(500).json({ error: error.message || 'chat_failed' });
  }
});

app.post('/message', async (req, res) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
      return res.status(400).json({ error: 'chatId and message are required' });
    }
    const response = await ig.sendMessage(message, chatId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message || 'message_failed' });
  }
});

app.post('/new-chat', async (req, res) => {
  try {
    const { message, recipients } = req.body;
    if (!message || !recipients) {
      return res.status(400).json({ error: 'message and recipients are required' });
    }
    const response = await ig.sendNewChatMessage(message, recipients);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message || 'new_chat_failed' });
  }
});

app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'query parameter q is required' });
    }
    const users = await ig.searchUsers(q);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message || 'search_failed' });
  }
});

app.get('/unfollowers', async (_req, res, next) => {
  try {
    const unfollowers = await ig.getUnfollowers();
    res.json(unfollowers);
  } catch (error) {
    next(error);
  }
});

app.post('/unfollow', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    await ig.unfollow(userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'endpoint_not_found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'internal_server_error' });
});

app.listen(config.port, config.host, () => {
  console.log(`IGdm API is available at http://${config.host}:${config.port}`);
});
