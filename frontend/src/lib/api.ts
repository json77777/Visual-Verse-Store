type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  redirectOn401?: boolean;
};

type ApiUploadProgress = {
  loaded: number;
  total?: number;
  percent?: number;
};

type ApiUploadOptions = {
  method?: "POST" | "PUT" | "PATCH";
  redirectOn401?: boolean;
  onProgress?: (progress: ApiUploadProgress) => void;
};

export class ApiFetchError extends Error {
  status: number;
  bodyText: string;

  constructor(status: number, message: string, bodyText: string) {
    super(message);
    this.name = "ApiFetchError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL. Set it in frontend/.env.local",
    );
  }
  
  const formattedUrl = baseUrl.replace(/\/$/, "");
  
  // Node.js v18+ fetches often timeout on "localhost" due to IPv6 preference bugs.
  // We force 127.0.0.1 on the server to fix timeouts, but keep localhost on the 
  // browser client so that cross-origin cookies (auth) are saved correctly.
  if (typeof window === "undefined") {
    return formattedUrl.replace("localhost", "127.0.0.1");
  }
  
  return formattedUrl;
}

async function refreshAccessToken(baseUrl: string): Promise<boolean> {
  const refreshUrl = `${baseUrl}/api/v1/users/refresh-token`;

  try {
    const res = await fetch(refreshUrl, {
      method: "POST",
      credentials: "include",
    });

    return res.ok;
  } catch {
    return false;
  }
}

async function readResponseTextSafe(response: Response): Promise<string> {
  return await response.text().catch(() => "");
}

function pickBestErrorMessage(status: number, statusText: string, bodyText: string): string {
  const fallback = statusText || "Request failed";

  const trimmed = bodyText.trim();
  if (!trimmed) {
    if (status === 401) return "Session expired. Please login.";
    return `API ${status}: ${fallback}`;
  }

  // Backend ApiError responses include { success, message, errors, stack }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        "message" in parsed &&
        typeof (parsed as { message?: unknown }).message === "string" &&
        (parsed as { message: string }).message.trim()
      ) {
        const message = (parsed as { message: string }).message.trim();
        return message; // Let the backend decide the error message!
      }
    } catch {
      // ignore JSON parse failures
    }
  }

  if (status === 401) return "Session expired. Please login.";
  return trimmed;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(options.headers);

  const hasBody = options.body !== undefined;
  const isMultipart = hasBody && isFormData(options.body);
  if (hasBody && !isMultipart && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    body = isFormData(options.body) ? options.body : JSON.stringify(options.body);
  }

  const doFetch = async (): Promise<Response> =>
    await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      body,
    });

  let response = await doFetch();

  if (response.status === 401) {
    const isRefreshEndpoint = path.replace(/^\//, "") === "api/v1/users/refresh-token";

    if (!isRefreshEndpoint) {
      const refreshed = await refreshAccessToken(baseUrl);
      if (refreshed) {
        response = await doFetch();
      }
    }
  }

  if (!response.ok) {
    const text = await readResponseTextSafe(response);

    const shouldRedirect =
      (options.redirectOn401 ?? true) &&
      response.status === 401 &&
      typeof window !== "undefined" &&
      path.replace(/^\//, "") !== "api/v1/users/login" &&
      path.replace(/^\//, "") !== "api/v1/users/register" &&
      path.replace(/^\//, "") !== "api/v1/users/refresh-token";

    const message = pickBestErrorMessage(response.status, response.statusText, text);

    if (shouldRedirect) {
      // Best-effort UX: session expired → send user to login.
      window.location.href = "/login";
    }

    throw new ApiFetchError(response.status, message, text);
  }

  return (await response.json()) as T;
}

function shouldRedirectToLogin(path: string, status: number, redirectOn401: boolean): boolean {
  return (
    redirectOn401 &&
    status === 401 &&
    typeof window !== "undefined" &&
    path.replace(/^\//, "") !== "api/v1/users/login" &&
    path.replace(/^\//, "") !== "api/v1/users/register" &&
    path.replace(/^\//, "") !== "api/v1/users/refresh-token"
  );
}

function xhrUpload(
  url: string,
  formData: FormData,
  options: ApiUploadOptions,
): Promise<{ status: number; statusText: string; responseText: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(options.method ?? "POST", url);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (!options.onProgress) return;
      if (e.lengthComputable) {
        const percent = e.total > 0 ? Math.round((e.loaded / e.total) * 100) : undefined;
        options.onProgress({ loaded: e.loaded, total: e.total, percent });
      } else {
        options.onProgress({ loaded: e.loaded });
      }
    };

    xhr.onload = () => {
      resolve({
        status: xhr.status,
        statusText: xhr.statusText,
        responseText: typeof xhr.responseText === "string" ? xhr.responseText : "",
      });
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () => reject(new Error("Request aborted"));

    try {
      xhr.send(formData);
    } catch (e) {
      reject(e);
    }
  });
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: ApiUploadOptions = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const redirectOn401 = options.redirectOn401 ?? true;

  const doUpload = async () => await xhrUpload(url, formData, options);

  let result = await doUpload();

  if (result.status === 401) {
    const isRefreshEndpoint = path.replace(/^\//, "") === "api/v1/users/refresh-token";
    if (!isRefreshEndpoint) {
      const refreshed = await refreshAccessToken(baseUrl);
      if (refreshed) {
        result = await doUpload();
      }
    }
  }

  if (result.status < 200 || result.status >= 300) {
    const message = pickBestErrorMessage(result.status, result.statusText, result.responseText);

    if (shouldRedirectToLogin(path, result.status, redirectOn401)) {
      window.location.href = "/login";
    }

    throw new ApiFetchError(result.status, message, result.responseText);
  }

  try {
    return JSON.parse(result.responseText) as T;
  } catch {
    throw new Error("Invalid JSON response from API");
  }
}
