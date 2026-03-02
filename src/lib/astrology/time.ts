import { format, isValid, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const DATE_PATTERN = "yyyy-MM-dd";
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function isValidIsoDate(date: string): boolean {
  const parsed = parse(date, DATE_PATTERN, new Date());

  return isValid(parsed) && format(parsed, DATE_PATTERN) === date;
}

export function isValid24HourTime(time: string): boolean {
  return TIME_PATTERN.test(time);
}

export function localDateTimeToUtcDate(
  dateOfBirth: string,
  timeOfBirth: string,
  timeZone: string,
): Date {
  if (!isValidIsoDate(dateOfBirth)) {
    throw new Error("Invalid birth date. Expected YYYY-MM-DD.");
  }

  if (!isValid24HourTime(timeOfBirth)) {
    throw new Error("Invalid birth time. Expected HH:mm in 24-hour format.");
  }

  if (!isValidIanaTimeZone(timeZone)) {
    throw new Error("Invalid IANA timezone.");
  }

  const localIso = `${dateOfBirth}T${timeOfBirth}:00`;
  const utcDate = fromZonedTime(localIso, timeZone);

  if (!isValid(utcDate)) {
    throw new Error("Unable to convert local birth time to UTC.");
  }

  return utcDate;
}
