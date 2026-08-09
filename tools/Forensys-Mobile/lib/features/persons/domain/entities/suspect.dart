class Suspect {
  final int? id;
  final String? firstName;
  final String? lastName;
  final String? identification;
  final String? photoPath;
  final String? fingerprintPath;
  final String? behaviorProfile;

  Suspect({
    this.id,
    this.firstName,
    this.lastName,
    this.identification,
    this.photoPath,
    this.fingerprintPath,
    this.behaviorProfile,
  });

  factory Suspect.fromMap(Map<String, dynamic> map) {
    return Suspect(
      id: map['id'] as int?,
      firstName: map['first_name'] as String?,
      lastName: map['last_name'] as String?,
      identification: map['identification'] as String?,
      photoPath: map['photo_path'] as String?,
      fingerprintPath: map['fingerprint_path'] as String?,
      behaviorProfile: map['behavior_profile'] as String?,
    );
  }
}
