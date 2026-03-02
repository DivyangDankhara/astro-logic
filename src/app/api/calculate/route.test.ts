// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/astrology/calculate-engine", () => ({
  calculateChartData: vi.fn(),
}));

import { POST } from "@/app/api/calculate/route";
import { calculateChartData } from "@/lib/astrology/calculate-engine";

const mockedCalculateChartData = vi.mocked(calculateChartData);

describe("POST /api/calculate", () => {
  beforeEach(() => {
    mockedCalculateChartData.mockReset();
  });

  it("returns chart response for a valid payload", async () => {
    mockedCalculateChartData.mockReturnValue({
      metadata: {
        fullName: "Test User",
        dateOfBirth: "1990-05-15",
        timeOfBirth: "14:30",
        timezone: "Asia/Kolkata",
        latitude: 19.076,
        longitude: 72.8777,
        utcDateTime: "1990-05-15T09:00:00.000Z",
        jdUt: 2448026.875,
        siderealMode: "Lahiri",
        ayanamsa: 23.7,
      },
      bodies: [
        {
          key: "sun",
          name: "Sun",
          longitude: 30,
          longitudeDms: "30 deg 0' 0.00\"",
          retrograde: false,
          rashi: "Vrishabha (Taurus)",
          nakshatra: "Krittika",
        },
      ],
    });

    const request = new Request("http://localhost/api/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "Test User",
        dateOfBirth: "1990-05-15",
        timeOfBirth: "14:30",
        timezone: "Asia/Kolkata",
        latitude: 19.076,
        longitude: 72.8777,
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.metadata.siderealMode).toBe("Lahiri");
    expect(payload.bodies).toHaveLength(1);
  });

  it("returns 400 for validation failures", async () => {
    const request = new Request("http://localhost/api/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "",
        dateOfBirth: "invalid",
        timeOfBirth: "99:99",
        timezone: "Unknown/Zone",
        latitude: 190,
        longitude: 300,
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid request payload.");
  });

  it("returns 500 when calculation fails internally", async () => {
    mockedCalculateChartData.mockImplementation(() => {
      throw new Error("simulated failure");
    });

    const request = new Request("http://localhost/api/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "Test User",
        dateOfBirth: "1990-05-15",
        timeOfBirth: "14:30",
        timezone: "Asia/Kolkata",
        latitude: 19.076,
        longitude: 72.8777,
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Failed to calculate chart data.");
  });
});
