import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config.dart';

class ApiService {
  final Uri baseUri = Uri.parse(kIgdmApiBaseUrl);

  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$kIgdmApiBaseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );
    return _processResponse(response);
  }

  Future<List<dynamic>> getChatList() async {
    final response = await http.get(Uri.parse('$kIgdmApiBaseUrl/chat-list'));
    return _processResponse(response) as List<dynamic>;
  }

  Future<Map<String, dynamic>> getChat(String threadId) async {
    final response = await http.get(Uri.parse('$kIgdmApiBaseUrl/chat/$threadId'));
    return _processResponse(response) as Map<String, dynamic>;
  }

  Future<void> sendMessage(String chatId, String message) async {
    final response = await http.post(
      Uri.parse('$kIgdmApiBaseUrl/message'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({ 'chatId': chatId, 'message': message }),
    );
    _processResponse(response);
  }

  dynamic _processResponse(http.Response response) {
    final body = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    throw Exception(body['error'] ?? 'Unknown API error');
  }
}
