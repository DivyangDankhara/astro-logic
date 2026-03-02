import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CalculateFormClient } from "@/components/calculate/calculate-form-client";

function mockFetchResponse(response: {
  ok: boolean;
  body: Record<string, unknown>;
}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    json: vi.fn().mockResolvedValue(response.body),
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function selectAnyDate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /date of birth/i }));

  const dayButton = document.querySelector("button[data-day]") as HTMLButtonElement | null;
  if (!dayButton) {
    throw new Error("No calendar day button found");
  }

  await user.click(dayButton);
}

describe("CalculateFormClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows validation feedback", async () => {
    const user = userEvent.setup();

    render(<CalculateFormClient isSignedIn={false} />);

    await user.click(screen.getByRole("button", { name: /generate ad-hoc chart/i }));

    expect(
      await screen.findByText("Full name must be at least 2 characters."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Date of birth must be a valid date in YYYY-MM-DD format."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Time of birth must be in 24-hour HH:mm format."),
    ).toBeInTheDocument();
  });

  it("renders success state after a valid calculation response", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchResponse({
      ok: true,
      body: {
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
      },
    });

    render(<CalculateFormClient isSignedIn={false} />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    fireEvent.change(screen.getByLabelText(/time of birth/i), {
      target: { value: "14:30" },
    });
    fireEvent.change(screen.getByLabelText(/latitude/i), {
      target: { value: "19.076" },
    });
    fireEvent.change(screen.getByLabelText(/longitude/i), {
      target: { value: "72.8777" },
    });

    await selectAnyDate(user);

    await user.click(screen.getByRole("button", { name: /generate ad-hoc chart/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const calculateCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes("/api/calculate"),
    );
    expect(calculateCalls).toHaveLength(1);

    expect(await screen.findByText("Sun")).toBeInTheDocument();
    expect(screen.getByText(/julian day \(ut\)/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /generate ad-hoc chart/i }),
    ).toHaveAttribute("data-slot", "button");
  });

  it("renders API failure state", async () => {
    const user = userEvent.setup();
    mockFetchResponse({
      ok: false,
      body: {
        error: "Failed to calculate chart data.",
      },
    });

    render(<CalculateFormClient isSignedIn={false} />);

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    fireEvent.change(screen.getByLabelText(/time of birth/i), {
      target: { value: "14:30" },
    });
    fireEvent.change(screen.getByLabelText(/latitude/i), {
      target: { value: "19.076" },
    });
    fireEvent.change(screen.getByLabelText(/longitude/i), {
      target: { value: "72.8777" },
    });

    await selectAnyDate(user);

    await user.click(screen.getByRole("button", { name: /generate ad-hoc chart/i }));

    expect(await screen.findByText("Calculation Error")).toBeInTheDocument();
    expect(await screen.findByText("Failed to calculate chart data.")).toBeInTheDocument();
  });
});
