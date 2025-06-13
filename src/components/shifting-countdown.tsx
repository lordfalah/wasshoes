"use client";

import { TUnits, useTimer } from "@/hooks/use-timer";
import { cn } from "@/lib/utils";
import { addHours } from "date-fns";
import { CountdownProvider } from "./context/count-down-context";

// NOTE: Change this date to whatever date you want to countdown to :)
// xample usage const COUNTDOWN_FROM = "2024-10-01";

// ShiftingCountdown akan menerima `createdAt` dari database sebagai `fullDate`
const ShiftingCountdown: React.FC<{
  createdAt: Date;
  className?: string;
  title: string;
}> = ({ createdAt, className, title }) => {
  // Kita akan menghitung endDate di sini dan meneruskannya ke provider
  const endDate = addHours(createdAt, 24); // Tanggal berakhir = createdAt + 24 jam

  return (
    <div className={cn("mx-0 h-fit space-y-1.5 space-x-0 px-0", className)}>
      <h2 className="text-center text-sm sm:text-base">{title}</h2>
      <div className="mx-auto flex w-full max-w-5xl items-center gap-x-2.5">
        {/* Meneruskan `endDate` ke CountdownProvider */}
        <CountdownProvider countdownFromDate={endDate}>
          <CountdownItem unit="Day" text="days" />
          <CountdownItem unit="Hour" text="hours" />
          <CountdownItem unit="Minute" text="minutes" />
          <CountdownItem unit="Second" text="seconds" />
        </CountdownProvider>
      </div>
    </div>
  );
};

const CountdownItem = ({ unit, text }: { unit: TUnits; text: string }) => {
  const { ref, time } = useTimer(unit);

  return (
    <div className="flex h-fit w-full flex-col items-center justify-center gap-1 font-mono md:h-16">
      <div className="relative w-full overflow-hidden text-center">
        <span
          ref={ref}
          className="text-muted-foreground block text-xl font-medium sm:text-2xl md:text-4xl"
        >
          {time}
        </span>
      </div>
      <span className="text-xs font-light text-slate-500 md:text-sm lg:text-base">
        {text}
      </span>
    </div>
  );
};

export default ShiftingCountdown;
