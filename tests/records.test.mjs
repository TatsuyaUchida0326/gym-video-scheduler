import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSchedules, parsePosters, parsePlaybackLog } from '../src/lib/records.ts';
import { clampConfigValue, parseConfig } from '../src/lib/config.ts';
import { createLogEntry, prependLogEntry, countRecentFailures, PLAYBACK_LOG_LIMIT } from '../src/lib/playbackLog.ts';

test('parseSchedules: 旧形式（days・enabled なし）を新形式へ移す', () => {
  const legacy = [
    { id: 'a', name: 'A', days: '火', time: '10:00', videoKey: 'v1', videoName: 'a.mp4' },
    { id: 'b', name: 'B', days: '水', time: '11:00', videoKey: 'v2', videoName: 'b.mp4', enabled: false },
  ];
  assert.deepEqual(parseSchedules(legacy), [
    { id: 'a', name: 'A', day: '火', time: '10:00', videoKey: 'v1', videoName: 'a.mp4', enabled: true },
    { id: 'b', name: 'B', day: '水', time: '11:00', videoKey: 'v2', videoName: 'b.mp4', enabled: false },
  ]);
});

test('parseSchedules: 新形式はそのまま、壊れた要素と配列以外は捨てる', () => {
  const current = { id: 'c', name: 'C', day: '金', time: '09:00', videoKey: 'v', videoName: 'c.mp4', enabled: true };
  assert.deepEqual(parseSchedules([current, null, 'x', { id: 'd', day: '祝', time: '1', videoKey: 'v' }]), [current]);
  assert.deepEqual(parseSchedules(null), []);
  assert.deepEqual(parseSchedules({ id: 'c' }), []);
});

test('parsePosters / parsePlaybackLog: 壊れた要素を捨てる', () => {
  assert.deepEqual(parsePosters([{ id: 'p', imageKey: 'i', name: 'n', addedAt: 't' }, { id: 1 }]).length, 1);
  const entry = { id: 'l', finishedAt: '2026-09-23T01:00:00.000Z', scheduleName: 'A', day: '水', time: '10:00', status: 'failed', reason: 'x' };
  assert.deepEqual(parsePlaybackLog([entry, { ...entry, status: 'unknown' }]), [entry]);
});

test('clampConfigValue / parseConfig: 空欄・範囲外・壊れた値を直す', () => {
  assert.equal(clampConfigValue('slideIntervalSec', ''), 30);
  assert.equal(clampConfigValue('slideIntervalSec', 'abc'), 30);
  assert.equal(clampConfigValue('slideIntervalSec', '0'), 5);
  assert.equal(clampConfigValue('slideIntervalSec', 999), 300);
  assert.equal(clampConfigValue('slideIntervalSec', '45'), 45);
  assert.deepEqual(parseConfig(undefined), { slideIntervalSec: 30, fadeSec: 1 });
  assert.deepEqual(parseConfig({ slideIntervalSec: 0, fadeSec: 99 }), { slideIntervalSec: 5, fadeSec: 10 });
});

test('playbackLog: 新しい順に積み、上限で古いものを捨て、直近の失敗を数える', () => {
  const schedule = { id: 's', name: 'S', day: '水', time: '10:00', videoKey: 'v', videoName: 'v', enabled: true };
  const now = new Date(2026, 8, 23, 12, 0);
  const failed = createLogEntry(schedule, { status: 'failed', reason: '壊れている' }, now, 'f');
  const completed = createLogEntry(schedule, { status: 'completed' }, now, 'c');
  assert.equal(failed.reason, '壊れている');
  assert.equal('reason' in completed, false);

  let entries = [];
  for (let i = 0; i < PLAYBACK_LOG_LIMIT + 5; i++) entries = prependLogEntry(entries, { ...completed, id: String(i) });
  assert.equal(entries.length, PLAYBACK_LOG_LIMIT);
  assert.equal(entries[0].id, String(PLAYBACK_LOG_LIMIT + 4));

  const old = createLogEntry(schedule, { status: 'failed', reason: 'x' }, new Date(2026, 8, 1), 'old');
  assert.equal(countRecentFailures([failed, completed, old], now, 7), 1);
});
