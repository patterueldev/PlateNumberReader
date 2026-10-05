import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { formatPlate, parsePlate } from '@/domain/plate';
import { formatDate, formatWindow, scheduleSummary } from '@/domain/schedule';
import { KIND_OPTIONS, VALIDITY_OPTIONS, type ValidityYears, type VehicleKind } from '@/domain/types';
import { computeStatus, parseIsoDate } from '@/domain/validity';
import { PlateScanner } from '@/features/PlateScanner';
import { createThumbnail } from '@/media/thumbnail';
import { recognizePlate } from '@/ocr/ocr';
import type { OcrProgress } from '@/ocr/types';
import { createId, upsertVehicle } from '@/storage/vehicles';
import {
  AppButton,
  Badge,
  Card,
  DateField,
  PlateText,
  Screen,
  SectionTitle,
  Segmented,
  TextField,
} from '@/ui/components';
import { Spacing, useTheme } from '@/ui/theme';

export default function AddVehicleScreen() {
  const c = useTheme();
  const router = useRouter();

  const [step, setStep] = useState<'identify' | 'details'>('identify');
  const [kind, setKind] = useState<VehicleKind>('car');
  const [kindTouched, setKindTouched] = useState(false);
  const [plateText, setPlateText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [scanning, setScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [ocrNote, setOcrNote] = useState<string | null>(null);

  const [nickname, setNickname] = useState('');
  const [lastRegisteredAt, setLastRegisteredAt] = useState('');
  const [validityYears, setValidityYears] = useState<ValidityYears>(1);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => parsePlate(plateText), [plateText]);

  useEffect(() => {
    if (!kindTouched && parsed.valid && parsed.kind !== 'other') {
      setKind(parsed.kind);
    }
  }, [kindTouched, parsed.kind, parsed.valid]);
  const summary = parsed.valid ? scheduleSummary(parsed.lastDigit, parsed.secondToLastDigit) : null;
  const dateError =
    lastRegisteredAt && !parseIsoDate(lastRegisteredAt) ? 'Use the format YYYY-MM-DD' : undefined;
  const previewStatus =
    parsed.valid && !dateError
      ? computeStatus(parsed, lastRegisteredAt || undefined, validityYears)
      : null;

  const handleCapture = async (uri: string) => {
    setScanning(false);
    setOcrNote(null);
    setOcrProgress({ status: 'Preparing photo', progress: 0 });
    try {
      const result = await recognizePlate(uri, setOcrProgress);
      if (result.cleaned) {
        setPlateText(result.cleaned);
        setOcrNote(
          `Read from photo with ${Math.round(result.confidence)}% confidence. Check every character.`
        );
      } else {
        setOcrNote('Could not read the plate clearly. Type it in below.');
      }
      const thumbnail = await createThumbnail(uri);
      if (thumbnail) setPhotoUri(thumbnail);
    } catch (error) {
      setOcrNote(error instanceof Error ? error.message : 'Scanning failed. Type the plate below.');
    } finally {
      setOcrProgress(null);
    }
  };

  const save = async () => {
    if (!parsed.valid || saving) return;
    setSaving(true);
    const id = createId();
    const now = new Date().toISOString();
    await upsertVehicle({
      id,
      plate: formatPlate(plateText),
      plateNormalized: parsed.normalized,
      kind,
      nickname: nickname.trim() || undefined,
      lastRegisteredAt: lastRegisteredAt || undefined,
      validityYears,
      photoUri,
      createdAt: now,
      updatedAt: now,
    });
    setSaving(false);
    router.replace({ pathname: '/vehicle/[id]', params: { id } });
  };

  if (scanning) {
    return <PlateScanner onCapture={(uri) => void handleCapture(uri)} onCancel={() => setScanning(false)} />;
  }

  if (step === 'details') {
    return (
      <Screen>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <PlateText value={formatPlate(plateText)} size={24} />
            <Badge label={kind === 'motorcycle' ? 'Motorcycle' : kind === 'car' ? 'Car' : 'Other'} tone="info" />
          </View>
          {summary ? (
            <Text style={{ color: c.textSecondary, lineHeight: 20 }}>
              Assigned renewal: {summary.month}
              {summary.week ? `, ${summary.week}` : ' (add the last digit for a specific week)'}.
            </Text>
          ) : null}
        </Card>

        <SectionTitle>Vehicle details</SectionTitle>
        <View style={{ gap: Spacing.sm }}>
          <TextField label="Nickname (optional)" value={nickname} onChangeText={setNickname} placeholder="My daily driver" autoCapitalize="sentences" />
          <DateField
            label="Last registration date (optional)"
            value={lastRegisteredAt}
            onChange={setLastRegisteredAt}
            error={dateError}
            hint="Printed on your latest OR/CR. Used to compute expiry."
          />
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600' }}>Validity on that registration</Text>
            <Segmented options={VALIDITY_OPTIONS} value={validityYears} onChange={setValidityYears} />
            <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 18 }}>
              Brand-new vehicles registered from Feb 15, 2026 get 5 years. Older new registrations used 3
              years; renewals are annual.
            </Text>
          </View>
        </View>

        {previewStatus?.window ? (
          <Card style={{ backgroundColor: c.surfaceAlt }}>
            <InfoLine label="Next renewal window" value={formatWindow(previewStatus.window)} />
            <InfoLine label="You can renew early on" value={formatDate(previewStatus.earlyDate as Date)} />
            {previewStatus.expiry ? (
              <InfoLine label="Registration valid until" value={formatDate(previewStatus.expiry)} />
            ) : (
              <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 18 }}>
                Without the last registration date, only the assigned renewal window can be shown.
              </Text>
            )}
          </Card>
        ) : null}

        <View style={{ gap: Spacing.sm }}>
          <AppButton title="Save vehicle" onPress={() => void save()} loading={saving} />
          <AppButton title="Back" variant="ghost" onPress={() => setStep('identify')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionTitle>Vehicle type</SectionTitle>
      <Segmented
        options={KIND_OPTIONS}
        value={kind}
        onChange={(value) => {
          setKindTouched(true);
          setKind(value);
        }}
      />

      <SectionTitle>Plate number</SectionTitle>
      <View style={{ gap: Spacing.sm }}>
        <AppButton title="Scan plate with camera" onPress={() => setScanning(true)} />
        {ocrProgress ? (
          <Card style={{ backgroundColor: c.surfaceAlt, gap: Spacing.xs }}>
            <Text style={{ color: c.text, fontWeight: '600', textTransform: 'capitalize' }}>
              {ocrProgress.status}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>
              {Math.round(ocrProgress.progress * 100)}%
            </Text>
          </Card>
        ) : null}
        <TextField
          label="Plate number"
          value={plateText}
          onChangeText={setPlateText}
          placeholder="ABC 1234"
          autoCapitalize="characters"
          error={plateText && !parsed.valid ? parsed.issue : undefined}
          hint={
            parsed.valid && summary
              ? `Renewal: ${summary.month}${summary.week ? `, ${summary.week}` : ''}`
              : 'The last digit sets the month; the digit before sets the week.'
          }
        />
        {ocrNote ? <Text style={{ color: c.textSecondary, fontSize: 13 }}>{ocrNote}</Text> : null}
        {photoUri ? <Text style={{ color: c.textSecondary, fontSize: 13 }}>Plate photo attached</Text> : null}
      </View>

      <AppButton title="Continue" disabled={!parsed.valid} onPress={() => setStep('details')} />
    </Screen>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md }}>
      <Text style={{ color: c.textSecondary, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}
