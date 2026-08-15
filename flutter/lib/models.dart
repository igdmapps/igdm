class User {
  final int pk;
  final String username;

  User({required this.pk, required this.username});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      pk: json['pk'] as int,
      username: json['username'] as String,
    );
  }
}

class ChatThread {
  final String threadId;
  final String title;
  final List<dynamic> items;

  ChatThread({required this.threadId, required this.title, required this.items});

  factory ChatThread.fromJson(Map<String, dynamic> json) {
    final title = json['thread_title'] as String? ??
        ((json['users'] as List<dynamic>?)?.map((u) => u['username'] as String).join(', ') ?? 'Chat');

    return ChatThread(
      threadId: json['thread_id'] as String,
      title: title,
      items: json['items'] as List<dynamic>? ?? [],
    );
  }
}
