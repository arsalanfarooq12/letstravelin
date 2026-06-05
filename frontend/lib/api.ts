const API_URL = process.env.NEXT_PUBLIC_API_URL!;
console.log("API URL:", API_URL);
type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data as T;
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; fullName: string }) =>
      request("/auth/register", { method: "POST", body }),

    login: (body: { email: string; password: string }) =>
      request<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string };
        profile: { id: string; fullName: string; role: string };
      }>("/auth/login", { method: "POST", body }),

    logout: (token: string) =>
      request("/auth/logout", { method: "POST", token }),

    getProfile: (token: string) => request("/auth/profile", { token }),

    updateProfile: (token: string, body: Partial<{ fullName: string }>) =>
      request("/auth/profile", { method: "PATCH", token, body }),
  },
};
