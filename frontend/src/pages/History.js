import React, { useEffect, useState } from "react";
import { Eye, Trash2, FileText, BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";

import ExportButton from "@/components/ExportButton";
import { api, getApiErrorMessage } from "@/lib/api";

const History = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get("/documents/");
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error(getApiErrorMessage(error, "Error al cargar documentos"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm("Estas seguro de eliminar este documento?")) {
      return;
    }

    try {
      await api.delete(`/documents/${documentId}`);
      toast.success("Documento eliminado.");
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(getApiErrorMessage(error, "Error al eliminar el documento"));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: "Pendiente", class: "text-zinc-700 border-zinc-300 bg-zinc-50" },
      processing: { text: "Procesando", class: "text-blue-700 border-blue-700 bg-blue-50" },
      completed: { text: "Completado", class: "text-green-700 border-green-700 bg-green-50" },
      failed: { text: "Error", class: "text-red-700 border-red-700 bg-red-50" },
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider border rounded-none ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const getModuleIcon = (moduleType) =>
    moduleType === "general" ? (
      <FileText className="w-5 h-5 text-[#0033CC]" strokeWidth={1.5} />
    ) : (
      <BarChart3 className="w-5 h-5 text-[#16A34A]" strokeWidth={1.5} />
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0033CC]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-none p-6">
        <h2 className="font-heading text-2xl font-bold text-[#09090B] mb-2 tracking-tight">
          Historial de Documentos Procesados
        </h2>
        <p className="text-zinc-600">
          Revisa los documentos ya cargados, su estado y los datos extraidos.
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-none p-6">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-zinc-300 mb-4" strokeWidth={1.5} />
            <p className="text-zinc-500">No hay documentos procesados aun.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="history-table">
              <thead>
                <tr className="bg-zinc-50">
                  <th className="text-left">Modulo</th>
                  <th className="text-left">Archivo</th>
                  <th className="text-left">Tamano</th>
                  <th className="text-left">Fecha de carga</th>
                  <th className="text-left">Estado</th>
                  <th className="text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} data-testid={`history-row-${doc.id}`}>
                    <td>
                      <div className="flex items-center gap-2">
                        {doc.module_type && getModuleIcon(doc.module_type)}
                        <span className="text-xs">
                          {doc.module_type === "general"
                            ? "Modulo A"
                            : doc.module_type === "specialized"
                              ? "Modulo B"
                              : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="font-medium">{doc.filename}</td>
                    <td className="font-mono text-sm">
                      {(Number(doc.file_size || 0) / 1024).toFixed(2)} KB
                    </td>
                    <td className="text-sm">
                      {doc.upload_date ? new Date(doc.upload_date).toLocaleString("es-ES") : "-"}
                    </td>
                    <td>{getStatusBadge(doc.processing_status)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowDetailModal(true);
                          }}
                          data-testid={`view-details-${doc.id}`}
                          className="text-[#0033CC] hover:underline text-sm font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" strokeWidth={1.5} />
                          Ver
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          data-testid={`delete-doc-${doc.id}`}
                          className="text-red-600 hover:underline text-sm font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDetailModal && selectedDocument && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          data-testid="detail-modal"
        >
          <div className="bg-white border border-zinc-200 rounded-none p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-bold text-[#09090B]">
                Detalles del documento
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                data-testid="close-detail-modal"
                className="text-zinc-400 hover:text-zinc-900"
              >
                x
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Archivo
                </p>
                <p className="font-medium">{selectedDocument.filename}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Tamano
                  </p>
                  <p className="font-mono">
                    {(Number(selectedDocument.file_size || 0) / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                    Estado
                  </p>
                  {getStatusBadge(selectedDocument.processing_status)}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Fecha de carga
                </p>
                <p>
                  {selectedDocument.upload_date
                    ? new Date(selectedDocument.upload_date).toLocaleString("es-ES")
                    : "-"}
                </p>
              </div>
            </div>

            {selectedDocument.extracted_data && (
              <div className="border-t border-zinc-200 pt-6">
                <h4 className="font-heading text-lg font-bold text-[#09090B] mb-4">
                  Datos extraidos
                </h4>
                <div className="bg-zinc-50 p-4 rounded-none border border-zinc-200 overflow-x-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(selectedDocument.extracted_data, null, 2)}
                  </pre>
                </div>
                <div className="mt-4">
                  <ExportButton
                    documentId={selectedDocument.id}
                    exportType={selectedDocument.module_type || "general"}
                    label="Exportar a Excel"
                  />
                </div>
              </div>
            )}

            {selectedDocument.error_message && (
              <div className="border-t border-zinc-200 pt-6">
                <h4 className="font-heading text-lg font-bold text-red-600 mb-4">
                  Error
                </h4>
                <div className="bg-red-50 p-4 rounded-none border border-red-200">
                  <p className="text-sm text-red-700">{selectedDocument.error_message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
