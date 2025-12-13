import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import jalaali from "jalaali-js";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const convertToISODate = (jalaliDate: string) => {
  if (!jalaliDate) return null;

  const [jy, jm, jd] = jalaliDate.split("/").map(Number);
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);

  const date = new Date(gy, gm - 1, gd); // month is 0-indexed
  return date.toISOString(); // returns ISO string
};
