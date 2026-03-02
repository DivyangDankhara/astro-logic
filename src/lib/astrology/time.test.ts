import {
  isValid24HourTime,
  isValidIanaTimeZone,
  isValidIsoDate,
  localDateTimeToUtcDate,
} from "@/lib/astrology/time";

describe("astrology time helpers", () => {
  it("validates timezone strings", () => {
    expect(isValidIanaTimeZone("Asia/Kolkata")).toBe(true);
    expect(isValidIanaTimeZone("America/New_York")).toBe(true);
    expect(isValidIanaTimeZone("Mars/Phobos")).toBe(false);
  });

  it("validates iso date and 24-hour time strings", () => {
    expect(isValidIsoDate("1995-08-17")).toBe(true);
    expect(isValidIsoDate("1995-13-17")).toBe(false);
    expect(isValid24HourTime("23:59")).toBe(true);
    expect(isValid24HourTime("24:00")).toBe(false);
  });

  it("converts local datetime to UTC for DST-sensitive zones", () => {
    const summer = localDateTimeToUtcDate(
      "2024-07-01",
      "12:00",
      "America/New_York",
    );
    const winter = localDateTimeToUtcDate(
      "2024-01-01",
      "12:00",
      "America/New_York",
    );

    expect(summer.toISOString()).toBe("2024-07-01T16:00:00.000Z");
    expect(winter.toISOString()).toBe("2024-01-01T17:00:00.000Z");
  });

  it("throws on invalid timezone input", () => {
    expect(() =>
      localDateTimeToUtcDate("2024-07-01", "12:00", "Invalid/Timezone"),
    ).toThrow("Invalid IANA timezone.");
  });
});
