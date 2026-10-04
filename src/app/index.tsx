import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';

import { parsePlate } from '@/domain/plate';
import { formatDate, formatWindow } from '@/domain/schedule';
import type { Vehicle } from '@/domain/types';
import {
  computeStatus,
  stateLabel,
  stateTone,
  type RegistrationState,
  type RegistrationStatus,
} from '@/domain/validity';
import { listVehicles } from '@/storage/vehicles';
import { AppButton, Badge, Card, EmptyState, PlateText, Screen, SectionTitle } from '@/ui/components';
import { Spacing, useTheme } from '@/ui/theme';

interface VehicleEntry {
  vehicle: Vehicle;
  status: RegistrationStatus;
}

const STATE_ORDER: Record<RegistrationState, number> = {
  overdue: 0,
  due: 1,
  'due-soon': 2,
  upcoming: 3,
  unknown: 4,
};

function statusMessage(status: RegistrationStatus): string {
  if (!status.window) return 'Add a valid plate number to see the renewal window.';
  const windowText = formatWindow(status.window);
  if (status.state === 'overdue') return `${windowText} passed — renew now to avoid penalties.`;
  if (status.state === 'due') return `Window open now until ${formatDate(status.window.end)}.`;
  if (status.state === 'due-soon') {
    const days = status.daysUntilWindowStart ?? 0;
    return days > 0 ? `Window opens ${windowText} (in ${days} days).` : `Window opens ${windowText}.`;
  }
  if (status.state === 'upcoming') return `Next window ${windowText}.`;
  return `Next window ${windowText}. Add the last registration date for expiry tracking.`;
}

export default function GarageScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<VehicleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const vehicles = await listVehicles();
      const next = vehicles.map((vehicle) => ({
        vehicle,
        status: computeStatus(parsePlate(vehicle.plate), vehicle.lastRegisteredAt, vehicle.validityYears),
      }));
      next.sort(
        (a, b) =>
          STATE_ORDER[a.status.state] - STATE_ORDER[b.status.state] ||
          (a.status.daysUntilWindowStart ?? 9999) - (b.status.daysUntilWindowStart ?? 9999)
      );
      setEntries(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={loading} onRefresh={() => void load()} />,
    [loading, load]
  );

  return (
    <Screen refreshControl={refreshControl}>
      {entries.length === 0 && !loading ? (
        <EmptyState
          title="No vehicles yet"
          message="Scan a plate number or type it in to see the LTO renewal window, expiry, and reminders."
          action={<AppButton title="Add a vehicle" onPress={() => router.push('/add')} />}
        />
      ) : (
        <>
          <SectionTitle>My vehicles</SectionTitle>
          {entries.map(({ vehicle, status }) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              message={statusMessage(status)}
              badgeLabel={stateLabel(status.state)}
              badgeTone={stateTone(status.state)}
              onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: vehicle.id } })}
            />
          ))}
          <AppButton title="Add vehicle" onPress={() => router.push('/add')} />
        </>
      )}
    </Screen>
  );
}

function VehicleCard({
  vehicle,
  message,
  badgeLabel,
  badgeTone,
  onPress,
}: {
  vehicle: Vehicle;
  message: string;
  badgeLabel: string;
  badgeTone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm }}>
          <View style={{ flexShrink: 1 }}>
            <PlateText value={vehicle.plate} size={22} />
            {vehicle.nickname ? (
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>{vehicle.nickname}</Text>
            ) : null}
          </View>
          <Badge label={badgeLabel} tone={badgeTone} />
        </View>
        <Text style={{ color: c.text, fontSize: 14, lineHeight: 20 }}>{message}</Text>
      </Card>
    </Pressable>
  );
}
