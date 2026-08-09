import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/local_suspect_repository.dart';
import '../../domain/entities/suspect.dart';

final localSuspectRepositoryProvider = Provider((ref) => LocalSuspectRepository());

final suspectSearchQueryProvider = StateProvider<String>((ref) => '');

final suspectSearchProvider = FutureProvider<List<Suspect>>((ref) async {
  final query = ref.watch(suspectSearchQueryProvider);
  final repository = ref.read(localSuspectRepositoryProvider);
  
  if (query.isEmpty) {
    return repository.getAllSuspects();
  }
  return repository.searchSuspects(query);
});
