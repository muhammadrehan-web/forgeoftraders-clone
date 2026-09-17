import { pages, type PageId } from "@/lib/pages";

export function getPageFile(id: PageId): string {
  return pages[id].file;
}

export function listPageIds(): PageId[] {
  return Object.keys(pages) as PageId[];
}
