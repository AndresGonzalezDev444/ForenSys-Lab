abstract class IRuntService {
  /// Consulta los datos generales de un vehículo en el RUNT
  Future<Map<String, dynamic>> consultarVehiculoPorPlaca(String placa);
  
  /// Consulta el estado y vigencia del SOAT
  Future<Map<String, dynamic>> consultarSOAT(String placa);
  
  /// Consulta el estado y vigencia de la Revisión Técnico Mecánica
  Future<Map<String, dynamic>> consultarTecnomecanica(String placa);
}
