import type { Estimate, UserProfile } from '../../types';
import { formatUZS } from '../calc';
import { getUserProfile } from '../profile';
import { generatePDFBlob } from '../pdf';
import { getJobType } from '../../features/jobTypes/loader';

/**
 * Format estimate as a clean, readable text message suitable for Telegram / WhatsApp.
 */
export function buildEstimateShareText(
  estimate: Estimate,
  lang: 'uz' | 'ru' = 'uz',
  profile?: UserProfile
): string {
  const userProfile = profile || getUserProfile();
  const totalArea = (estimate.totalWallArea ?? 0) + (estimate.totalCeilingArea ?? 0);
  const dateStr = new Date(estimate.createdAt).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU');
  const jobType = getJobType(estimate.jobTypeId);
  const jtName = jobType ? (lang === 'uz' ? jobType.name.uz : jobType.name.ru) : '';
  const jtIcon = jobType?.icon || '🏗️';

  if (lang === 'uz') {
    const lines = [
      `📋 SMETA: ${estimate.clientName || 'Mijoz'}`,
      jtName ? `${jtIcon} Ish turi: ${jtName}` : '',
      estimate.address ? `📍 Manzil: ${estimate.address}` : '',
      `📅 Sana: ${dateStr}`,
      `📐 Jami maydon: ${totalArea.toFixed(1)} m² (${estimate.rooms.length} ta xona)`,
      '',
      `🧱 Materiallar: ${formatUZS(estimate.totalMaterialCost ?? 0)}`,
      `🛠 Ish haqi: ${formatUZS(estimate.totalLaborCost ?? 0)}`,
      `💰 JAMI: ${formatUZS(estimate.grandTotal ?? 0)}`,
    ];

    if (userProfile.name) {
      lines.push('');
      lines.push(`👷 Usta: ${userProfile.name}`);
      if (userProfile.phone) lines.push(`📞 Tel: ${userProfile.phone}`);
    }

    lines.push('');
    lines.push('🏗️ Usta Smeta orqali hisoblandi');
    return lines.filter((l) => l !== '').join('\n');
  } else {
    const lines = [
      `📋 СМЕТА: ${estimate.clientName || 'Клиент'}`,
      jtName ? `${jtIcon} Тип работы: ${jtName}` : '',
      estimate.address ? `📍 Адрес: ${estimate.address}` : '',
      `📅 Дата: ${dateStr}`,
      `📐 Общая площадь: ${totalArea.toFixed(1)} м² (${estimate.rooms.length} комн.)`,
      '',
      `🧱 Материалы: ${formatUZS(estimate.totalMaterialCost ?? 0)}`,
      `🛠 Работы: ${formatUZS(estimate.totalLaborCost ?? 0)}`,
      `💰 ИТОГО: ${formatUZS(estimate.grandTotal ?? 0)}`,
    ];

    if (userProfile.name) {
      lines.push('');
      lines.push(`👷 Мастер: ${userProfile.name}`);
      if (userProfile.phone) lines.push(`📞 Тел: ${userProfile.phone}`);
    }

    lines.push('');
    lines.push('🏗️ Рассчитано в Usta Smeta');
    return lines.filter((l) => l !== '').join('\n');
  }
}

/**
 * Share estimate via native device share sheet (PDF file if supported, or text).
 */
export async function shareEstimate(
  estimate: Estimate,
  lang: 'uz' | 'ru' = 'uz'
): Promise<'shared-file' | 'shared-text' | 'fallback'> {
  const profile = getUserProfile();
  const shareText = buildEstimateShareText(estimate, lang, profile);
  const title = lang === 'uz' ? `Smeta - ${estimate.clientName || 'Mijoz'}` : `Смета - ${estimate.clientName || 'Клиент'}`;

  // Try file sharing if supported
  if (navigator.share) {
    try {
      const { file } = await generatePDFBlob(estimate, lang, profile);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text: shareText,
        });
        return 'shared-file';
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return 'shared-file'; // User cancelled share
    }

    // Try text sharing if file share fails
    try {
      await navigator.share({
        title,
        text: shareText,
      });
      return 'shared-text';
    } catch (err: any) {
      if (err.name === 'AbortError') return 'shared-text';
    }
  }

  return 'fallback';
}

/**
 * Open direct Telegram share link with prefilled text.
 */
export function openTelegramShare(estimate: Estimate, lang: 'uz' | 'ru' = 'uz'): void {
  const profile = getUserProfile();
  const text = buildEstimateShareText(estimate, lang, profile);
  const url = `https://t.me/share/url?url=${encodeURIComponent('')}&text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
