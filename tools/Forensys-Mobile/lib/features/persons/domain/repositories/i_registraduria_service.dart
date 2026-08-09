abstract class IRegistraduriaService {
  /// Consulta los datos básicos de un ciudadano en la Registraduría
  Future<Map<String, dynamic>> consultarCiudadanoPorCedula(String cedula);
  
  /// Valida si una cédula está activa, cancelada, o dada de baja
  Future<bool> validarEstadoCedula(String cedula);
}
