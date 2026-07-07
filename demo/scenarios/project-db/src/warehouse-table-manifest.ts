import type { WarehouseTableSpec } from '@vaagatech/snapline-core';

// noinspection SqlNoDataSourceInspection

/**
 * Warehouse table manifest (demo: 8 tables).
 * Production warehouses typically define 26–30 tables — add entries here using the same shape.
 *
 * Replace sourceQuery with Postgres SQL and targetCollection with MongoDB collection names.
 */
export const warehouseTables: WarehouseTableSpec[] = [
  {
    id: 'wh_customers',
    sourceQuery: 'SELECT customer_id AS customerId, email, status, segment FROM wh_customers',
    targetCollection: 'customers',
    linkKeys: { customerId: 'customerId' },
    dataMapping: { status: { ACTIVE: 'ACTV' }, segment: { ENTERPRISE: 'ENT' } },
  },
  {
    id: 'wh_addresses',
    sourceQuery:
      'SELECT address_id AS addressId, customer_id AS customerId, city, country FROM wh_addresses',
    targetCollection: 'addresses',
    linkKeys: { addressId: 'addressId' },
    dataMapping: { country: { US: 'USA' } },
  },
  {
    id: 'wh_contacts',
    sourceQuery:
      'SELECT contact_id AS contactId, customer_id AS customerId, channel, value FROM wh_contacts',
    targetCollection: 'contacts',
    linkKeys: { contactId: 'contactId' },
  },
  {
    id: 'wh_products',
    sourceQuery: 'SELECT product_id AS productId, sku, category, list_price AS listPrice FROM wh_products',
    targetCollection: 'products',
    linkKeys: { productId: 'productId' },
    dataMapping: { category: { ELEC: 'electronics' } },
  },
  {
    id: 'wh_orders',
    sourceQuery:
      'SELECT order_id AS orderId, customer_id AS customerId, status, total_amount AS totalAmount FROM wh_orders',
    targetCollection: 'orders',
    linkKeys: { orderId: 'orderId' },
    dataMapping: { status: { SHIPPED: 'DELIVERED' } },
  },
  {
    id: 'wh_order_lines',
    sourceQuery:
      'SELECT line_id AS lineId, order_id AS orderId, sku, quantity, line_amount AS lineAmount FROM wh_order_lines',
    targetCollection: 'order_lines',
    linkKeys: { lineId: 'lineId' },
  },
  {
    id: 'wh_payments',
    sourceQuery:
      'SELECT payment_id AS paymentId, order_id AS orderId, method, amount, status FROM wh_payments',
    targetCollection: 'payments',
    linkKeys: { paymentId: 'paymentId' },
    dataMapping: { status: { CAPTURED: 'SETTLED' } },
  },
  {
    id: 'wh_inventory',
    sourceQuery:
      'SELECT inventory_id AS inventoryId, product_id AS productId, warehouse_code AS warehouseCode, qty FROM wh_inventory',
    targetCollection: 'inventory',
    linkKeys: { inventoryId: 'inventoryId' },
    dataMapping: { warehouseCode: { WH1: 'warehouse-east' } },
  },
];
