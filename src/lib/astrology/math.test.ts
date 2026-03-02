import {
  normalizeLongitude,
  toDms,
  toNakshatra,
  toRashi,
} from "@/lib/astrology/math";

describe("astrology math helpers", () => {
  it("normalizes longitude boundaries", () => {
    expect(normalizeLongitude(-1)).toBe(359);
    expect(normalizeLongitude(0)).toBe(0);
    expect(normalizeLongitude(359.999)).toBeCloseTo(359.999, 6);
    expect(normalizeLongitude(360)).toBe(0);
    expect(normalizeLongitude(721)).toBe(1);
  });

  it("maps rashi boundaries correctly", () => {
    expect(toRashi(0)).toContain("Mesha");
    expect(toRashi(29.999)).toContain("Mesha");
    expect(toRashi(30)).toContain("Vrishabha");
    expect(toRashi(359.999)).toContain("Meena");
  });

  it("maps nakshatra boundaries correctly", () => {
    expect(toNakshatra(0)).toBe("Ashwini");
    expect(toNakshatra(13.2)).toBe("Ashwini");
    expect(toNakshatra(13.4)).toBe("Bharani");
    expect(toNakshatra(359.99)).toBe("Revati");
  });

  it("formats longitude to DMS", () => {
    expect(toDms(123.456789)).toBe("123 deg 27' 24.44\"");
  });

  it("derives ketu as exact opposite of rahu", () => {
    const rahu = 123.456;
    const ketu = normalizeLongitude(rahu + 180);

    expect(ketu).toBeCloseTo(303.456, 6);
  });
});
