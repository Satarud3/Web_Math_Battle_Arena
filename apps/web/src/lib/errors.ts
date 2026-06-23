import axios from "axios";

interface ApiErrorBody {
  message?: string | string[];
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message[0] || fallback;
    return message || fallback;
  }

  return fallback;
}

export function getApiStatus(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}
