import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { CaseInfo } from '../../store/useSceneStore';
import type { SceneObject } from '../../types/scene';
import type { MeasurementResult } from '../math/measurements';

export function exportToPDF(caseInfo: CaseInfo, objects: Record<string, SceneObject>, measurements: MeasurementResult[], observations: string[]) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('ForenSys Ballistics - Informe Pericial', 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`ID Caso: ${caseInfo.id}`, 14, 30);
  doc.text(`Nombre: ${caseInfo.name}`, 14, 36);
  doc.text(`Fecha: ${caseInfo.date}`, 14, 42);
  doc.text(`Investigador: ${caseInfo.investigator}`, 14, 48);

  // Objetos en Escena
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Objetos en Escena', 14, 65);

  const objectsData = Object.values(objects).map(obj => [
    obj.id,
    obj.name,
    obj.type,
    `[${obj.position.join(', ')}]`
  ]);

  (doc as any).autoTable({
    startY: 70,
    head: [['ID', 'Nombre', 'Tipo', 'Posición (X, Y, Z)']],
    body: objectsData,
    theme: 'striped',
    headStyles: { fillColor: [42, 45, 61] }
  });

  // Observaciones
  let finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.text('Observaciones del Perito', 14, finalY);
  
  const obsData = observations.map(obs => [obs]);
  (doc as any).autoTable({
    startY: finalY + 5,
    head: [['Registro']],
    body: obsData,
    theme: 'plain',
    styles: { cellPadding: 2, fontSize: 10 }
  });

  // Mediciones
  finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.text('Mediciones Realizadas', 14, finalY);

  const measData = measurements.map(m => [
    m.id,
    `${m.distance} m`,
    `ΔX: ${m.deltaX}, ΔY: ${m.deltaY}, ΔZ: ${m.deltaZ}`
  ]);

  (doc as any).autoTable({
    startY: finalY + 5,
    head: [['ID', 'Distancia', 'Deltas']],
    body: measData,
    theme: 'striped',
    headStyles: { fillColor: [42, 45, 61] }
  });

  // Guardar PDF
  doc.save(`${caseInfo.id}_Informe_Balistico.pdf`);
}

