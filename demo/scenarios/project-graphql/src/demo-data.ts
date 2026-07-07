import type { DataMappingMap, TransformationMap } from '@vaagatech/snapline-core';

export const accountTransforms: TransformationMap = {
  syncedAt: (value) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? 'VALID_DATE' : 'INVALID_DATE',
};

export const accountMapping: DataMappingMap = {
  status: { ACTIVE: 'ACTV' },
  segment: { ENTERPRISE: 'ENT' },
};

export const ordersMapping: DataMappingMap = {};

export const syncMapping: DataMappingMap = {
  status: { ACTIVE: 'ACTV' },
};
