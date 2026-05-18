import type { UploadResponse } from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE;
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Server error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Request timed out. The backend took too long to respond.");
    }
    if (e instanceof TypeError) {
      throw new Error("Cannot connect to the backend. Check that the server is running and CORS is configured.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
