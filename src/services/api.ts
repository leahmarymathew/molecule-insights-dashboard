import type { UploadResponse } from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  throw new Error("VITE_API_BASE is not configured");
}

console.log("API BASE:", API_BASE);

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Server error ${response.status}: ${
          errorText || response.statusText
        }`
      );
    }

    return await response.json();
  } catch (e) {
    console.error("Upload Error:", e);

    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(
        "Request timed out. The backend took too long to respond."
      );
    }

    if (e instanceof TypeError) {
      throw new Error(
        "Cannot connect to backend. Check Render deployment and CORS configuration."
      );
    }

    if (e instanceof Error) {
      throw e;
    }

    throw new Error("Unknown upload error");
  } finally {
    clearTimeout(timeout);
  }
}