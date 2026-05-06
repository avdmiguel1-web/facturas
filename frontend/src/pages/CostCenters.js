import React, { useEffect, useState } from "react";
import { Plus, Building2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { api, getApiErrorMessage } from "@/lib/api";

const CostCenters = () => {
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    setLoading(true);
    try {
      const response = await api.get("/cost-centers/");
      setCostCenters(response.data);
    } catch (error) {
      console.error("Error fetching cost centers:", error);
      toast.error(getApiErrorMessage(error, "Error al cargar centros de costo"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre es requerido.");
      return;
    }

    try {
      await api.post("/cost-centers/", formData);
      toast.success("Centro de costo creado.");
      setShowCreateModal(false);
      setFormData({ name: "", description: "" });
      fetchCostCenters();
    } catch (error) {
      console.error("Error creating cost center:", error);
      toast.error(getApiErrorMessage(error, "Error al crear el centro de costo"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Estas seguro de eliminar este centro de costo?")) {
      return;
    }

    try {
      await api.delete(`/cost-centers/${id}`);
      toast.success("Centro de costo eliminado.");
      fetchCostCenters();
    } catch (error) {
      console.error("Error deleting cost center:", error);
      toast.error(getApiErrorMessage(error, "Error al eliminar el centro de costo"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-none p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#09090B] mb-2 tracking-tight">
              Centros de Costo
            </h2>
            <p className="text-zinc-600">
              Gestiona centros de costo para asignar lineas y analizar gastos.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            data-testid="create-cost-center-button"
            className="flex items-center gap-2 bg-[#0033CC] text-white rounded-none px-6 py-2 font-medium hover:bg-[#002299] transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Crear Centro de Costo
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-none p-6">
        {loading ? (
          <p className="text-zinc-500">Cargando centros de costo...</p>
        ) : costCenters.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-zinc-300 mb-4" strokeWidth={1.5} />
            <p className="text-zinc-500 mb-4">No hay centros de costo aun.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-[#0033CC] hover:underline font-medium"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {costCenters.map((costCenter) => (
              <div
                key={costCenter.id}
                data-testid={`cost-center-${costCenter.id}`}
                className="border border-zinc-200 rounded-none p-4 hover:border-[#0033CC] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0033CC] bg-opacity-10">
                      <Building2 className="w-5 h-5 text-[#0033CC]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-[#09090B]">
                        {costCenter.name}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Creado{" "}
                        {costCenter.created_at
                          ? new Date(costCenter.created_at).toLocaleDateString("es-ES")
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(costCenter.id)}
                    data-testid={`delete-cost-center-${costCenter.id}`}
                    className="text-zinc-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
                {costCenter.description && (
                  <p className="text-sm text-zinc-600">{costCenter.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="create-cost-center-modal"
        >
          <div className="bg-white border border-zinc-200 rounded-none p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-bold text-[#09090B]">
                Crear Centro de Costo
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", description: "" });
                }}
                data-testid="close-create-modal"
                className="text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  data-testid="cost-center-name-input"
                  className="w-full px-4 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-[#0033CC] focus:border-transparent"
                  placeholder="Ej: Departamento de IT"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Descripcion
                </label>
                <textarea
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({ ...formData, description: event.target.value })
                  }
                  data-testid="cost-center-description-input"
                  className="w-full px-4 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-[#0033CC] focus:border-transparent"
                  placeholder="Descripcion del centro de costo"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: "", description: "" });
                  }}
                  className="flex-1 bg-transparent border border-zinc-300 text-zinc-900 rounded-none px-6 py-2 font-medium hover:bg-zinc-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="submit-cost-center"
                  className="flex-1 bg-[#0033CC] text-white rounded-none px-6 py-2 font-medium hover:bg-[#002299] transition-colors"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCenters;
