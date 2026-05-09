import { ReactNode, Fragment, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search01Icon, Cancel01Icon } from "hugeicons-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

interface DataTableProps<T> {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  loading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  actions?: ReactNode;
  totalLabel?: string;
  onRowClick?: (item: T) => void;
  expandedContent?: (item: T) => ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

export function DataTable<T>({
  title,
  subtitle,
  columns,
  data,
  keyExtractor,
  emptyMessage = "No hay datos disponibles",
  loading = false,
  searchPlaceholder = "Buscar...",
  onSearch,
  actions,
  totalLabel,
  onRowClick,
  expandedContent,
  pagination,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState("");

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;
  const canPrev = pagination ? pagination.page > 1 : false;
  const canNext = pagination ? pagination.page < totalPages : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="lg:ml-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white uppercase tracking-wide">
            {title}
          </h1>
          {subtitle && (
            <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">{actions}</div>
        )}
      </div>

      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg bg-white dark:bg-neutral-950">
        {onSearch && (
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
            <div className="relative flex-1 w-full">
              <Search01Icon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                value={searchValue}
                placeholder={searchPlaceholder}
                onChange={(e) => { setSearchValue(e.target.value); onSearch(e.target.value); }}
                onKeyDown={(e) => { if (e.key === "Escape") { setSearchValue(""); onSearch(""); } }}
                className="pl-10 pr-10 bg-neutral-50 dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm"
              />
              {searchValue && (
                <button
                  onClick={() => { setSearchValue(""); onSearch(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Cancel01Icon size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="p-3 md:p-5 overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left text-sm md:text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`pb-2 md:pb-3 pr-3 md:pr-4 font-semibold ${column.className || ""} ${
                      column.hideOnMobile ? "hidden md:table-cell" : ""
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-6 md:py-8 text-center text-neutral-500 dark:text-neutral-400 font-medium text-sm md:text-sm"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 md:w-5 md:h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-6 md:py-8 text-center text-neutral-500 dark:text-neutral-400 font-medium text-sm md:text-sm"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  const key = keyExtractor(item);
                  return (
                    <Fragment key={key}>
                      <tr
                        onClick={() => onRowClick?.(item)}
                        className={`border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors ${
                          onRowClick ? "cursor-pointer" : ""
                        }`}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={`py-3 md:py-4 pr-3 md:pr-4 text-sm md:text-sm font-medium text-neutral-900 dark:text-white ${
                              column.className || ""
                            } ${
                              column.hideOnMobile ? "hidden md:table-cell" : ""
                            }`}
                          >
                            {column.render
                              ? column.render(item)
                              : String((item as Record<string, unknown>)[column.key])}
                          </td>
                        ))}
                      </tr>
                      {expandedContent?.(item)}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-3 md:px-5 pb-3 md:pb-5">
          <div className="pt-3 md:pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 md:gap-3 text-sm md:text-sm text-neutral-500 dark:text-neutral-400">
                {totalLabel && (
                  <span className="font-medium uppercase tracking-wider">{totalLabel}</span>
                )}
                {pagination && (
                  <>
                    <span className="text-neutral-300 dark:text-neutral-700">|</span>
                    <div className="flex items-center gap-2">
                      <span>Filas:</span>
                      <Select
                        value={String(pagination.pageSize)}
                        onValueChange={(v) => pagination.onPageSizeChange(Number(v))}
                      >
                        <SelectTrigger className="w-[70px] md:w-[70px] h-9 md:h-8 text-sm md:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_SIZE_OPTIONS.map((s) => (
                            <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              {pagination && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    disabled={!canPrev}
                    onClick={() => pagination.onPageChange(1)}
                    title="Primera"
                    className="h-9 w-9 md:h-8 md:w-8 text-sm"
                  >
                    &laquo;
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    disabled={!canPrev}
                    onClick={() => pagination.onPageChange(pagination.page - 1)}
                    title="Anterior"
                    className="h-9 w-9 md:h-8 md:w-8 text-sm"
                  >
                    &lsaquo;
                  </Button>
                  <span className="px-3 md:px-3 text-sm md:text-sm tabular-nums text-neutral-700 dark:text-neutral-300">
                    {pagination.page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    disabled={!canNext}
                    onClick={() => pagination.onPageChange(pagination.page + 1)}
                    title="Siguiente"
                    className="h-9 w-9 md:h-8 md:w-8 text-sm"
                  >
                    &rsaquo;
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    disabled={!canNext}
                    onClick={() => pagination.onPageChange(totalPages)}
                    title="Última"
                    className="h-9 w-9 md:h-8 md:w-8 text-sm"
                  >
                    &raquo;
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}