import { getRequestId, successResponse } from "@/lib/api/response";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  return successResponse(
    {
      deprecated: true,
      message:
        "Server chart history is deprecated. Use profile and Kundli routes, and use /guest-charts for ad-hoc local history.",
    },
    requestId,
    410,
  );
}
