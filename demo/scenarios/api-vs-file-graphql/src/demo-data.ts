export const roleTransform = {
  role: (value: unknown) => String(value).toUpperCase(),
};

export const tierTransform = {
  tier: (value: unknown) => String(value).toUpperCase(),
};

export const dateTransform = {
  lastLogin: (value: unknown) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? 'VALID_DATE' : 'INVALID_DATE',
  renewsAt: (value: unknown) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? 'VALID_DATE' : 'INVALID_DATE',
  shippedAt: (value: unknown) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? 'VALID_DATE' : 'INVALID_DATE',
};

export const graphqlAccountTransforms = {
  ...roleTransform,
  ...tierTransform,
  lastLogin: dateTransform.lastLogin,
  renewsAt: dateTransform.renewsAt,
  orders: (value: unknown) => {
    if (!Array.isArray(value)) {
      return value;
    }
    return value.map((order) => {
      if (!order || typeof order !== 'object') {
        return order;
      }
      const row = order as Record<string, unknown>;
      return {
        ...row,
        status: String(row.status).toUpperCase(),
        shippedAt: dateTransform.shippedAt(row.shippedAt),
      };
    });
  },
};

export const graphqlSnapshotTransforms = {
  ...roleTransform,
  ...tierTransform,
  lastLogin: dateTransform.lastLogin,
  renewsAt: dateTransform.renewsAt,
};

export const roleTierOnlyTransforms = { ...roleTransform, ...tierTransform };

export const dateFieldTransforms = {
  lastLogin: dateTransform.lastLogin,
  renewsAt: dateTransform.renewsAt,
  orders: graphqlAccountTransforms.orders,
};

export const graphqlStatusMapping = {
  status: { synced: 'ACTIVE' },
};

export const graphqlPlanMapping = {
  planCode: { PRO: 'premium' },
};
