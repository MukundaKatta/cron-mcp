import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { nextRuns, validate } from '../src/server.js';

test('next runs from a known date', () => {
  // Every Monday at 09:00 UTC.
  const r = nextRuns('0 9 * * 1', 3, new Date('2024-01-01T00:00:00Z'));
  // 2024-01-01 is a Monday — first hit is 09:00 the same day.
  assert.equal(r.next.length, 3);
  assert.equal(r.next[0], '2024-01-01T09:00:00.000Z');
  assert.equal(r.next[1], '2024-01-08T09:00:00.000Z');
  assert.equal(r.next[2], '2024-01-15T09:00:00.000Z');
});

test('every-minute expression', () => {
  const r = nextRuns('* * * * *', 3, new Date('2024-01-01T00:00:00Z'));
  assert.equal(r.next[0], '2024-01-01T00:01:00.000Z');
  assert.equal(r.next[1], '2024-01-01T00:02:00.000Z');
});

test('hour range', () => {
  // 9-17 weekdays.
  const r = nextRuns('0 9-17 * * 1-5', 2, new Date('2024-01-01T08:30:00Z'));
  assert.equal(r.next[0], '2024-01-01T09:00:00.000Z');
  assert.equal(r.next[1], '2024-01-01T10:00:00.000Z');
});

test('validate accepts a good expression', () => {
  assert.deepEqual(validate('0 0 * * *'), { valid: true });
});

test('validate rejects garbage', () => {
  const r = validate('not a cron');
  assert.equal(r.valid, false);
});

test('rejects n out of range', () => {
  assert.throws(() => nextRuns('* * * * *', 0));
  assert.throws(() => nextRuns('* * * * *', 200));
});

test('rejects non-integer n', () => {
  assert.throws(() => nextRuns('* * * * *', 2.5));
  assert.throws(() => nextRuns('* * * * *', Number.NaN));
});

test('defaults to 5 runs', () => {
  const r = nextRuns('* * * * *', undefined, new Date('2024-01-01T00:00:00Z'));
  assert.equal(r.next.length, 5);
  assert.equal(r.from, '2024-01-01T00:00:00.000Z');
});

test('next is interpreted in UTC regardless of host timezone', () => {
  // 0 0 * * * fires at midnight UTC; assert the ISO output is exactly midnight Z.
  const r = nextRuns('0 0 * * *', 1, new Date('2024-06-01T12:00:00Z'));
  assert.equal(r.next[0], '2024-06-02T00:00:00.000Z');
});
