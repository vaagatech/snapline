export const DEMO_EMAIL = 'alice@vaagatech.com';

export const DEMO_ORDER_ID = 'ord_1001';

/** Canonical demo values shared by GraphQL resolvers and SQLite seeds. */
export const demoDomain = {
  email: DEMO_EMAIL,
  apiStatus: 'synced',
  appDbStatus: 'SYNCED',
  warehouseSourceStatus: 'ACTIVE',
  warehouseTargetStatus: 'ACTV',
  tier: 'gold',
  role: 'member',
  department: 'engineering',
  apiPlanCode: 'PRO',
  warehouseSourcePlan: 'PRO',
  warehouseTargetPlan: 'PREMIUM',
  renewsAt: '2026-07-04T10:00:00.000Z',
  lastLogin: '2026-07-04T09:30:00.000Z',
  auditLoggedAt: '2026-07-04T10:00:00.000Z',
  orderStatus: 'shipped',
  warehouseSourceOrderStatus: 'SHIPPED',
  warehouseTargetOrderStatus: 'DELIVERED',
  orderTotal: 149.99,
  orderShippedAt: '2026-07-04T08:15:00.000Z',
};

export function volatileTraceId(): string {
  return `trace_${Math.floor(Math.random() * 1_000_000)}`;
}

export function volatileSyncedAt(): string {
  return new Date().toISOString();
}

export function volatilePincode(): string {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}
