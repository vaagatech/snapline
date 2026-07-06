export const DEMO_EMAIL = 'alice@vaagatech.com';

export const SOURCE_DSN = 'postgresql://demo/source';
export const TARGET_DSN = 'mysql://demo/target';

export const crossDialectStatusMapping = {
  status: { ABC: 'CBA' },
};

export const userSyncQuery = `
  SELECT status, email
  FROM users
  WHERE email = :email
`;
