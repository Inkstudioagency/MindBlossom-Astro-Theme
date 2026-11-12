/**
 * Queries used by the pages. Each helper reproduces the sort, filter and limit of the
 * matching collection list in the original template: entries are shown newest first.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Work = CollectionEntry<'works'>['data'];
export type Program = CollectionEntry<'programs'>['data'];

/** Newest first (creation date, then entry id for entries created at the same moment) */
const newestFirst = <T extends { createdAt: Date; order: number }>(a: T, b: T) =>
  b.createdAt.getTime() - a.createdAt.getTime() || b.order - a.order;

// ---------- works

/** /work list: every work, newest first */
export async function getWorks(): Promise<Work[]> {
  return (await getCollection('works')).map((e) => e.data).sort(newestFirst);
}

/**
 * Home page slider: the three earliest works (the template shows the 4th to 6th newest
 * of its six works, i.e. the first three it published), newest of them first.
 */
export async function getHomeWorks(limit = 3) {
  return (await getWorks()).slice(-limit);
}

/** "Read More" on a work page: the newest works except the current one */
export async function getOtherWorks(slug: string, limit = 3) {
  return (await getWorks()).filter((w) => w.slug !== slug).slice(0, limit);
}

// ---------- programs

/** /programs list: every program, newest first */
export async function getPrograms(): Promise<Program[]> {
  return (await getCollection('programs')).map((e) => e.data).sort(newestFirst);
}

/** Home page slider: the four newest programs */
export async function getHomePrograms(limit = 4) {
  return (await getPrograms()).slice(0, limit);
}

/** "More Events" on a program page: the newest programs except the current one */
export async function getOtherPrograms(slug: string, limit = 3) {
  return (await getPrograms()).filter((p) => p.slug !== slug).slice(0, limit);
}

// ---------- formatting

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Date badge parts: { day: "10", month: "DEC" } */
export function dateBadge(date: Date) {
  return { day: String(date.getUTCDate()), month: MONTHS[date.getUTCMonth()] };
}

/** "10 Dec 2026", the long date of the program pages */
export function formatDate(date: Date) {
  const month = MONTHS[date.getUTCMonth()];
  return `${date.getUTCDate()} ${month[0]}${month.slice(1).toLowerCase()} ${date.getUTCFullYear()}`;
}
