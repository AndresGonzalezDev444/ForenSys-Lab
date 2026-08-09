import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:camera/camera.dart';

final cameraProvider = FutureProvider<CameraController>((ref) async {
  final cameras = await availableCameras();
  if (cameras.isEmpty) {
    throw Exception('No cameras available');
  }
  
  // Use the first rear camera
  final camera = cameras.firstWhere(
    (c) => c.lensDirection == CameraLensDirection.back,
    orElse: () => cameras.first,
  );

  final controller = CameraController(
    camera,
    ResolutionPreset.high,
    enableAudio: false,
  );

  await controller.initialize();
  return controller;
});
