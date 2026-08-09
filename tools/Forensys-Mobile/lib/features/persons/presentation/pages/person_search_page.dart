import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/person_provider.dart';

class PersonSearchPage extends ConsumerWidget {
  const PersonSearchPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchResults = ref.watch(suspectSearchProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Consulta de Personas'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              onChanged: (value) => ref.read(suspectSearchQueryProvider.notifier).state = value,
              decoration: const InputDecoration(
                hintText: 'Buscar por nombre, apellido o identificación...',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          Expanded(
            child: searchResults.when(
              data: (suspects) {
                if (suspects.isEmpty) {
                  return const Center(
                    child: Text('No se encontraron personas en la base de datos local.'),
                  );
                }
                return ListView.builder(
                  itemCount: suspects.length,
                  itemBuilder: (context, index) {
                    final suspect = suspects[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: Colors.grey.withOpacity(0.2)),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(12),
                        leading: CircleAvatar(
                          radius: 28,
                          backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                          child: Icon(Icons.person, color: Theme.of(context).colorScheme.primary),
                        ),
                        title: Text(
                          '${suspect.firstName ?? ''} ${suspect.lastName ?? ''}'.trim(),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Text('ID: ${suspect.identification ?? 'Desconocida'}'),
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          // TODO: Navigate to Suspect Details
                        },
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(child: Text('Error de base de datos: $error')),
            ),
          ),
        ],
      ),
    );
  }
}
