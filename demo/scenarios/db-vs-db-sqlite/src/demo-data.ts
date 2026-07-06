export const DEMO_EMAIL = 'alice@vaagatech.com';

export const statusMappingLookup = {
  status: {
    ABC: 'CBA',
    ACTIVE: 'ACTV',
    synced: 'SYNCED',
    SYNCED: 'synced',
    shipped: 'DELIVERED',
    SHIPPED: 'DELIVERED',
  },
  status_code: { ACTIVE: 'ACTV' },
  plan_code: { PRO: 'PREMIUM' },
  planCode: { PRO: 'PREMIUM' },
};

export const warehouseOrderStatusMapping = {
  status: { SHIPPED: 'DELIVERED' },
};

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

export const warehouseOrderByIdQuery = `
  SELECT
    order_id AS orderId,
    email,
    status,
    amount AS total,
    shipped_at AS shippedAt
  FROM orders
  WHERE order_id = :orderId
`;
