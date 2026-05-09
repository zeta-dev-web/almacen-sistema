import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  showTotal?: boolean;
  totalLabel?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  showTotal = true,
  totalLabel,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
        {showTotal && totalLabel && (
          <>
            <span className="font-medium uppercase tracking-wider">{totalLabel}</span>
            <span className="text-neutral-300 dark:text-neutral-700">|</span>
          </>
        )}
        <div className="flex items-center gap-2">
          <span>Filas:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="w-[70px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          disabled={!canPrev}
          onClick={() => onPageChange(1)}
          title="Primera"
        >
          &laquo;
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          title="Anterior"
        >
          &lsaquo;
        </Button>
        <span className="px-3 text-sm tabular-nums text-neutral-700 dark:text-neutral-300">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon-xs"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          title="Siguiente"
        >
          &rsaquo;
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          disabled={!canNext}
          onClick={() => onPageChange(totalPages)}
          title="Última"
        >
          &raquo;
        </Button>
      </div>
    </div>
  );
}
