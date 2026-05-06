import React from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { api, getApiErrorMessage } from "@/lib/api";

const getDownloadFilename = (headers, fallbackName) => {
  const contentDisposition = headers?.["content-disposition"];
  const match = contentDisposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallbackName;
};

const readBlobErrorMessage = async (error, fallbackMessage) => {
  const blob = error?.response?.data;
  if (!(blob instanceof Blob)) {
    return getApiErrorMessage(error, fallbackMessage);
  }

  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    if (typeof parsed?.detail === "string" && parsed.detail.trim()) {
      return parsed.detail;
    }
  } catch (parseError) {
    console.warn("Could not parse export error blob:", parseError);
  }

  return getApiErrorMessage(error, fallbackMessage);
};

const ExportButton = ({ documentId, exportType, label }) => {
  const handleExport = async () => {
    try {
      const endpoint =
        exportType === "general"
          ? `/export/general/${documentId}`
          : `/export/specialized/${documentId}`;

      const response = await api.get(endpoint, {
        responseType: "blob",
      });

      const filename = getDownloadFilename(
        response.headers,
        `${exportType}_${documentId}.xlsx`
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Archivo exportado exitosamente.");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error(await readBlobErrorMessage(error, "Error al exportar el archivo"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      data-testid={`export-button-${exportType}`}
      className="flex items-center gap-2 bg-[#0033CC] text-white rounded-none px-6 py-2 font-medium hover:bg-[#002299] transition-colors"
    >
      <Download className="w-4 h-4" strokeWidth={1.5} />
      <span>{label || "Exportar a Excel"}</span>
    </button>
  );
};

export default ExportButton;
