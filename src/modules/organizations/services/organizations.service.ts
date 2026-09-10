import { OrganizationUnit, UnitState } from '../types/organization.types';

const MOCK_BRANCHES: OrganizationUnit[] = [
  {
    id: 'CDMX-HQ',
    name: 'Sede Corporativa CDMX',
    state: UnitState.ACTIVE,
    address: 'Paseo de la Reforma 245, Cuauhtemoc, Ciudad de Mexico',
    created: '01-01-2024',
    lastModified: '18-04-2026',
  },
  {
    id: 'MTY-01',
    name: 'Sucursal Monterrey',
    state: UnitState.ACTIVE,
    address: 'Av. Lazaro Cardenas 2400, San Pedro Garza Garcia, Nuevo Leon',
    created: '15-02-2024',
    lastModified: '17-04-2026',
  },
  {
    id: 'GDL-02',
    name: 'Sucursal Guadalajara',
    state: UnitState.DEACTIVATED,
    address: 'Av. Americas 1254, Providencia, Guadalajara, Jalisco',
    created: '10-03-2024',
    lastModified: '05-04-2026',
  },
];

const MOCK_CENTRES: OrganizationUnit[] = [
  {
    id: 'CONTACTO-01',
    name: 'Centro de Atencion a Clientes',
    state: UnitState.ACTIVE,
    address: 'Insurgentes Sur 1602, Benito Juarez, Ciudad de Mexico',
    created: '05-01-2024',
    lastModified: '18-04-2026',
  },
  {
    id: 'OPER-01',
    name: 'Centro Operativo de Tesoreria',
    state: UnitState.ACTIVE,
    address: 'Av. Roble 660, Valle del Campestre, San Pedro Garza Garcia, Nuevo Leon',
    created: '20-05-2024',
    lastModified: '15-04-2026',
  },
];

export const organizationsService = {
  getBranches: async (): Promise<OrganizationUnit[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_BRANCHES;
  },
  getCentres: async (): Promise<OrganizationUnit[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_CENTRES;
  },
};
