import { useLocalStorage } from "./useLocalStorage";

export type PageSize = "default" | "large";

export function usePageSize() {
  const [pageSize, setPageSize] = useLocalStorage<PageSize>("bella-page-size", "default");
  return { pageSize, setPageSize };
}
