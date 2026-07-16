export type LanguageRepo = {
  fork: boolean;
  language: string | null;
};

const ASCII_RAMP = "@%#*+=-:. ";
const DAY_MS = 24 * 60 * 60 * 1000;

function utcDateOnly(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addUtcMonthsClamped(value: Date, months: number) {
  const monthIndex = value.getUTCMonth() + months;
  const year = value.getUTCFullYear() + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(value.getUTCDate(), lastDay)));
}

export function calculateAccountAge(createdAt: string | Date, now: Date = new Date()) {
  const createdValue = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(createdValue.getTime()) || Number.isNaN(now.getTime())) return { years: 0, months: 0, days: 0 };

  const created = utcDateOnly(createdValue);
  const current = utcDateOnly(now);
  if (created > current) return { years: 0, months: 0, days: 0 };

  let totalMonths = (current.getUTCFullYear() - created.getUTCFullYear()) * 12
    + current.getUTCMonth() - created.getUTCMonth();
  if (addUtcMonthsClamped(created, totalMonths) > current) totalMonths -= 1;

  const anchor = addUtcMonthsClamped(created, totalMonths);
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days: Math.floor((current.getTime() - anchor.getTime()) / DAY_MS)
  };
}

export function summarizeLanguages(repos: LanguageRepo[], limit = 6) {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (!repo.fork && repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, repoCount]) => ({ name, repos: repoCount }));
}

export function pixelsToAscii(data: ArrayLike<number>, width: number, height: number, ramp = ASCII_RAMP) {
  if (width <= 0 || height <= 0 || ramp.length < 2) return "";
  const rows: string[] = [];
  for (let y = 0; y < height; y += 1) {
    let row = "";
    for (let x = 0; x < width; x += 1) {
      const value = data[y * width + x] ?? 255;
      const normalized = Math.max(0, Math.min(255, value)) / 255;
      const contrasted = Math.max(0, Math.min(1, 0.5 + (normalized - 0.5) * 1.06));
      row += ramp[Math.min(ramp.length - 1, Math.floor(contrasted * ramp.length))];
    }
    rows.push(row.trimEnd());
  }
  return rows.join("\n");
}
