import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findDueSchedule, playedKey, TRIGGER_GRACE_MINUTES } from '../src/lib/findDueSchedule.ts';
import { findNextSchedule } from '../src/lib/findNextSchedule.ts';
import { getDayOfWeek, getTimeString, getDateString, toMinutesOfDay } from '../src/utils/timeUtils.ts';

const schedule = (id, day, time, enabled = true) => ({ id, name: id, day, time, videoKey: 'v', videoName: 'v', enabled });
// 2026-09-23 は水曜
const at = (hour, minute, second = 0) => new Date(2026, 8, 23, hour, minute, second);

test('timeUtils は同じ now から曜日・時刻・日付を取る', () => {
  assert.equal(getDayOfWeek(at(10, 0)), '水');
  assert.equal(getTimeString(at(9, 5)), '09:05');
  assert.equal(getDateString(at(0, 0)), '2026-09-23');
  assert.equal(toMinutesOfDay('10:30'), 630);
  assert.ok(Number.isNaN(toMinutesOfDay('bad')));
});

test('findDueSchedule: 予約時刻から猶予内だけ再生する', () => {
  const A = schedule('A', '水', '10:00');
  assert.equal(findDueSchedule([A], [], at(10, 0, 30))?.id, 'A');
  assert.equal(findDueSchedule([A], [], at(10, TRIGGER_GRACE_MINUTES))?.id, 'A');
  assert.equal(findDueSchedule([A], [], at(10, TRIGGER_GRACE_MINUTES + 1)), null);
  assert.equal(findDueSchedule([A], [], at(9, 59, 59)), null);
});

test('findDueSchedule: 再生済み・無効・別曜日・壊れた時刻は再生しない', () => {
  const A = schedule('A', '水', '10:00');
  assert.equal(findDueSchedule([A], [playedKey(A)], at(10, 0)), null);
  assert.equal(findDueSchedule([schedule('off', '水', '10:00', false)], [], at(10, 0)), null);
  assert.equal(findDueSchedule([schedule('thu', '木', '10:00')], [], at(10, 0)), null);
  assert.equal(findDueSchedule([schedule('bad', '水', 'xx')], [], at(10, 0)), null);
});

test('findDueSchedule: 複数が猶予内なら早い予約から順に再生する', () => {
  const A = schedule('A', '水', '10:00');
  const B = schedule('B', '水', '10:03');
  assert.equal(findDueSchedule([B, A], [], at(10, 4))?.id, 'A');
  assert.equal(findDueSchedule([B, A], [playedKey(A)], at(10, 4))?.id, 'B');
});

test('findDueSchedule: 日付が変わると前日の曜日の予約は再生しない', () => {
  assert.equal(findDueSchedule([schedule('late', '水', '23:59')], [], new Date(2026, 8, 24, 0, 1)), null);
});

test('findNextSchedule: 今日のこの後 → 翌日以降 → 来週の同じ曜日の順に探す', () => {
  const later = schedule('later', '水', '15:00');
  const past = schedule('past', '水', '09:00');
  const thu = schedule('thu', '木', '08:00');

  const today = findNextSchedule([past, later, thu], at(10, 0));
  assert.equal(today.schedule.id, 'later');
  assert.deepEqual(today.startsAt, at(15, 0));

  const tomorrow = findNextSchedule([past, thu], at(10, 0));
  assert.equal(tomorrow.schedule.id, 'thu');
  assert.deepEqual(tomorrow.startsAt, new Date(2026, 8, 24, 8, 0));

  const nextWeek = findNextSchedule([past], at(10, 0));
  assert.deepEqual(nextWeek.startsAt, new Date(2026, 8, 30, 9, 0));
});

test('findNextSchedule: ちょうど今の時刻の予約と無効な予約は「次」に含めない', () => {
  assert.equal(findNextSchedule([schedule('now', '水', '10:00')], at(10, 0, 30)).startsAt.getDate(), 30);
  assert.equal(findNextSchedule([schedule('off', '木', '10:00', false)], at(10, 0)), null);
});
