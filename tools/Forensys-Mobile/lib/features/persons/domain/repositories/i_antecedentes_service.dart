abstract class IAntecedentesService {
  /// Consulta el historial de antecedentes judiciales de una persona
  Future<List<Map<String, dynamic>>> consultarAntecedentesJudiciales(String cedula);
  
  /// Verifica rápidamente si existe una orden de captura vigente
  Future<bool> tieneOrdenCapturaActiva(String cedula);
}
