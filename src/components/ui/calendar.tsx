"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ArrowLeft01Icon, ArrowRight01Icon } from "hugeicons-react";
import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-neutral-900 dark:text-white",
        nav: "space-x-1 flex items-center",
        button_previous: "absolute left-1 h-7 w-7 bg-transparent p-0 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors flex items-center justify-center text-neutral-600 dark:text-neutral-400",
        button_next: "absolute right-1 h-7 w-7 bg-transparent p-0 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors flex items-center justify-center text-neutral-600 dark:text-neutral-400",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-neutral-500 dark:text-neutral-400 rounded-md w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: "h-9 w-9 p-0 font-normal text-center text-sm",
        day_button: "h-9 w-9 p-0 font-normal hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white rounded transition-colors flex items-center justify-center w-full",
        selected: "bg-red-600 text-white hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white rounded-md",
        today: "border border-red-500 text-neutral-900 dark:text-white rounded-md",
        outside: "text-neutral-400 dark:text-neutral-600 opacity-50",
        disabled: "text-neutral-400 dark:text-neutral-600 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left"
            ? <ArrowLeft01Icon size={16} />
            : <ArrowRight01Icon size={16} />,
      }}
      {...props}
    />
  );
}

export { Calendar };
