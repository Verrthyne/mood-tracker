import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const START_DATE = "2026-04-01";
const END_DATE = "2026-07-13";
const SEED = 20260713;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const workspaceDirectory = path.resolve(projectDirectory, "..");
const fixtureDirectory = path.join(projectDirectory, "fixtures");
const privateBackupDirectory = path.join(workspaceDirectory, "private-backups");

const fixturePath = path.join(
  fixtureDirectory,
  "synthetic-backup-2026-04-01-to-2026-07-13.json",
);
const privateBackupPath = path.join(
  privateBackupDirectory,
  "mood-tracker-synthetic-2026-04-01-to-2026-07-13.json",
);

const DEFAULT_TAG_PRESETS = [
  "通院",
  "仕事",
  "休み",
  "人と会った",
  "雨",
  "睡眠不足",
  "外出",
  "家にいた",
];

const SYNTHETIC_SITUATIONS = [
  "架空データ：予定の前後に状態を記録した。",
  "架空データ：自宅で過ごしている途中に記録した。",
  "架空データ：作業を一区切りした後に記録した。",
  "架空データ：外出から戻った後に記録した。",
];

const SYNTHETIC_THOUGHTS = [
  "架空データ：うまく進められるか少し気になった。",
  "架空データ：休んでもよいか迷った。",
  "架空データ：今日できたことが少ないように感じた。",
  "架空データ：予定どおりでなくても問題ないと考えた。",
];

const SYNTHETIC_ADAPTIVE_THOUGHTS = [
  "架空データ：一度に全部決めず、小さい単位で進める。",
  "架空データ：状態に合わせて予定を調整してよい。",
  "架空データ：できたことも同じように確認する。",
  "架空データ：休憩を取ってから改めて判断する。",
];

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(SEED);

function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function choose(values) {
  return values[randomInt(0, values.length - 1)];
}

function formatDate(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function enumerateDates(startDate, endDate) {
  const dates = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (current <= end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function buildClockTime(timeBucket) {
  const hours = {
    morning: randomInt(7, 10),
    afternoon: randomInt(12, 16),
    night: randomInt(19, 23),
  };
  return `${String(hours[timeBucket]).padStart(2, "0")}:${String(
    randomInt(0, 59),
  ).padStart(2, "0")}`;
}

function buildTags(date, timeBucket) {
  const tags = [];
  const day = date.getUTCDay();
  const weekend = day === 0 || day === 6;

  tags.push(weekend ? "休み" : "仕事");
  if (random() < 0.24) tags.push("雨");
  if (random() < 0.18) tags.push("睡眠不足");
  if (random() < 0.13) tags.push("人と会った");
  if (random() < 0.06) tags.push("通院");

  const wentOut =
    tags.includes("人と会った") ||
    tags.includes("通院") ||
    random() < (timeBucket === "afternoon" ? 0.52 : 0.34);
  tags.push(wentOut ? "外出" : "家にいた");

  return { tags: [...new Set(tags)], wentOut };
}

function buildScores(dayIndex, tags, wentOut) {
  const wave = Math.sin(dayIndex / 8.5) * 10;
  const rain = tags.includes("雨") ? 1 : 0;
  const sleepShortage = tags.includes("睡眠不足") ? 1 : 0;
  const restDay = tags.includes("休み") ? 1 : 0;

  return {
    fatigue: clampScore(
      45 + wave + rain * 5 + sleepShortage * 15 - wentOut * 4 + randomInt(-12, 12),
    ),
    interest: clampScore(
      53 - wave * 0.35 - sleepShortage * 8 + wentOut * 12 + restDay * 4 + randomInt(-14, 14),
    ),
    heaviness: clampScore(
      43 + wave * 0.75 + rain * 8 + sleepShortage * 9 - wentOut * 6 + randomInt(-12, 12),
    ),
  };
}

function buildCbt() {
  if (random() >= 0.24) {
    return {
      situation: "",
      automaticThought: "",
      adaptiveThought: "",
    };
  }
  return {
    situation: choose(SYNTHETIC_SITUATIONS),
    automaticThought: choose(SYNTHETIC_THOUGHTS),
    adaptiveThought: choose(SYNTHETIC_ADAPTIVE_THOUGHTS),
  };
}

const records = [];
const dates = enumerateDates(START_DATE, END_DATE);

dates.forEach((date, dayIndex) => {
  const recordCount = 1 + (random() < 0.38 ? 1 : 0) + (random() < 0.08 ? 1 : 0);
  const buckets = ["morning", "afternoon", "night"];
  for (let recordIndex = 0; recordIndex < recordCount; recordIndex += 1) {
    const timeBucket = buckets[(dayIndex + recordIndex) % buckets.length];
    const { tags, wentOut } = buildTags(date, timeBucket);
    const dateString = formatDate(date);
    records.push({
      id: `synthetic-${dateString.replaceAll("-", "")}-${recordIndex + 1}`,
      date: dateString,
      clockTime: buildClockTime(timeBucket),
      scores: buildScores(dayIndex, tags, wentOut),
      wentOut,
      timeBucket,
      tags,
      cbt: buildCbt(),
      memo: `架空データ（開発用）：${timeBucket}の状態記録。実在の出来事ではありません。`,
    });
  }
});

records.sort((a, b) =>
  `${a.date} ${a.clockTime} ${a.id}`.localeCompare(
    `${b.date} ${b.clockTime} ${b.id}`,
  ),
);

const payload = {
  exportedAt: "2026-07-13T12:00:00.000Z",
  records,
  customMetrics: [],
  visibleMetricIds: ["fatigue", "interest", "heaviness"],
  tagPresets: DEFAULT_TAG_PRESETS,
};

const serialized = `${JSON.stringify(payload, null, 2)}\n`;
fs.mkdirSync(fixtureDirectory, { recursive: true });
fs.mkdirSync(privateBackupDirectory, { recursive: true });
fs.writeFileSync(fixturePath, serialized, "utf8");
fs.writeFileSync(privateBackupPath, serialized, "utf8");

const recordsWithMultipleTags = records.filter(
  (record) => record.tags.length > 1,
).length;
const recordsWithCbt = records.filter(
  (record) => record.cbt.situation.length > 0,
).length;

console.log(
  JSON.stringify(
    {
      startDate: START_DATE,
      endDate: END_DATE,
      recordCount: records.length,
      recordsWithMultipleTags,
      recordsWithCbt,
      fixturePath,
      privateBackupPath,
    },
    null,
    2,
  ),
);
