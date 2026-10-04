export type VehicleKind = 'car' | 'motorcycle' | 'other';

export type ValidityYears = 1 | 3 | 5;

export interface Vehicle {
  id: string;
  plate: string;
  plateNormalized: string;
  kind: VehicleKind;
  nickname?: string;
  lastRegisteredAt?: string;
  validityYears: ValidityYears;
  photoUri?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const VALIDITY_OPTIONS: { value: ValidityYears; label: string }[] = [
  { value: 1, label: '1 year' },
  { value: 3, label: '3 years' },
  { value: 5, label: '5 years' },
];

export const KIND_OPTIONS: { value: VehicleKind; label: string }[] = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'other', label: 'Other' },
];

export function kindLabel(kind: VehicleKind): string {
  if (kind === 'car') return 'Car';
  if (kind === 'motorcycle') return 'Motorcycle';
  return 'Other vehicle';
}
