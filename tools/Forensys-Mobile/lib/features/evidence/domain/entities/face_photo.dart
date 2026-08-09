class FacePhoto {
  final int? id;
  final int? suspectId;
  final String filePath;
  final String? angle;
  final String? createdAt;

  FacePhoto({
    this.id,
    this.suspectId,
    required this.filePath,
    this.angle,
    this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'suspect_id': suspectId,
      'file_path': filePath,
      'angle': angle,
    };
  }
}
