import 'package:sqflite/sqflite.dart';
import '../../../../core/storage/local_db.dart';
import '../../domain/entities/face_photo.dart';

class LocalEvidenceRepository {
  Future<int> insertFacePhoto(FacePhoto photo) async {
    final db = LocalDb.instance;
    return await db.insert(
      'face_photos',
      photo.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }
}
