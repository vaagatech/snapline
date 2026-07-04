export const DEMO_EMAIL = 'alice@vaagatech.com';

export const dateTransform = {
  currentdate: (value: unknown) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value))
      ? 'VALID_DATE'
      : 'INVALID_DATE',
  logged_at: (value: unknown) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value))
      ? 'VALID_DATE'
      : 'INVALID_DATE',
  lastLogin: (value: unknown) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value))
      ? 'VALID_DATE'
      : 'INVALID_DATE',
  renewsAt: (value: unknown) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value))
      ? 'VALID_DATE'
      : 'INVALID_DATE',
  shippedAt: (value: unknown) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value))
      ? 'VALID_DATE'
      : 'INVALID_DATE',
};

export const roleTransform = {
  role: (value: unknown) => String(value).toUpperCase(),
};

export const tierTransform = {
  tier: (value: unknown) => String(value).toUpperCase(),
};

export const orderStatusTransform = {
  status: (value: unknown) => String(value).toUpperCase(),
};

export const enrichmentTransforms = {
  ...roleTransform,
  ...tierTransform,
  ...dateTransform,
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

export const roleTierOnlyTransforms = {
  ...roleTransform,
  ...tierTransform,
};

export const dateFieldTransforms = {
  lastLogin: dateTransform.lastLogin,
  renewsAt: dateTransform.renewsAt,
  orders: graphqlAccountTransforms.orders,
};

/** Lookup-table mapping for cross-system status codes. */
export const statusMappingLookup = {
  status: {
    ABC: 'CBA',
    ACTIVE: 'ACTV',
    synced: 'SYNCED',
    SYNCED: 'synced',
    shipped: 'DELIVERED',
    SHIPPED: 'DELIVERED',
  },
  status_code: {
    ACTIVE: 'ACTV',
  },
  plan_code: {
    PRO: 'PREMIUM',
  },
  planCode: {
    PRO: 'PREMIUM',
  },
};

/** Function-based mapping for cross-system status codes. */
export const statusMappingFunction = {
  status: (value: unknown) => {
    if (value === 'ABC') return 'CBA';
    if (value === 'ACTIVE') return 'ACTV';
    return value;
  },
  status_code: (value: unknown) => (value === 'ACTIVE' ? 'ACTV' : value),
};

export const apiStatusMapping = {
  status: { synced: 'SYNCED' },
};

export const dbStatusMapping = {
  status: { SYNCED: 'synced' },
};

export const dbPlanMapping = {
  planCode: { PREMIUM: 'PRO' },
};

export const apiPlanMapping = {
  planCode: { PRO: 'PREMIUM' },
};

export const graphqlStatusMapping = {
  status: { synced: 'ACTIVE' },
};

export const graphqlPlanMapping = {
  planCode: { PRO: 'premium' },
};

export const graphqlSubscriptionMapping = {
  planCode: { PRO: 'premium' },
};

export const warehousePlanMapping = {
  plan_code: { PRO: 'PREMIUM' },
  planCode: { PRO: 'PREMIUM' },
};

export const warehouseOrderStatusMapping = {
  status: { SHIPPED: 'DELIVERED' },
};

export const appCustomerJoinQuery = `
  SELECT
    c.email,
    c.status,
    c.tier,
    c.last_login AS lastLogin,
    p.role,
    p.department,
    s.plan_code AS planCode,
    s.renews_at AS renewsAt
  FROM customers c
  INNER JOIN customer_profiles p ON c.email = p.email
  INNER JOIN customer_subscriptions s ON c.email = s.email
  WHERE c.email = :email
`;

export const warehouseCustomerJoinQuery = `
  SELECT
    c.email,
    c.status_code AS status,
    p.role,
    p.department,
    s.plan_code AS planCode,
    s.renews_at AS renewsAt
  FROM customers c
  INNER JOIN customer_profiles p ON c.email = p.email
  INNER JOIN customer_subscriptions s ON c.email = s.email
  WHERE c.email = :email
`;

export const warehouseOrderJoinQuery = `
  SELECT
    o.order_id AS orderId,
    o.email,
    o.status,
    o.amount AS total,
    o.shipped_at AS shippedAt
  FROM orders o
  WHERE o.email = :email
`;
