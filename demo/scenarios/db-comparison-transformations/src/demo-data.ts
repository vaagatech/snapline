export const DEMO_EMAIL = 'alice@vaagatech.com';

export const dateTransform = {
  logged_at: (value: unknown) =>
    typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? 'VALID_DATE' : 'INVALID_DATE',
};
