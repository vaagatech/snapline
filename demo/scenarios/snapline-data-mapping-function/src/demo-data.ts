export const DEMO_EMAIL = 'alice@vaagatech.com';

export const statusMappingFunction = {
  status: (value: unknown) => {
    if (value === 'ABC') return 'CBA';
    if (value === 'ACTIVE') return 'ACTV';
    return value;
  },
  status_code: (value: unknown) => (value === 'ACTIVE' ? 'ACTV' : value),
};

export const warehousePlanMapping = {
  plan_code: { PRO: 'PREMIUM' },
  planCode: { PRO: 'PREMIUM' },
};

export const apiStatusMapping = {
  status: { synced: 'SYNCED' },
};
