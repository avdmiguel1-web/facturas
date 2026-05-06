import axios from "axios";

const trimUrl = (url) => (url || "").trim().replace(/\/+$/, "");

const configuredBackendUrl = trimUrl(process.env.REACT_APP_BACKEND_URL);

const buildApiBaseUrls = () => {
  const candidates = [configuredBackendUrl].filter(Boolean);

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      candidates.push(`${protocol}//localhost:8001`);
      candidates.push(`${protocol}//127.0.0.1:8001`);
      candidates.push(`${protocol}//localhost:8000`);
      candidates.push(`${protocol}//127.0.0.1:8000`);
    } else {
      candidates.push(`${protocol}//${hostname}:8001`);
      candidates.push(`${protocol}//${hostname}:8000`);
    }
  } else {
    candidates.push("http://localhost:8001");
    candidates.push("http://localhost:8000");
  }

  return [...new Set(candidates.map((url) => `${trimUrl(url)}/api`))];
};

const API_BASE_URLS = buildApiBaseUrls();

export const API_BASE_URL = API_BASE_URLS[0];

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestConfig = error?.config;

    if (!requestConfig || error?.response || requestConfig.__retriedWithFallback) {
      return Promise.reject(error);
    }

    const currentBaseUrl = requestConfig.baseURL || api.defaults.baseURL;
    const fallbackBaseUrls = API_BASE_URLS.filter((baseUrl) => baseUrl !== currentBaseUrl);

    for (const fallbackBaseUrl of fallbackBaseUrls) {
      try {
        return await axios.request({
          ...requestConfig,
          baseURL: fallbackBaseUrl,
          __retriedWithFallback: true,
        });
      } catch (retryError) {
        if (retryError?.response) {
          return Promise.reject(retryError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallbackMessage) => {
  const responseDetail = error?.response?.data?.detail;

  if (Array.isArray(responseDetail) && responseDetail.length > 0) {
    return responseDetail.map((item) => item?.msg || String(item)).join(". ");
  }

  if (typeof responseDetail === "string" && responseDetail.trim()) {
    return responseDetail;
  }

  if (!error?.response) {
    return `${fallbackMessage}. No se pudo conectar con la API. Verifica que el backend este ejecutandose en el puerto 8001 o 8000, o configura REACT_APP_BACKEND_URL correctamente.`;
  }

  if (error?.message) {
    return `${fallbackMessage}: ${error.message}`;
  }

  return fallbackMessage;
};
