import React, { useState } from "react";
import FileUploader from "@/components/FileUploader";
import ExportButton from "@/components/ExportButton";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ModuleA = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Por favor selecciona al menos un archivo");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await axios.post(`${API}/documents/upload`, formData);

      setUploadedDocuments(response.data);
      toast.success(`${response.data.length} archivo(s) subido(s) exitosamente`);
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error("Error al subir archivos");
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async (documentId) => {
    setProcessing(true);
    setCurrentDocumentId(documentId);
    try {
      const formData = new FormData();
      formData.append('module_type', 'general');

      const response = await axios.post(
        `${API}/documents/${documentId}/process`,
        formData
      );

      setExtractedData(response.data.data);
      toast.success("Documento procesado exitosamente");
    } catch (error) {
      console.error('Error processing:', error);
      toast.error("Error al procesar documento");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-none p-6">
        <h2 className="font-heading text-2xl font-bold text-[#09090B] mb-2 tracking-tight">
          Módulo A: Facturación General
        </h2>
        <p className="text-zinc-600">
          Extrae datos de facturas: Proveedor, RIF, Fecha, Período, Sub-total, IVA, Monto Total, Moneda y Tipo.
        </p>
      </div>

      {/* File Upload Section */}
      <div className="bg-white border border-zinc-200 rounded-none p-6">
        <h3 className="font-heading text-lg font-bold text-[#09090B] mb-4 tracking-tight">
          1. Cargar Documentos
        </h3>
        <FileUploader
          onFilesSelected={setSelectedFiles}
          moduleType="general"
        />
        {selectedFiles.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            data-testid="upload-button"
            className="mt-4 bg-[#0033CC] text-white rounded-none px-6 py-2 font-medium hover:bg-[#002299] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              "Subir Archivos"
            )}
          </button>
        )}
      </div>

      {/* Uploaded Documents */}
      {uploadedDocuments.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-none p-6">
          <h3 className="font-heading text-lg font-bold text-[#09090B] mb-4 tracking-tight">
            2. Procesar con IA
          </h3>
          <div className="space-y-2">
            {uploadedDocuments.map((doc) => (
              <div
                key={doc.id}
                data-testid={`document-${doc.id}`}
                className="flex items-center justify-between p-4 border border-zinc-200 rounded-none"
              >
                <div>
                  <p className="font-medium text-zinc-900">{doc.filename}</p>
                  <p className="text-sm text-zinc-500">
                    {(doc.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => handleProcess(doc.id)}
                  disabled={processing}
                  data-testid={`process-button-${doc.id}`}
                  className="bg-transparent border border-zinc-300 text-zinc-900 rounded-none px-6 py-2 font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing && currentDocumentId === doc.id ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    "Procesar"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Data */}
      {extractedData && (
        <div className="bg-white border border-zinc-200 rounded-none p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold text-[#09090B] tracking-tight">
              3. Datos Extraídos
            </h3>
            <ExportButton
              documentId={currentDocumentId}
              exportType="general"
              label="Exportar a Excel"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="extracted-data-table">
              <thead>
                <tr className="bg-zinc-50">
                  <th className="text-left">Campo</th>
                  <th className="text-left">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">Proveedor</td>
                  <td>{extractedData.proveedor || "-"}</td>
                </tr>
                <tr>
                  <td className="font-semibold">RIF</td>
                  <td className="font-mono">{extractedData.rif || "-"}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Fecha</td>
                  <td>{extractedData.fecha || "-"}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Período</td>
                  <td>{extractedData.periodo || "-"}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Sub-total (Base Imponible)</td>
                  <td className="font-mono">
                    {extractedData.subtotal ? extractedData.subtotal.toLocaleString() : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">IVA</td>
                  <td className="font-mono">
                    {extractedData.iva ? extractedData.iva.toLocaleString() : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">Monto Total</td>
                  <td className="font-mono">
                    {extractedData.monto_total ? extractedData.monto_total.toLocaleString() : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">Moneda</td>
                  <td>{extractedData.moneda || "-"}</td>
                </tr>
                <tr>
                  <td className="font-semibold">Tipo</td>
                  <td>
                    <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border rounded-none text-zinc-700 border-zinc-300 bg-zinc-50">
                      {extractedData.tipo || "-"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleA;
