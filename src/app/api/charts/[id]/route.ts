import { getRequestId, successResponse } from "@/lib/api/response";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  return successResponse(
    {
      deprecated: true,
      message:
        "Server chart detail is deprecated. Use profile and Kundli routes, and /guest-charts for ad-hoc local history.",
    },
    requestId,
    410,
  );
}

export async function DELETE(request: Request) {
  const requestId = getRequestId(request);

  return successResponse(
    {
      deprecated: true,
      message:
        "Server chart delete is deprecated. Ad-hoc local history is managed in the browser.",
    },
    requestId,
    410,
  );
}
