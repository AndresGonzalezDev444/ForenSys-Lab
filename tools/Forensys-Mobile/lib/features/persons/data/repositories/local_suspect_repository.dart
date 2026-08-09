import '../../../../core/storage/local_db.dart';
import '../../domain/entities/suspect.dart';

class LocalSuspectRepository {
  Future<List<Suspect>> searchSuspects(String query) async {
    final db = LocalDb.instance;
    final results = await db.query(
      'suspects',
      where: 'first_name LIKE ? OR last_name LIKE ? OR identification LIKE ?',
      whereArgs: ['%$query%', '%$query%', '%$query%'],
    );
    return results.map((e) => Suspect.fromMap(e)).toList();
  }

  Future<List<Suspect>> getAllSuspects() async {
    final db = LocalDb.instance;
    final results = await db.query('suspects');
    return results.map((e) => Suspect.fromMap(e)).toList();
  }
}
