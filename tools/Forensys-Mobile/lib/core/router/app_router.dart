import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../../features/persons/presentation/pages/person_search_page.dart';
import '../../../features/evidence/presentation/pages/camera_page.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        name: 'dashboard',
        builder: (context, state) => const DashboardPage(),
      ),
      GoRoute(
        path: '/persons',
        name: 'persons',
        builder: (context, state) => const PersonSearchPage(),
      ),
      GoRoute(
        path: '/evidence',
        name: 'evidence',
        builder: (context, state) => const CameraPage(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Error: ${state.error}'),
      ),
    ),
  );
}
