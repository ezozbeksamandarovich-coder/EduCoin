import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final session = await SessionStore.load();
  runApp(EduCoinApp(initialSession: session));
}

class SessionData {
  final String role;
  final String name;
  final String username;

  const SessionData({
    required this.role,
    required this.name,
    required this.username,
  });

  Map<String, String> toJson() => {
        'role': role,
        'name': name,
        'username': username,
      };

  static SessionData? fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return null;
    }

    final role = (json['role'] ?? '').toString().trim();
    final name = (json['name'] ?? '').toString().trim();
    final username = (json['username'] ?? '').toString().trim();
    if (role.isEmpty || username.isEmpty) {
      return null;
    }

    return SessionData(
      role: role,
      name: name.isEmpty ? username : name,
      username: username,
    );
  }
}

class SessionStore {
  static const _storageKey = 'educoin_mobile_session';

  static Future<SessionData?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) {
      return null;
    }

    try {
      return SessionData.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      await prefs.remove(_storageKey);
      return null;
    }
  }

  static Future<void> save(SessionData session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, jsonEncode(session.toJson()));
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
  }
}

class ApiLoginUser {
  final String role;
  final String name;
  final String username;

  const ApiLoginUser({
    required this.role,
    required this.name,
    required this.username,
  });

  SessionData toSession() => SessionData(role: role, name: name, username: username);

  static ApiLoginUser? fromResponse(Map<String, dynamic> data, String fallbackUsername) {
    if (data['success'] != true) {
      return null;
    }

    final nestedUser = data['user'];
    if (nestedUser is Map<String, dynamic>) {
      final role = (nestedUser['role'] ?? '').toString().trim();
      final username = (nestedUser['username'] ?? fallbackUsername).toString().trim();
      final name = (nestedUser['name'] ?? nestedUser['fullName'] ?? username).toString().trim();
      if (role.isEmpty || username.isEmpty) {
        return null;
      }
      return ApiLoginUser(role: role, name: name.isEmpty ? username : name, username: username);
    }

    final role = (data['role'] ?? '').toString().trim();
    final username = (data['username'] ?? fallbackUsername).toString().trim();
    final name = (data['name'] ?? username).toString().trim();
    if (role.isEmpty || username.isEmpty) {
      return null;
    }

    return ApiLoginUser(role: role, name: name.isEmpty ? username : name, username: username);
  }
}

class EduCoinApp extends StatelessWidget {
  final SessionData? initialSession;

  const EduCoinApp({super.key, required this.initialSession});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'EduCoin Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF00FF88)),
        useMaterial3: true,
      ),
      home: initialSession == null
          ? const LoginScreen()
          : DashboardScreen(session: initialSession!),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _userCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _userCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final username = _userCtrl.text.trim();
    final password = _passCtrl.text;

    if (username.isEmpty || password.isEmpty) {
      setState(() {
        _error = 'Username va parolni kiriting';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      );

      final Map<String, dynamic> data = jsonDecode(response.body) as Map<String, dynamic>;
      final apiUser = ApiLoginUser.fromResponse(data, username);

      if (apiUser != null && mounted) {
        final session = apiUser.toSession();
        await SessionStore.save(session);
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => DashboardScreen(session: session)),
        );
      } else {
        setState(() {
          _error = (data['message'] ?? 'Login xatoligi').toString();
        });
      }
    } catch (_) {
      setState(() {
        _error = 'Serverga ulanishda xatolik';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF041008), Color(0xFF021A0F), Color(0xFF001D12)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'EduCoin Mobile',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Bitta backend, bir xil login oqimi',
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 18),
                        TextField(
                          controller: _userCtrl,
                          decoration: const InputDecoration(labelText: 'Username'),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _passCtrl,
                          obscureText: true,
                          decoration: const InputDecoration(labelText: 'Password'),
                          onSubmitted: (_) => _loading ? null : _login(),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!, style: const TextStyle(color: Colors.red)),
                        ],
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: _loading ? null : _login,
                            child: _loading
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Text('Kirish'),
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Server: http://10.0.2.2:3000/api',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  final SessionData session;

  const DashboardScreen({super.key, required this.session});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int? coins;
  String? message;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    try {
      final uri = Uri.parse('${AppConfig.apiBaseUrl}/dashboard/${widget.session.role}')
          .replace(queryParameters: {'username': widget.session.username});
      final res = await http.get(uri);
      final Map<String, dynamic> data = jsonDecode(res.body) as Map<String, dynamic>;
      setState(() {
        coins = (data['coins'] as num?)?.toInt();
        message = data['message']?.toString();
      });
    } catch (_) {
      setState(() {
        message = "Ma'lumotlarni yuklab bo'lmadi";
      });
    }
  }

  Future<void> _logout() async {
    await SessionStore.clear();
    if (!mounted) {
      return;
    }
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('EduCoin Dashboard'),
        actions: [
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout),
            tooltip: 'Chiqish',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Salom, ${widget.session.name}',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text('Role: ${widget.session.role.toUpperCase()}'),
            Text('Login: ${widget.session.username}'),
            const SizedBox(height: 20),
            Card(
              child: ListTile(
                title: const Text('Coin balansi'),
                subtitle: Text(coins == null ? 'Yuklanmoqda...' : '$coins coin'),
                trailing: const Icon(Icons.monetization_on),
              ),
            ),
            const SizedBox(height: 10),
            Text(message ?? '...'),
          ],
        ),
      ),
    );
  }
}
