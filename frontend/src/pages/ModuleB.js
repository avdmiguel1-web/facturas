import React, { useState, useEffect } from "react";
import FileUploader from "@/components/FileUploader";
import ExportButton from "@/components/ExportButton";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ModuleB = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [costCenters, setCostCenters] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMobile, setSelectedMobile] = useState(null);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    try {
      const response = await axios.get(`${API}/cost-centers/`);
      setCostCenters(response.data);
    } catch (error) {
      console.error('Error fetching cost centers:', error);
    }
  };

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
      formData.append('module_type', 'specialized');

      const response = await axios.post(
        `${API}/documents/${documentId}/process`,
        formData
      );

      setExtractedData(response.data.data);
      toast.success("Documento procesado exitosamente");

      // Fetch assignments for this document
      fetchAssignments(documentId);
    } catch (error) {
      console.error('Error processing:', error);
      toast.error("Error al procesar documento");
    } finally {
      setProcessing(false);
    }
  };

  const fetchAssignments = async (documentId) => {
    try {
      const response = await axios.get(`${API}/mobile-assignments?document_id=${documentId}`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleAssignMobile = async (mobileData, costCenterId) => {
    try {
      const response = await axios.post(`${API}/mobile-assignments`, {
        document_id: currentDocumentId,
        numero_movil: mobileData.numero_movil,
        cost_center_id: costCenterId,
        monto_bs: mobileData.monto_bs || 0
      });

      toast.success("Número asignado exitosamente");
      fetchAssignments(currentDocumentId);
      setShowAssignModal(false);
      setSelectedMobile(null);
    } catch (error) {
      console.error('Error assigning mobile:', error);
      toast.error("Error al asignar número");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-none p-6">
        <h2 className="font-heading text-2xl font-bold text-[#09090B] mb-2 tracking-tight">
          Módulo B: Análisis Especializado
        </h2>
        <p className="text-zinc-600">
          Procesa documentos complejos con tablas: Ventas de Terceros, Telefonía Móvil, Rentas y Servicios, Resumen de Consumo.
        </p>
      </div>

      {/* File Upload Section */}
      <div className="bg-white border border-zinc-200 rounded-none p-6">
        <h3 className="font-heading text-lg font-bold text-[#09090B] mb-4 tracking-tight">
          1. Cargar Documentos
        </h3>
        <FileUploader
          onFilesSelected={setSelectedFiles}
          moduleType="specialized"
        />
        {selectedFiles.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            data-testid="upload-button-module-b"
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
                data-testid={`document-b-${doc.id}`}
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
                  data-testid={`process-button-b-${doc.id}`}
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
        <div className="space-y-6">
          {/* Ventas de Terceros */}
          {extractedData.ventas_terceros && extractedData.ventas_terceros.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-none p-6">
              <h3 className="font-heading text-lg font-bold text-[#09090B] mb-4 tracking-tight">
                Ventas de Terceros
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="ventas-terceros-table">
                  <thead>
                    <tr className="bg-zinc-50">
                      <th className="text-left">Descripción</th>
                      <th className="text-left">Cantidad</th>
                      <th className="text-left">Monto en Bs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.ventas_terceros.map((item, index) => (
                      <tr key={index}>
                        <td>{item.descripcion || "-"}</td>
                        <td className="font-mono">{item.cantidad || "-"}</td>
                        <td className="font-mono">{item.monto_bs ? item.monto_bs.toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Telefonía Móvil */}
          {extractedData.telefonia_movil && extractedData.telefonia_movil.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-none p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg font-bold text-[#09090B] tracking-tight">
                  Telefonía Móvil
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="telefonia-movil-table">
                  <thead>
                    <tr className="bg-zinc-50">
                      <th className="text-left">No. Móvil</th>
                      <th className="text-left">Descripción</th>
                      <th className="text-left">Monto en Bs</th>
                      <th className="text-left">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.telefonia_movil.map((item, index) => {
                      const assignment = assignments.find(a => a.numero_movil === item.numero_movil);
                      return (
                        <tr key={index}>
                          <td className="font-mono">{item.numero_movil || "-"}</td>
                          <td>{item.descripcion || "-"}</td>
                          <td className="font-mono">{item.monto_bs ? item.monto_bs.toLocaleString() : "-"}</td>
                          <td>
                            {assignment ? (
                              <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider border rounded-none text-green-700 border-green-700 bg-green-50">
                                {assignment.cost_center_name}
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedMobile(item);
                                  setShowAssignModal(true);
                                }}
                                data-testid={`assign-mobile-${index}`}
                                className="text-[#0033CC] hover:underline text-sm font-medium"
                              >
                                Asignar Centro de Costo
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rentas y Servicios */}
          {extractedData.rentas_servicios && extractedData.rentas_servicios.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-none p-6">
              <h3 className="font-heading text-lg font-bold text-[#09090B] mb-4 tracking-tight">
                Rentas y Servicios
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="rentas-servicios-table">
                  <thead>
                    <tr className="bg-zinc-50">
                      <th className="text-left">Descripción</th>
                      <th className="text-left">Fecha Desde</th>
                      <th className="text-left">Fecha Hasta</th>
                      <th className="text-left">Monto en Bs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.rentas_servicios.map((item, index) => (
                      <tr key={index}>
                        <td>{item.descripcion || "-"}</td>
                        <td>{item.fecha_desde || "-"}</td>
                        <td>{item.fecha_hasta || "-"}</td>
                        <td className="font-mono">{item.monto_bs ? item.monto_bs.toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resumen de Consumo */}
          {extractedData.resumen_consumo && extractedData.resumen_consumo.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-none p-6">
              <h3 className="font-heading text-lg font-bold text-[#09090B] mb-4 tracking-tight">
                Resumen de Consumo
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="resumen-consumo-table">
                  <thead>
                    <tr className="bg-zinc-50">
                      <th className="text-left">Descripción</th>
                      <th className="text-left">Unidades Consumidas</th>
                      <th className="text-left">Monto en Bs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.resumen_consumo.map((item, index) => (
                      <tr key={index}>
                        <td>{item.descripcion || "-"}</td>
                        <td className="font-mono">{item.unidades_consumidas || "-"}</td>
                        <td className="font-mono">{item.monto_bs ? item.monto_bs.toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="bg-white border border-zinc-200 rounded-none p-6">
            <ExportButton
              documentId={currentDocumentId}
              exportType="specialized"
              label="Exportar Análisis Completo a Excel"
            />
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="assign-modal">
          <div className="bg-white border border-zinc-200 rounded-none p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold text-[#09090B]">
                Asignar Centro de Costo
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedMobile(null);
                }}
                data-testid="close-assign-modal"
                className="text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Número Móvil: <span className="font-mono font-semibold">{selectedMobile.numero_movil}</span>
            </p>
            <div className="space-y-2">
              {costCenters.map((cc) => (
                <button
                  key={cc.id}
                  onClick={() => handleAssignMobile(selectedMobile, cc.id)}
                  data-testid={`select-cost-center-${cc.id}`}
                  className="w-full text-left p-3 border border-zinc-200 rounded-none hover:border-[#0033CC] hover:bg-zinc-50 transition-colors"
                >
                  <p className="font-medium text-zinc-900">{cc.name}</p>
                  {cc.description && (
                    <p className="text-sm text-zinc-500">{cc.description}</p>
                  )}
                </button>
              ))}
              {costCenters.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-4">
                  No hay centros de costo disponibles. Crea uno primero.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleB;
