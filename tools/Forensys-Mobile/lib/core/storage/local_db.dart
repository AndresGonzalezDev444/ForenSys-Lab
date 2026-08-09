import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';

class LocalDb {
  static late Database instance;

  static Future<void> initialize() async {
    final dir = await getApplicationDocumentsDirectory();
    final dbPath = join(dir.path, 'ciberforense.db');

    instance = await openDatabase(
      dbPath,
      version: 1,
      onCreate: _createDB,
    );
  }

  static Future<void> _createDB(Database db, int version) async {
    // 1. Table users
    await db.execute('''
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        hashed_password TEXT,
        role TEXT DEFAULT 'investigator'
      )
    ''');
    await db.execute('CREATE INDEX ix_users_id ON users (id)');
    await db.execute('CREATE INDEX ix_users_username ON users (username)');

    // 2. Table suspects
    await db.execute('''
      CREATE TABLE suspects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT,
        last_name TEXT,
        identification TEXT UNIQUE,
        photo_path TEXT,
        fingerprint_path TEXT,
        behavior_profile TEXT
      )
    ''');
    await db.execute('CREATE INDEX ix_suspects_id ON suspects (id)');
    await db.execute('CREATE INDEX ix_suspects_first_name ON suspects (first_name)');
    await db.execute('CREATE INDEX ix_suspects_last_name ON suspects (last_name)');
    await db.execute('CREATE INDEX ix_suspects_identification ON suspects (identification)');

    // 3. Table face_photos
    await db.execute('''
      CREATE TABLE face_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        suspect_id INTEGER,
        file_path TEXT NOT NULL,
        angle TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(suspect_id) REFERENCES suspects(id)
      )
    ''');
    await db.execute('CREATE INDEX ix_face_photos_id ON face_photos (id)');

    // 4. Table alerts
    await db.execute('''
      CREATE TABLE alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        suspect_id INTEGER,
        detection_type TEXT,
        location TEXT,
        details TEXT,
        FOREIGN KEY(suspect_id) REFERENCES suspects(id)
      )
    ''');
    await db.execute('CREATE INDEX ix_alerts_id ON alerts (id)');
  }
}
