const roleTransform = {
  role: (value: unknown) => String(value).toUpperCase(),
};

const tierTransform = {
  tier: (value: unknown) => String(value).toUpperCase(),
};

const dateTransform = {
  lastLogin: (value: unknown) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? 'VALID_DATE' : 'INVALID_DATE',
  renewsAt: (value: unknown) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? 'VALID_DATE' : 'INVALID_DATE',
};

export const enrichmentTransforms = {
  ...roleTransform,
  ...tierTransform,
  ...dateTransform,
};

export const roleTierOnlyTransforms = { ...roleTransform, ...tierTransform };

export const dateFieldTransforms = {
  lastLogin: dateTransform.lastLogin,
  renewsAt: dateTransform.renewsAt,
};
