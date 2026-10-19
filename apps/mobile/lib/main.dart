import 'package:flutter/material.dart';

// Placeholder from T00 (repo bootstrap). T06 replaces this with the real entry
// point: edge-to-edge, Supabase only when SUPABASE_URL is set (otherwise
// FIXTURES mode), guarded push and Crashlytics, and the go_router shell.
void main() {
  runApp(const PlinthApp());
}

class PlinthApp extends StatelessWidget {
  const PlinthApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Plinth',
      home: Scaffold(
        body: Center(child: Text('Plinth')),
      ),
    );
  }
}
