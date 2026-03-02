import { getRequestId, successResponse } from "@/lib/api/response";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  return successResponse(
    {
      deprecated: true,
      message:
        "Interpretations endpoint is temporarily disabled in profile-centric migration. It will be reintroduced on Kundli entities.",
    },
    requestId,
    410,
  );
}
