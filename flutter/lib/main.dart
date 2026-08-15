import 'package:flutter/material.dart';
import 'package:igdm_flutter_client/api_service.dart';
import 'package:igdm_flutter_client/models.dart';

void main() {
  runApp(const IGdmApp());
}

class IGdmApp extends StatelessWidget {
  const IGdmApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'IGdm Flutter Client',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const LoginScreen(),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _apiService = ApiService();
  String _error = '';
  bool _loading = false;

  Future<void> _login() async {
    setState(() {
      _error = '';
      _loading = true;
    });

    try {
      final response = await _apiService.login(
        _usernameController.text.trim(),
        _passwordController.text.trim(),
      );
      final user = User.fromJson(response['userData']['user'] as Map<String, dynamic>);
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => ChatListScreen(user: user),
        ),
      );
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('IGdm Flutter Client')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _usernameController,
              decoration: const InputDecoration(labelText: 'Username'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _loading ? null : _login,
              child: _loading ? const CircularProgressIndicator() : const Text('Login'),
            ),
            if (_error.isNotEmpty) ...[
              const SizedBox(height: 20),
              Text(_error, style: const TextStyle(color: Colors.red)),
            ],
          ],
        ),
      ),
    );
  }
}

class ChatListScreen extends StatefulWidget {
  final User user;
  const ChatListScreen({super.key, required this.user});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final _apiService = ApiService();
  List<ChatThread> _chats = [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadChats();
  }

  Future<void> _loadChats() async {
    try {
      final response = await _apiService.getChatList();
      setState(() {
        _chats = (response as List<dynamic>)
            .map((data) => ChatThread.fromJson(data as Map<String, dynamic>))
            .toList();
        _loading = false;
      });
    } catch (error) {
      setState(() {
        _error = error.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Chats - ${widget.user.username}')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error.isNotEmpty
              ? Center(child: Text(_error, style: const TextStyle(color: Colors.red)))
              : ListView.builder(
                  itemCount: _chats.length,
                  itemBuilder: (context, index) {
                    final chat = _chats[index];
                    return ListTile(
                      title: Text(chat.title),
                      subtitle: Text(chat.threadId),
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ChatScreen(chatThread: chat),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

class ChatScreen extends StatefulWidget {
  final ChatThread chatThread;
  const ChatScreen({super.key, required this.chatThread});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _apiService = ApiService();
  final _messageController = TextEditingController();
  Map<String, dynamic>? _chat;
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadChat();
  }

  Future<void> _loadChat() async {
    try {
      final response = await _apiService.getChat(widget.chatThread.threadId);
      setState(() {
        _chat = response;
        _loading = false;
      });
    } catch (error) {
      setState(() {
        _error = error.toString();
        _loading = false;
      });
    }
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;
    try {
      await _apiService.sendMessage(widget.chatThread.threadId, _messageController.text.trim());
      _messageController.clear();
      _loadChat();
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.chatThread.title)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _chat == null
                      ? Center(child: Text(_error.isEmpty ? 'No chat loaded' : _error))
                      : ListView(
                          children: (_chat?['items'] as List<dynamic>? ?? [])
                              .map(
                                (item) => ListTile(
                                  title: Text(item['user_id']?.toString() ?? 'Unknown'),
                                  subtitle: Text(item['text'] ?? ''),
                                ),
                              )
                              .toList(),
                        ),
            ),
            if (_error.isNotEmpty) ...[
              Text(_error, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 12),
            ],
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(hintText: 'Type a message'),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(onPressed: _sendMessage, child: const Text('Send')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
