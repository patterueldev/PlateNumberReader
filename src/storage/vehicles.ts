import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Vehicle, ValidityYears, VehicleKind } from '@/domain/types';

const STORAGE_KEY = 'vn.vehicles.v1';

export function createId(): string {
  const cryptoRef = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID();
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isVehicle(value: unknown): value is Vehicle {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Vehicle>;
  return typeof candidate.id === 'string' && typeof candidate.plate === 'string';
}

export async function listVehicles(): Promise<Vehicle[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isVehicle).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const vehicles = await listVehicles();
  return vehicles.find((vehicle) => vehicle.id === id) ?? null;
}

async function saveAll(vehicles: Vehicle[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
}

export async function upsertVehicle(vehicle: Vehicle): Promise<Vehicle> {
  const vehicles = await listVehicles();
  const index = vehicles.findIndex((item) => item.id === vehicle.id);
  if (index >= 0) {
    vehicles[index] = vehicle;
  } else {
    vehicles.push(vehicle);
  }
  await saveAll(vehicles);
  return vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const vehicles = await listVehicles();
  await saveAll(vehicles.filter((vehicle) => vehicle.id !== id));
}

export async function clearVehicles(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function exportVehiclesJson(): Promise<string> {
  const vehicles = await listVehicles();
  return JSON.stringify(
    {
      app: 'PlateNumberReader',
      version: 1,
      exportedAt: new Date().toISOString(),
      vehicles,
    },
    null,
    2
  );
}

function coerceVehicle(value: unknown): Vehicle | null {
  if (!isVehicle(value)) return null;
  const candidate = value as Partial<Vehicle>;
  const now = new Date().toISOString();
  const validity = candidate.validityYears;
  const kind = candidate.kind;
  return {
    id: typeof candidate.id === 'string' && candidate.id ? candidate.id : createId(),
    plate: String(candidate.plate),
    plateNormalized: typeof candidate.plateNormalized === 'string' ? candidate.plateNormalized : String(candidate.plate).toUpperCase().replace(/[^A-Z0-9]/g, ''),
    kind: kind === 'car' || kind === 'motorcycle' || kind === 'other' ? (kind as VehicleKind) : 'other',
    nickname: typeof candidate.nickname === 'string' ? candidate.nickname : undefined,
    lastRegisteredAt:
      typeof candidate.lastRegisteredAt === 'string' ? candidate.lastRegisteredAt : undefined,
    validityYears: validity === 1 || validity === 3 || validity === 5 ? (validity as ValidityYears) : 1,
    photoUri: typeof candidate.photoUri === 'string' ? candidate.photoUri : undefined,
    notes: typeof candidate.notes === 'string' ? candidate.notes : undefined,
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : now,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : now,
  };
}

export async function importVehiclesJson(json: string, mode: 'merge' | 'replace' = 'merge'): Promise<number> {
  const parsed = JSON.parse(json);
  const source = Array.isArray(parsed) ? parsed : parsed?.vehicles;
  if (!Array.isArray(source)) {
    throw new Error('This file does not look like a PlateNumberReader backup.');
  }
  const incoming = source.map(coerceVehicle).filter((vehicle): vehicle is Vehicle => vehicle !== null);
  if (mode === 'replace') {
    await saveAll(incoming);
    return incoming.length;
  }
  const existing = await listVehicles();
  const byId = new Map(existing.map((vehicle) => [vehicle.id, vehicle]));
  for (const vehicle of incoming) {
    byId.set(vehicle.id, vehicle);
  }
  await saveAll(Array.from(byId.values()));
  return incoming.length;
}
