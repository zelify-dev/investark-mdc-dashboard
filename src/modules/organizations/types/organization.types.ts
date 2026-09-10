export enum UnitState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEACTIVATED = 'DEACTIVATED',
}

export interface OrganizationUnit {
  id: string;
  name: string;
  state: UnitState;
  address: string;
  created: string;
  lastModified: string;
}

export type UnitType = 'branch' | 'centre';
