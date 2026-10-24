import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Room, Estimate, MaterialLine } from '../../types';
import { getJobType, getAllJobTypes } from '../jobTypes/loader';
import {
  buildMaterialLines,
  computeEstimate,
  calcRoomWallArea,
  calcRoomCeilingArea,
  formatUZS,
  parseDecimal,
  DEFAULT_DOOR_AREA,
  DEFAULT_WINDOW_AREA,
} from '../../lib/calc';
import { saveEstimate, getEstimate } from '../../lib/db';

// ---- helpers ----

function newRoom(index: number): Room {
  return {
    id: crypto.randomUUID(),
    name: '',
    length: 0,
    width: 0,
    height: 2.7,
    doors: 1,
    windows: 1,
    doorArea: DEFAULT_DOOR_AREA,
    windowArea: DEFAULT_WINDOW_AREA,
    includeCeiling: false,
  };
}

function newEstimate(jobTypeId: string): Estimate {
  const jobType = getJobType(jobTypeId)!;
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    clientName: '',
    address: '',
    jobTypeId,
    rooms: [newRoom(0)],
    materialLines: buildMaterialLines(jobType),
    laborPricePerM2: jobType.defaultLaborPricePerUnit,
  };
}

// ---- Room Form Component ----

interface RoomCardProps {
  room: Room;
  index: number;
  lang: 'uz' | 'ru';
  onChange: (updated: Room) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function RoomCard({ room, index, lang, onChange, onRemove, canRemove }: RoomCardProps) {
  const { t } = useTranslation();

  const update = (field: keyof Room, value: string | boolean | number) => {
    const numVal = typeof value === 'string' ? parseDecimal(value) : value;
    onChange({ ...room, [field]: numVal });
  };

  const wallArea = calcRoomWallArea(room);
  const ceilArea = room.includeCeiling ? calcRoomCeilingArea(room) : 0;

  return (
    <div className="room-card">
      <div className="room-card__header">
        <span className="room-card__title">
          🚪 {t('room.title')} {index + 1}
        </span>
        {canRemove && (
          <button className="btn btn-danger btn-sm" onClick={onRemove}>
            {t('room.remove')}
          </button>
        )}
      </div>

      <div className="form-group mt-8">
        <label className="form-label">{t('room.nameLabel')}</label>
        <input
          className="form-input"
          placeholder={t('room.namePlaceholder')}
          value={room.name}
          onChange={(e) => onChange({ ...room, name: e.target.value })}
        />
      </div>

      <div className="form-row mt-8">
        <div className="form-group">
          <label className="form-label">{t('room.length')}</label>
          <input
            className="form-input"
            type="text"
            inputMode="decimal"
            placeholder="0"
            defaultValue={room.length || ''}
            onBlur={(e) => update('length', e.target.value)}
            key={`len-${room.id}`}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('room.width')}</label>
          <input
            className="form-input"
            type="text"
            inputMode="decimal"
            placeholder="0"
            defaultValue={room.width || ''}
            onBlur={(e) => update('width', e.target.value)}
            key={`wid-${room.id}`}
          />
        </div>
      </div>

      <div className="form-row mt-8">
        <div className="form-group">
          <label className="form-label">{t('room.height')}</label>
          <input
            className="form-input"
            type="text"
            inputMode="decimal"
            placeholder="2.7"
            defaultValue={room.height || ''}
            onBlur={(e) => update('height', e.target.value)}
            key={`h-${room.id}`}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('room.paintArea')}</label>
          <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
            <span className="room-area-badge">
              {wallArea.toFixed(1)} m²
              {ceilArea > 0 && ` + ${ceilArea.toFixed(1)} m²`}
            </span>
          </div>
        </div>
      </div>

      <div className="form-row-3 mt-8">
        <div className="form-group">
          <label className="form-label">{t('room.doors')}</label>
          <input
            className="form-input"
            type="number"
            inputMode="numeric"
            min="0"
            value={room.doors}
            onChange={(e) => onChange({ ...room, doors: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('room.doorArea')} m²</label>
          <input
            className="form-input"
            type="text"
            inputMode="decimal"
            defaultValue={room.doorArea}
            onBlur={(e) => update('doorArea', e.target.value)}
            key={`da-${room.id}`}
          />
        </div>
        <div className="form-group" style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <label className="form-label">&nbsp;</label>
          <div style={{ height: 48 }} />
        </div>
      </div>

      <div className="form-row-3 mt-8">
        <div className="form-group">
          <label className="form-label">{t('room.windows')}</label>
          <input
            className="form-input"
            type="number"
            inputMode="numeric"
            min="0"
            value={room.windows}
            onChange={(e) => onChange({ ...room, windows: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('room.windowArea')} m²</label>
          <input
            className="form-input"
            type="text"
            inputMode="decimal"
            defaultValue={room.windowArea}
            onBlur={(e) => update('windowArea', e.target.value)}
            key={`wa-${room.id}`}
          />
        </div>
        <div className="form-group" style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <div style={{ height: 48 }} />
        </div>
      </div>

      <label className="checkbox-row mt-8">
        <input
          type="checkbox"
          checked={room.includeCeiling}
          onChange={(e) => onChange({ ...room, includeCeiling: e.target.checked })}
        />
        {t('room.addCeiling')}
      </label>
    </div>
  );
}

// ---- Materials Section ----

interface MaterialsSectionProps {
  lines: MaterialLine[];
  totalArea: number;
  lang: 'uz' | 'ru';
  onChange: (lines: MaterialLine[]) => void;
}

function MaterialsSection({ lines, totalArea, lang, onChange }: MaterialsSectionProps) {
  const { t } = useTranslation();

  const updateLine = (idx: number, field: keyof MaterialLine, value: string) => {
    const updated = [...lines];
    (updated[idx] as any)[field] = parseDecimal(value);
    onChange(updated);
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: 12 }}>🧱 {t('estimate.materials')}</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="materials-table">
          <thead>
            <tr>
              <th>{t('material.name')}</th>
              <th>{t('material.consumptionHeader')}</th>
              <th>{t('material.packages')}</th>
              <th>{t('material.pricePerPackage')}</th>
              <th>{t('material.total')}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => {
              const qty = totalArea * line.consumptionPerUnit;
              const packages = Math.ceil(qty / line.packageSize);
              const total = packages * line.pricePerPackage;
              return (
                <tr key={line.materialId}>
                  <td style={{ fontWeight: 600, minWidth: 120 }}>
                    {lang === 'uz' ? line.name.uz : line.name.ru}
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {line.packageSize} {line.packageUnit}
                    </div>
                  </td>
                  <td>
                    <input
                      className="editable-input"
                      type="text"
                      inputMode="decimal"
                      defaultValue={line.consumptionPerUnit}
                      onBlur={(e) => updateLine(idx, 'consumptionPerUnit', e.target.value)}
                      key={`c-${line.materialId}`}
                      style={{ width: 60 }}
                    />
                  </td>
                  <td style={{ fontWeight: 700, textAlign: 'center' }}>{packages}</td>
                  <td>
                    <input
                      className="editable-input"
                      type="text"
                      inputMode="decimal"
                      defaultValue={line.pricePerPackage}
                      onBlur={(e) => updateLine(idx, 'pricePerPackage', e.target.value)}
                      key={`p-${line.materialId}`}
                      style={{ width: 90 }}
                    />
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                    {formatUZS(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Main Form Page ----

export default function EstimateFormPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const lang = i18n.language as 'uz' | 'ru';
  const jobTypes = getAllJobTypes();

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [saving, setSaving] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchParams] = useSearchParams();
  const jobTypeParam = searchParams.get('jobType');

  // Load existing or create new
  useEffect(() => {
    if (id) {
      getEstimate(id).then((est) => {
        if (est) setEstimate(est);
        else navigate('/', { replace: true });
      });
    } else {
      const selectedJobType = (jobTypeParam && getJobType(jobTypeParam))
        ? jobTypeParam
        : jobTypes[0].id;
      setEstimate(newEstimate(selectedJobType));
    }
  }, [id, jobTypeParam]);

  // Autosave draft
  const autosave = useCallback((est: Estimate) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      await saveEstimate({ ...est, updatedAt: Date.now() });
    }, 1000);
  }, []);

  const update = (patch: Partial<Estimate>) => {
    setEstimate((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      autosave(next);
      return next;
    });
  };

  const handleSave = async () => {
    if (!estimate) return;
    setSaving(true);
    await saveEstimate({ ...estimate, updatedAt: Date.now() });
    setSaving(false);
    navigate(`/estimate/${estimate.id}`);
  };

  if (!estimate) return <div className="empty-state"><span>⏳</span></div>;

  const computed = computeEstimate(estimate);
  const totalArea = (computed.totalWallArea ?? 0) + (computed.totalCeilingArea ?? 0);

  const addRoom = () => update({ rooms: [...estimate.rooms, newRoom(estimate.rooms.length)] });

  const updateRoom = (idx: number, room: Room) => {
    const rooms = [...estimate.rooms];
    rooms[idx] = room;
    update({ rooms });
  };

  const removeRoom = (idx: number) => {
    update({ rooms: estimate.rooms.filter((_, i) => i !== idx) });
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Back */}
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        ← {t('estimate.back')}
      </button>

      <h1>{id ? t('estimate.edit') : t('home.newEstimate')}</h1>

      {/* Client info */}
      <div className="card mt-16">
        <div className="form-group">
          <label className="form-label">{t('estimate.clientName')}</label>
          <input
            className="form-input"
            placeholder={t('estimate.clientNamePlaceholder')}
            value={estimate.clientName}
            onChange={(e) => update({ clientName: e.target.value })}
          />
        </div>
        <div className="form-group mt-12">
          <label className="form-label">{t('estimate.address')}</label>
          <input
            className="form-input"
            placeholder={t('estimate.addressPlaceholder')}
            value={estimate.address}
            onChange={(e) => update({ address: e.target.value })}
          />
        </div>
        <div className="form-group mt-12">
          <label className="form-label">{t('estimate.jobType')}</label>
          <select
            className="form-input"
            value={estimate.jobTypeId}
            onChange={(e) => {
              const jt = getJobType(e.target.value)!;
              update({
                jobTypeId: e.target.value,
                materialLines: buildMaterialLines(jt),
                laborPricePerM2: jt.defaultLaborPricePerUnit,
              });
            }}
          >
            {jobTypes.map((jt) => (
              <option key={jt.id} value={jt.id}>
                {jt.icon ? `${jt.icon} ` : ''}{lang === 'uz' ? jt.name.uz : jt.name.ru}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rooms */}
      <div className="section-header mt-20">
        <h2>🚪 {t('estimate.rooms')}</h2>
        <button className="btn btn-outline btn-sm" onClick={addRoom}>
          ＋ {t('estimate.addRoom')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {estimate.rooms.map((room, idx) => (
          <RoomCard
            key={room.id}
            room={room}
            index={idx}
            lang={lang}
            onChange={(r) => updateRoom(idx, r)}
            onRemove={() => removeRoom(idx)}
            canRemove={estimate.rooms.length > 1}
          />
        ))}
      </div>

      {/* Total area summary */}
      {totalArea > 0 && (
        <div className="card mt-12" style={{ background: 'var(--color-primary-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{t('estimate.totalArea')}:</span>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>
              {totalArea.toFixed(2)} m²
            </span>
          </div>
        </div>
      )}

      {/* Materials */}
      <div className="mt-20">
        <MaterialsSection
          lines={estimate.materialLines}
          totalArea={totalArea}
          lang={lang}
          onChange={(lines) => update({ materialLines: lines })}
        />
      </div>

      {/* Labor */}
      <div className="card mt-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <label className="form-label" style={{ flex: 1 }}>
            💪 {t('estimate.laborPerM2')}
          </label>
          <input
            className="form-input"
            type="text"
            inputMode="decimal"
            defaultValue={estimate.laborPricePerM2}
            onBlur={(e) => update({ laborPricePerM2: parseDecimal(e.target.value) })}
            key={`labor-${estimate.id}`}
            style={{ maxWidth: 140 }}
          />
        </div>
      </div>

      {/* Totals */}
      {totalArea > 0 && (
        <div className="totals-box mt-16">
          <div className="totals-row">
            <span>{t('estimate.materials')}</span>
            <span className="fw-bold">{formatUZS(computed.totalMaterialCost ?? 0)}</span>
          </div>
          <div className="totals-row">
            <span>{t('estimate.labor')}</span>
            <span className="fw-bold">{formatUZS(computed.totalLaborCost ?? 0)}</span>
          </div>
          <div className="totals-grand">
            <span className="totals-grand__label">{t('estimate.total')}</span>
            <span className="totals-grand__value">{formatUZS(computed.grandTotal ?? 0)}</span>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="disclaimer mt-12">{t('estimate.disclaimer')}</div>

      {/* Save button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', padding: '12px 16px', boxShadow: '0 -2px 10px var(--color-shadow)', zIndex: 100 }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <button
            className="btn btn-primary btn-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t('estimate.saving') : `💾 ${t('estimate.save')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
