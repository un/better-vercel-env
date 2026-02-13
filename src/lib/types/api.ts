export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "internal_error";

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface SessionStatus {
  authenticated: boolean;
}

export interface VercelScopeSummary {
  id: string;
  slug: string;
  name: string;
  type: "personal" | "team";
}

export interface VercelProjectSummary {
  id: string;
  name: string;
  framework: string | null;
  updatedAt: number;
}

export type ApplyOperationStatus = "done" | "failed" | "skipped";

export interface ApplyOperationResult {
  operationId: string;
  status: ApplyOperationStatus;
  createdId: string | null;
  message: string | null;
}

export interface ApplyResultData {
  accepted: number;
  results: ApplyOperationResult[];
}
