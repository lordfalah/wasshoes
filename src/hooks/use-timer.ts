import { useCountdown } from "@/components/context/count-down-context";
import { useAnimate } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;

export type TUnits = "Day" | "Hour" | "Minute" | "Second";

export const useTimer = (unit: TUnits) => {
  // countdownFromDate di sini adalah endDate (createdAt + 24 jam)
  const { countdownFromDate } = useCountdown();
  const [ref, animate] = useAnimate();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(0);
  const [time, setTime] = useState(0);

  // Gunakan ref untuk melacak apakah komponen masih di-mount
  const mountedRef = useRef(true); // <--- BARU

  useEffect(() => {
    // Set mountedRef ke true saat mount
    mountedRef.current = true;

    // Cleanup function: set mountedRef ke false saat unmount
    return () => {
      mountedRef.current = false; // <--- BARU
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleCountdown = useCallback(async () => {
    // Pengecekan pertama: Pastikan komponen masih di-mount DAN ref.current ada
    if (!mountedRef.current || !ref.current) {
      // <--- MODIFIKASI
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return; // Langsung keluar jika tidak di-mount atau ref tidak valid
    }

    const end = countdownFromDate;
    const now = new Date();
    let distance = +end - +now;

    // Logika untuk menghentikan countdown jika sudah selesai atau kadaluarsa
    if (distance <= 0) {
      distance = 0;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    let newTime = 0;

    if (unit === "Day") {
      newTime = Math.floor(distance / DAY);
    } else if (unit === "Hour") {
      newTime = Math.floor((distance % DAY) / HOUR);
    } else if (unit === "Minute") {
      newTime = Math.floor((distance % HOUR) / MINUTE);
    } else {
      // Unit is Second
      newTime = Math.floor((distance % MINUTE) / SECOND);
    }

    newTime = Math.max(0, newTime); // Pastikan tidak negatif

    if (newTime !== timeRef.current) {
      try {
        await animate(
          ref.current,
          { y: ["0%", "-50%"], opacity: [1, 0] },
          { duration: 0.35 },
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(
        //   `[Framer Motion Error] Exit animation for ${unit} unit:`,
        //   error,
        // );
        // Jangan menghentikan interval di sini, hanya catat error.
        // Hentikan interval hanya jika di-unmount atau countdown selesai.
        // if (intervalRef.current) {
        //   clearInterval(intervalRef.current);
        //   intervalRef.current = null;
        // }
      }

      flushSync(() => {
        timeRef.current = newTime;
        setTime(newTime);
      });

      try {
        await animate(
          ref.current,
          { y: ["50%", "0%"], opacity: [0, 1] },
          { duration: 0.35 },
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // console.error(
        //   `[Framer Motion Error] Enter animation for ${unit} unit:`,
        //   error,
        // );
        // Di sini kita mungkin perlu menghentikan interval jika error ini konsisten,
        // karena menunjukkan animasi tidak dapat berjalan sama sekali.
        // if (intervalRef.current) {
        //   clearInterval(intervalRef.current);
        //   intervalRef.current = null;
        // }
      }
    }
  }, [countdownFromDate, unit, animate, ref]);

  // Fungsi ini dipanggil hanya saat komponen di-mount atau countdownFromDate berubah
  useEffect(() => {
    // Pastikan untuk menghentikan interval sebelumnya jika ada
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Panggil handleCountdown segera untuk inisialisasi tampilan
    // handleCountdown();

    // Set interval untuk update setiap detik
    intervalRef.current = setInterval(handleCountdown, SECOND); // Gunakan konstanta SECOND

    // Cleanup function untuk menghentikan interval saat komponen unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gunakan useCallback untuk handleCountdown

  return { ref, time };
};
