import { snapline } from '@vaagatech/snapline-engine';

const liveResponse = {
  id: 'usr_001',
  email: 'alice@example.com',
  status: 'synced',
  currentdate: new Date().toISOString(),
  pincode: '482910',
};

const expected = {
  id: 'usr_001',
  email: 'alice@example.com',
  status: 'synced',
  currentdate: 'VALID_DATE',
};

const result = snapline(liveResponse, expected, {
  ignoreFields: ['pincode'],
  transformations: {
    currentdate: (value) =>
      typeof value === 'string' && !Number.isNaN(Date.parse(value))
        ? 'VALID_DATE'
        : 'INVALID_DATE',
  },
});

console.log(result.match ? 'PASS' : 'FAIL');
if (result.diff) {
  console.log(JSON.stringify(result.diff, null, 2));
}
