import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:camera/camera.dart';
import 'package:go_router/go_router.dart';
import '../providers/camera_provider.dart';
import '../../domain/entities/face_photo.dart';
import '../../data/repositories/local_evidence_repository.dart';

class CameraPage extends ConsumerWidget {
  const CameraPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cameraState = ref.watch(cameraProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Captura de Evidencia'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
      body: cameraState.when(
        data: (controller) {
          return Stack(
            children: [
              Positioned.fill(
                child: CameraPreview(controller),
              ),
              Align(
                alignment: Alignment.bottomCenter,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 32.0),
                  child: FloatingActionButton(
                    onPressed: () async {
                      try {
                        final image = await controller.takePicture();
                        final photo = FacePhoto(
                          filePath: image.path,
                          angle: 'FRONTAL',
                        );
                        
                        final repo = LocalEvidenceRepository();
                        await repo.insertFacePhoto(photo);

                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Evidencia guardada localmente')),
                          );
                          context.pop();
                        }
                      } catch (e) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Error: $e')),
                        );
                      }
                    },
                    backgroundColor: Colors.white,
                    child: const Icon(Icons.camera_alt, color: Colors.black, size: 32),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Colors.white)),
        error: (error, stack) => Center(
          child: Text('Error al inicializar cámara:\n$error', style: const TextStyle(color: Colors.white)),
        ),
      ),
    );
  }
}
