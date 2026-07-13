import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const START_DATE = "2026-04-01";
const END_DATE = "2026-07-14";
const SEED = 20260714;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const workspaceDirectory = path.resolve(projectDirectory, "..");
const fixtureDirectory = path.join(projectDirectory, "fixtures");
const privateBackupDirectory = path.join(workspaceDirectory, "private-backups");

const fixturePath = path.join(
  fixtureDirectory,
  "synthetic-backup-2026-04-01-to-2026-07-14.json",
);
const privateBackupPath = path.join(
  privateBackupDirectory,
  "mood-tracker-synthetic-2026-04-01-to-2026-07-14.json",
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
  "外食",
  "研修",
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

function buildDailyContext(date) {
  const day = date.getUTCDay();
  const weekend = day === 0 || day === 6;
  return {
    restDay: weekend || random() < 0.12,
    rainy: random() < 0.27,
    sleepShortage: random() < 0.17,
  };
}

function chooseOutingType(date, restDay) {
  const day = date.getUTCDay();
  const weekday = day >= 1 && day <= 5;
  const value = random();
  if (restDay && value < 0.62) return "外食";
  if (weekday && value < 0.46) return "研修";
  if (value < 0.78) return "外食";
  return "通院";
}

function buildTags(date, timeBucket, dailyContext) {
  const tags = [];
  tags.push(dailyContext.restDay ? "休み" : "仕事");
  if (dailyContext.rainy) tags.push("雨");
  if (dailyContext.sleepShortage) tags.push("睡眠不足");

  const baseOutingChance = dailyContext.restDay ? 0.31 : 0.45;
  const timeAdjustment = timeBucket === "afternoon" ? 0.14 : timeBucket === "night" ? -0.08 : 0;
  const rainAdjustment = dailyContext.rainy ? -0.12 : 0;
  const wentOut = random() < baseOutingChance + timeAdjustment + rainAdjustment;

  if (wentOut) {
    const outingType = chooseOutingType(date, dailyContext.restDay);
    tags.push("外出", outingType);
    if (outingType === "外食" || outingType === "研修") tags.push("人と会った");
  } else {
    tags.push("家にいた");
  }

  return { tags: [...new Set(tags)], wentOut };
}

function buildScores(dayIndex, tags, wentOut) {
  const wave = Math.sin(dayIndex / 8.5) * 10;
  const rain = tags.includes("雨") ? 1 : 0;
  const sleepShortage = tags.includes("睡眠不足") ? 1 : 0;
  const restDay = tags.includes("休み") ? 1 : 0;
  const fatigue = clampScore(
    44 + wave + rain * 18 + sleepShortage * 14 - restDay * 19 + wentOut * 4 + randomInt(-9, 9),
  );
  const heaviness = clampScore(
    42 + wave * 0.75 + rain * 20 + sleepShortage * 11 - restDay * 18 - wentOut * 3 + randomInt(-9, 9),
  );
  const badCondition = fatigue >= 62 && heaviness >= 62;
  const highInterestDespiteBadCondition = badCondition && random() < 0.24;
  const interest = highInterestDespiteBadCondition
    ? randomInt(72, 92)
    : clampScore(
        52 - wave * 0.25 - rain * 8 - sleepShortage * 7 + restDay * 9 + wentOut * 13 + randomInt(-11, 11),
      );

  return { fatigue, interest, heaviness };
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
  const dailyContext = buildDailyContext(date);
  const recordCount = 1 + (random() < 0.38 ? 1 : 0) + (random() < 0.08 ? 1 : 0);
  const buckets = ["morning", "afternoon", "night"];
  for (let recordIndex = 0; recordIndex < recordCount; recordIndex += 1) {
    const timeBucket = buckets[(dayIndex + recordIndex) % buckets.length];
    const { tags, wentOut } = buildTags(date, timeBucket, dailyContext);
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
  exportedAt: "2026-07-14T12:00:00.000Z",
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

function average(recordsToAverage, metricId) {
  return Math.round(
    recordsToAverage.reduce(
      (sum, record) => sum + record.scores[metricId],
      0,
    ) / recordsToAverage.length,
  );
}

const rainRecords = records.filter((record) => record.tags.includes("雨"));
const dryRecords = records.filter((record) => !record.tags.includes("雨"));
const restRecords = records.filter((record) => record.tags.includes("休み"));
const nonRestRecords = records.filter((record) => !record.tags.includes("休み"));
const outingRecords = records.filter((record) => record.wentOut);
const primaryOutingRecords = outingRecords.filter((record) =>
  ["外食", "研修", "通院"].some((tag) => record.tags.includes(tag)),
);
const highInterestBadConditionRecords = records.filter(
  (record) =>
    record.scores.fatigue >= 62 &&
    record.scores.heaviness >= 62 &&
    record.scores.interest >= 70,
);

const trendSummary = {
  rain: {
    count: rainRecords.length,
    fatigue: average(rainRecords, "fatigue"),
    heaviness: average(rainRecords, "heaviness"),
  },
  noRain: {
    count: dryRecords.length,
    fatigue: average(dryRecords, "fatigue"),
    heaviness: average(dryRecords, "heaviness"),
  },
  rest: {
    count: restRecords.length,
    fatigue: average(restRecords, "fatigue"),
    heaviness: average(restRecords, "heaviness"),
  },
  nonRest: {
    count: nonRestRecords.length,
    fatigue: average(nonRestRecords, "fatigue"),
    heaviness: average(nonRestRecords, "heaviness"),
  },
  outings: outingRecords.length,
  primaryOutingRatio: Number(
    (primaryOutingRecords.length / outingRecords.length).toFixed(3),
  ),
  highInterestBadConditionRecords: highInterestBadConditionRecords.length,
};

if (
  trendSummary.rain.fatigue < trendSummary.noRain.fatigue + 10 ||
  trendSummary.rain.heaviness < trendSummary.noRain.heaviness + 10
) {
  throw new Error("雨の日の心身負担が十分に高くありません。");
}
if (
  trendSummary.rest.fatigue > trendSummary.nonRest.fatigue - 10 ||
  trendSummary.rest.heaviness > trendSummary.nonRest.heaviness - 10
) {
  throw new Error("休みの日の心身負担が十分に低くありません。");
}
if (trendSummary.primaryOutingRatio < 0.95) {
  throw new Error("外出理由の主要タグ率が不足しています。");
}
if (trendSummary.highInterestBadConditionRecords < 3) {
  throw new Error("体調不良でも関心が高い記録が不足しています。");
}

console.log(
  JSON.stringify(
    {
      startDate: START_DATE,
      endDate: END_DATE,
      recordCount: records.length,
      recordsWithMultipleTags,
      recordsWithCbt,
      trendSummary,
      fixturePath,
      privateBackupPath,
    },
    null,
    2,
  ),
);
