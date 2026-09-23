import yogaPosterUrl from './assets/poster-yoga.jpg';
import campaignPosterUrl from './assets/poster-campaign.jpg';
import hydrationPosterUrl from './assets/poster-hydration.jpg';
import sampleVideoUrl from './assets/sample-stretch.mp4';
import { CONFIG_KEY, POSTER_KEY, SCHEDULE_KEY } from '../types';
import type { DayOfWeek, Poster, Schedule } from '../types';
import { getFile, putFile } from '../lib/fileStore';
import { parseSchedules } from '../lib/records';
import { readJson, writeJson } from '../lib/storage';
import { getDayOfWeek, getTimeString } from '../utils/timeUtils';

// デモ版だけで使う見本データ。
// 初回は CM 素材・予約・設定を入れ、開くたびに「まもなく再生」の予約を今から1分後に合わせ直す
// （見た人が待たずに自動再生を体験できるように）

const SEEDED_KEY = 'gym_demo_seeded';
const SAMPLE_VIDEO_NAME = 'sample-stretch.mp4';
const UPCOMING_SCHEDULE_ID = 'demo-upcoming';
const UPCOMING_DELAY_MS = 60_000;
const DEMO_SLIDE_INTERVAL_SEC = 8;

const SAMPLE_POSTERS = [
  { id: 'demo-poster-yoga', name: '朝ヨガのお知らせ.jpg', url: yogaPosterUrl },
  { id: 'demo-poster-campaign', name: '入会キャンペーン.jpg', url: campaignPosterUrl },
  { id: 'demo-poster-hydration', name: '水分補給のお願い.jpg', url: hydrationPosterUrl },
];

// 一覧を見たときの例。削除すると動画も消えるので、予約ごとに別のキーで動画を持つ
const SAMPLE_SCHEDULES: Array<{ id: string; name: string; day: DayOfWeek; time: string; enabled: boolean }> = [
  { id: 'demo-tue', name: '朝のストレッチ', day: '火', time: '10:00', enabled: true },
  { id: 'demo-thu', name: '夕方のストレッチ', day: '木', time: '18:30', enabled: true },
  { id: 'demo-sat', name: '週末ストレッチ', day: '土', time: '09:30', enabled: true },
  { id: 'demo-sun', name: '休止中の枠（無効の例）', day: '日', time: '15:00', enabled: false },
];

async function fetchBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.blob();
}

function videoKeyOf(scheduleId: string): string {
  return `video_${scheduleId}`;
}

function toSchedule(id: string, name: string, day: DayOfWeek, time: string, enabled: boolean): Schedule {
  return { id, name, day, time, videoKey: videoKeyOf(id), videoName: SAMPLE_VIDEO_NAME, enabled };
}

async function seedInitialData(video: Blob) {
  const posters: Poster[] = [];
  for (const sample of SAMPLE_POSTERS) {
    const imageKey = `image_${sample.id}`;
    await putFile(imageKey, await fetchBlob(sample.url));
    posters.push({ id: sample.id, imageKey, name: sample.name, addedAt: new Date().toISOString() });
  }
  for (const sample of SAMPLE_SCHEDULES) await putFile(videoKeyOf(sample.id), video);

  writeJson(POSTER_KEY, posters);
  writeJson(SCHEDULE_KEY, SAMPLE_SCHEDULES.map(({ id, name, day, time, enabled }) => toSchedule(id, name, day, time, enabled)));
  writeJson(CONFIG_KEY, { slideIntervalSec: DEMO_SLIDE_INTERVAL_SEC, fadeSec: 1 });
  writeJson(SEEDED_KEY, true);
}

async function scheduleUpcomingPlayback(video: Blob, now: Date) {
  const startsAt = new Date(now.getTime() + UPCOMING_DELAY_MS);
  const upcoming = toSchedule(UPCOMING_SCHEDULE_ID, 'デモ：まもなく自動再生', getDayOfWeek(startsAt), getTimeString(startsAt), true);

  if (!(await getFile(upcoming.videoKey))) await putFile(upcoming.videoKey, video);

  const others = parseSchedules(readJson(SCHEDULE_KEY)).filter(schedule => schedule.id !== UPCOMING_SCHEDULE_ID);
  writeJson(SCHEDULE_KEY, [...others, upcoming]);
}

export async function seedDemo(now: Date = new Date()): Promise<void> {
  const video = await fetchBlob(sampleVideoUrl);
  if (readJson(SEEDED_KEY) !== true) await seedInitialData(video);
  await scheduleUpcomingPlayback(video, now);
}
