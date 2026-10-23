import jsPDF from 'jspdf';
import type { Estimate } from '../../types';
import { formatUZS } from '../calc';

/**
 * Generate a PDF for the given estimate and trigger browser download.
 * Works fully offline.
 */
export async function generatePDF(estimate: Estimate, lang: 'uz' | 'ru' = 'uz'): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 20;

  const labelColor: [number, number, number] = [100, 100, 100];
  const headerColor: [number, number, number] = [30, 90, 60];
  const lineColor: [number, number, number] = [220, 220, 220];

  function line() {
    doc.setDrawColor(...lineColor);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
  }

  function checkPage(needed = 10) {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  }

  // ---- Header ----
  doc.setFontSize(20);
  doc.setTextColor(...headerColor);
  doc.text('Usta Smeta', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(...labelColor);
  const dateStr = new Date(estimate.createdAt).toLocaleDateString('uz-UZ');
  doc.text(lang === 'uz' ? `Sana: ${dateStr}` : `Дата: ${dateStr}`, margin, y);
  y += 5;

  if (estimate.clientName) {
    doc.text(
      lang === 'uz' ? `Mijoz: ${estimate.clientName}` : `Клиент: ${estimate.clientName}`,
      margin,
      y
    );
    y += 5;
  }
  if (estimate.address) {
    doc.text(
      lang === 'uz' ? `Manzil: ${estimate.address}` : `Адрес: ${estimate.address}`,
      margin,
      y
    );
    y += 5;
  }

  y += 2;
  line();

  // ---- Rooms ----
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text(lang === 'uz' ? 'Xonalar' : 'Комнаты', margin, y);
  y += 6;

  estimate.rooms.forEach((room, i) => {
    checkPage(8);
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const name = room.name || (lang === 'uz' ? `Xona ${i + 1}` : `Комната ${i + 1}`);
    doc.text(`${name}  (${room.length}×${room.width}×${room.height}m)`, margin + 2, y);
    y += 5;
  });

  const totalWall = estimate.totalWallArea ?? 0;
  const totalCeiling = estimate.totalCeilingArea ?? 0;
  doc.setFontSize(10);
  doc.setTextColor(...labelColor);
  doc.text(
    lang === 'uz'
      ? `Jami devor maydoni: ${totalWall.toFixed(2)} m²`
      : `Общая площадь стен: ${totalWall.toFixed(2)} м²`,
    margin + 2,
    y
  );
  y += 5;
  if (totalCeiling > 0) {
    doc.text(
      lang === 'uz'
        ? `Jami shift maydoni: ${totalCeiling.toFixed(2)} m²`
        : `Общая площадь потолка: ${totalCeiling.toFixed(2)} м²`,
      margin + 2,
      y
    );
    y += 5;
  }

  y += 2;
  line();

  // ---- Materials table ----
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text(lang === 'uz' ? 'Materiallar' : 'Материалы', margin, y);
  y += 7;

  // Table headers
  const colWidths = [65, 20, 25, 35, 30];
  const cols = lang === 'uz'
    ? ['Nomi', 'Paket', 'Soni', 'Narxi', 'Jami']
    : ['Название', 'Упак.', 'Кол.', 'Цена', 'Итого'];
  let x = margin;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  cols.forEach((col, i) => {
    doc.text(col, x, y);
    x += colWidths[i];
  });
  y += 5;
  line();

  // Table rows
  estimate.materialLines.forEach((mat) => {
    checkPage(7);
    x = margin;
    const name = lang === 'uz' ? mat.name.uz : mat.name.ru;
    const packageLabel = `${mat.packageSize} ${mat.packageUnit}`;
    const packs = mat.packages ?? 0;
    const price = formatUZS(mat.pricePerPackage, '');
    const total = formatUZS(mat.totalCost ?? 0, '');

    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(name.substring(0, 30), x, y);
    x += colWidths[0];
    doc.text(packageLabel, x, y);
    x += colWidths[1];
    doc.text(String(packs), x, y);
    x += colWidths[2];
    doc.text(price, x, y);
    x += colWidths[3];
    doc.text(total, x, y);
    y += 6;
  });

  y += 2;
  line();

  // ---- Totals ----
  const totalArea = totalWall + totalCeiling;
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  const rows = [
    [
      lang === 'uz' ? 'Materiallar jami:' : 'Материалы итого:',
      formatUZS(estimate.totalMaterialCost ?? 0),
    ],
    [
      lang === 'uz'
        ? `Ish haqi (${totalArea.toFixed(1)} m² × ${formatUZS(estimate.laborPricePerM2)}/m²):`
        : `Работы (${totalArea.toFixed(1)} м² × ${formatUZS(estimate.laborPricePerM2)}/м²):`,
      formatUZS(estimate.totalLaborCost ?? 0),
    ],
  ];

  rows.forEach(([label, value]) => {
    checkPage(6);
    doc.text(label, margin, y);
    doc.text(value, pageW - margin, y, { align: 'right' });
    y += 6;
  });

  y += 1;
  doc.setDrawColor(...headerColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  doc.setFontSize(14);
  doc.setTextColor(...headerColor);
  const grandLabel = lang === 'uz' ? 'JAMI SUMMA:' : 'ИТОГО:';
  doc.text(grandLabel, margin, y);
  doc.text(formatUZS(estimate.grandTotal ?? 0), pageW - margin, y, { align: 'right' });
  y += 10;

  // ---- Disclaimer ----
  checkPage(10);
  doc.setFontSize(8);
  doc.setTextColor(150, 50, 50);
  const disclaimer =
    lang === 'uz'
      ? '⚠ Normalar taxminiy. Aniq hisob uchun ustadan tasdiqlash oling.'
      : '⚠ Нормы приблизительные. Уточните у мастера.';
  doc.text(disclaimer, margin, y, { maxWidth: pageW - 2 * margin });

  // ---- Save ----
  const filename = `smeta_${estimate.clientName || estimate.id.slice(0, 8)}_${dateStr.replace(/\./g, '-')}.pdf`;
  doc.save(filename);
}
