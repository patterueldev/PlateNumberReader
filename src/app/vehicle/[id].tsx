import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { buildRenewalIcs } from '@/calendar/ics';
import { parsePlate } from '@/domain/plate';
import { formatDate, formatWindow, scheduleSummary } from '@/domain/schedule';
import { kindLabel, VALIDITY_OPTIONS, type ValidityYears, type Vehicle } from '@/domain/types';
import { computeStatus, parseIsoDate, stateLabel, stateTone } from '@/domain/validity';
import { downloadTextFile } from '@/files/files';
import { deleteVehicle, getVehicle, upsertVehicle } from '@/storage/vehicles';
import {
  AppButton,
  Badge,
  Card,
  DateField,
  InfoRow,
  LinkRow,
  PlateText,
  Screen,
  SectionTitle,
  Segmented,
  TextField,
} from '@/ui/components';
import { confirmAction, notify } from '@/ui/dialog';
import { Spacing, useTheme } from '@/ui/theme';

export default function VehicleDetailScreen() {
  const c = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [notes, setNotes] = useState('');
  const [editingRegistration, setEditingRegistration] = useState(false);
  const [lastRegisteredAt, setLastRegisteredAt] = useState('');
  const [validityYears, setValidityYears] = useState<ValidityYears>(1);

  const load = useCallback(async () => {
    if (!id) return;
    const found = await getVehicle(id);
    setVehicle(found);
    setNotes(found?.notes ?? '');
    setLastRegisteredAt(found?.lastRegisteredAt ?? '');
    setValidityYears(found?.validityYears ?? 1);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const parsed = useMemo(() => (vehicle ? parsePlate(vehicle.plate) : null), [vehicle]);
  const status = useMemo(
    () => (parsed ? computeStatus(parsed, vehicle?.lastRegisteredAt, vehicle?.validityYears ?? 1) : null),
    [parsed, vehicle?.lastRegisteredAt, vehicle?.validityYears]
  );
  const summary = parsed?.valid ? scheduleSummary(parsed.lastDigit, parsed.secondToLastDigit) : null;

  if (!vehicle || !parsed || !status) {
    return (
      <Screen>
        <Card>
          <Text style={{ color: c.text }}>Loading vehicle…</Text>
        </Card>
      </Screen>
    );
  }

  const dateError =
    lastRegisteredAt && !parseIsoDate(lastRegisteredAt) ? 'Use the format YYYY-MM-DD' : undefined;

  const saveRegistration = async () => {
    if (dateError) return;
    await upsertVehicle({
      ...vehicle,
      lastRegisteredAt: lastRegisteredAt || undefined,
      validityYears,
      updatedAt: new Date().toISOString(),
    });
    setEditingRegistration(false);
    await load();
  };

  const saveNotes = async () => {
    await upsertVehicle({ ...vehicle, notes: notes.trim() || undefined, updatedAt: new Date().toISOString() });
    notify('Saved', 'Notes updated.');
  };

  const addToCalendar = () => {
    if (!status.window || !status.earlyDate) return;
    const ics = buildRenewalIcs(vehicle, status.window, status.earlyDate);
    downloadTextFile(`${vehicle.plateNormalized || 'vehicle'}-lto-renewal.ics`, ics, 'text/calendar');
  };

  const removeVehicle = () => {
    confirmAction('Delete vehicle', `Remove ${vehicle.plate} and its details from this device?`, () => {
      void (async () => {
        await deleteVehicle(vehicle.id);
        router.replace('/');
      })();
    });
  };

  return (
    <Screen>
      <Card style={{ gap: Spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm }}>
          <View style={{ flexShrink: 1 }}>
            <PlateText value={vehicle.plate} size={26} />
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>
              {kindLabel(vehicle.kind)}
              {vehicle.nickname ? ` · ${vehicle.nickname}` : ''}
            </Text>
          </View>
          <Badge label={stateLabel(status.state)} tone={stateTone(status.state)} />
        </View>
        {vehicle.photoUri ? (
          <Image
            source={{ uri: vehicle.photoUri }}
            style={{ width: '100%', height: 140, borderRadius: 12, backgroundColor: c.surfaceAlt }}
            resizeMode="cover"
          />
        ) : null}
      </Card>

      <SectionTitle>Renewal schedule</SectionTitle>
      <Card>
        {summary ? (
          <>
            <InfoRow label="Assigned month" value={summary.month} />
            <InfoRow label="Assigned week" value={summary.week ?? 'Any week of the month'} />
          </>
        ) : null}
        {status.window ? (
          <>
            <InfoRow label="This cycle's window" value={formatWindow(status.window)} />
            <InfoRow label="Renew early from" value={formatDate(status.earlyDate as Date)} />
          </>
        ) : null}
        <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 18 }}>
          LTO computes the week in working days (1st-7th, 8th-14th, 15th-21st, 22nd-end); the dates above
          show calendar days for planning.
        </Text>
      </Card>

      <SectionTitle>Registration</SectionTitle>
      <Card>
        {!editingRegistration ? (
          <>
            <InfoRow label="Last registered" value={vehicle.lastRegisteredAt ? formatDate(parseIsoDate(vehicle.lastRegisteredAt) as Date) : 'Not set'} />
            <InfoRow label="Validity" value={`${vehicle.validityYears} year${vehicle.validityYears > 1 ? 's' : ''}`} />
            <InfoRow
              label="Expires"
              value={status.expiry ? formatDate(status.expiry) : 'Not set'}
            />
            <AppButton
              title={vehicle.lastRegisteredAt ? 'Edit registration details' : 'Add last registration date'}
              variant="secondary"
              onPress={() => setEditingRegistration(true)}
              style={{ marginTop: Spacing.xs }}
            />
          </>
        ) : (
          <>
            <DateField
              label="Last registration date"
              value={lastRegisteredAt}
              onChange={setLastRegisteredAt}
              error={dateError}
              hint="Printed on your latest OR/CR"
            />
            <View style={{ gap: Spacing.xs }}>
              <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600' }}>Validity</Text>
              <Segmented options={VALIDITY_OPTIONS} value={validityYears} onChange={setValidityYears} />
            </View>
            <AppButton title="Save" onPress={() => void saveRegistration()} />
            <AppButton title="Cancel" variant="ghost" onPress={() => setEditingRegistration(false)} />
          </>
        )}
      </Card>

      <SectionTitle>Reminders</SectionTitle>
      <Card>
        <AppButton title="Add renewal to calendar (.ics)" onPress={addToCalendar} disabled={!status.window} />
        <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 18 }}>
          Creates two calendar events: the early renewal date and your assigned renewal window. Scheduled push
          reminders arrive with the future native app.
        </Text>
      </Card>

      <SectionTitle>Notes</SectionTitle>
      <Card>
        <TextField
          value={notes}
          onChangeText={setNotes}
          placeholder="OR/CR numbers, MV file number, insurance details"
          multiline
          autoCapitalize="sentences"
        />
        <AppButton title="Save notes" variant="secondary" onPress={() => void saveNotes()} />
      </Card>

      <SectionTitle>Official links</SectionTitle>
      <Card>
        <LinkRow
          title="LTMS portal"
          subtitle="portal.lto.gov.ph — renew online and view your records"
          onPress={() => void WebBrowser.openBrowserAsync('https://portal.lto.gov.ph')}
        />
        <LinkRow
          title="Land Transportation Office"
          subtitle="lto.gov.ph — announcements and advisories"
          onPress={() => void WebBrowser.openBrowserAsync('https://lto.gov.ph')}
        />
      </Card>

      <AppButton title="Delete vehicle" variant="danger" onPress={removeVehicle} />

      <Text style={{ color: c.textSecondary, fontSize: 12, lineHeight: 17 }}>
        PlateNumberReader is not affiliated with the LTO. Renewal windows are computed from your plate digits
        (last digit = month, second-to-last = week). Verify dates and requirements with the LTO or LTMS.
      </Text>
    </Screen>
  );
}
