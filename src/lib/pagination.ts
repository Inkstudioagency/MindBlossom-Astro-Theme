/**
 * Pagination of the /programs list (Webflow collection list pagination).
 * Page 1 is /programs, the next pages are /programs/page/2, /programs/page/3...
 */
import type { Page } from 'astro';
import config from '@/config/config.json';
import { getPrograms, type Program } from './content';

const perPage = config.collections.programs_per_page;
const pageUrl = (n: number) => (n === 1 ? '/programs' : `/programs/page/${n}`);

export async function programsPageCount(): Promise<number> {
  return Math.max(1, Math.ceil((await getPrograms()).length / perPage));
}

/** A page of programs, in the same shape as Astro's paginate() pages */
export async function programsPage(current: number): Promise<Page<Program>> {
  const all = await getPrograms();
  const lastPage = Math.max(1, Math.ceil(all.length / perPage));
  const start = (current - 1) * perPage;
  const data = all.slice(start, start + perPage);
  return {
    data,
    start,
    end: start + data.length - 1,
    size: perPage,
    total: all.length,
    currentPage: current,
    lastPage,
    url: {
      current: pageUrl(current),
      prev: current > 1 ? pageUrl(current - 1) : undefined,
      next: current < lastPage ? pageUrl(current + 1) : undefined,
      first: current > 1 ? pageUrl(1) : undefined,
      last: current < lastPage ? pageUrl(lastPage) : undefined,
    },
  };
}
