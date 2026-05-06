import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, BarChart3, History, Building2, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import ExchangeRateWidget from "@/components/ExchangeRateWidget";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

// Classification constants
const classificationSubtypes = {
  "Luz": ["luz", "electricidad", "ene"],
  "Agua": ["agua", "acueducto"],
  "Internet": ["internet", "wifi", "banda ancha", "isp", "datos"],
  "Mantenimiento": ["mantenimiento", "reparacion", "reparación", "servicio tecnico", "service"],
  "Telefonia": ["telefonia", "telefono", "telefónica", "movil", "móvil", "celular"],
  "Materiales": ["materiales", "insumos", "suministros", "herramientas", "papeleria", "papelería"],
  "Repuestos": ["repuestos", "refacciones", "refacción", "repuesto"],
  "Equipos": ["equipos", "equipo", "maquinaria", "hardware"],
  "Compras generales": ["compra", "compras", "factura de compra", "mercancia", "mercancía", "gasto"],
};

const subcategoryToCategory = {
  "Luz": "SERVICIOS",
  "Agua": "SERVICIOS",
  "Internet": "SERVICIOS",
  "Mantenimiento": "SERVICIOS",
  "Telefonia": "SERVICIOS",
  "Materiales": "CONSUMOS",
  "Repuestos": "CONSUMOS",
  "Equipos": "CONSUMOS",
  "Compras generales": "CONSUMOS",
};

const normalizeClassificationText = (text) => {
  return text
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const classifyWithKeywords = (text) => {
  const normalized = normalizeClassificationText(text);
  for (const [subtype, keywords] of Object.entries(classificationSubtypes)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return [subcategoryToCategory[subtype], subtype];
      }
    }
  }
  for (const [subtype, category] of Object.entries(subcategoryToCategory)) {
    if (normalized.includes(subtype.toLowerCase())) {
      return [category, subtype];
    }
  }
  return [null, null];
};

const classifyText = (text) => {
  const [category, subtype] = classifyWithKeywords(text);
  if (category) {
    return [category, subtype || "GENERAL"];
  }
  return ["DESCONOCIDO", "GENERAL"];
};

const normalizeCurrency = (currency) => {
  if (!currency || typeof currency !== "string") {
    return "VES";
  }

  const normalized = currency.trim().toLowerCase();
  if (normalized.includes("usd") || normalized.includes("dólar") || normalized.includes("dolar") || normalized.includes("us$") || normalized.includes("$") && !normalized.includes("bs")) {
    return "USD";
  }
  return "VES";
};

const formatAmount = (value, currency) => {
  const code = currency === "USD" ? "USD" : "VES";
  const locale = currency === "USD" ? "en-US" : "es-VE";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(value);
};

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(490.04); // Tasa por defecto

  useEffect(() => {
    // Obtener la tasa de cambio actual
    const fetchExchangeRate = async () => {
      try {
        const response = await api.get("/exchange-rate");
        setExchangeRate(response.data.rate || 490.04);
      } catch (err) {
        console.warn("No se pudo obtener la tasa de cambio, usando tasa por defecto");
        setExchangeRate(490.04);
      }
    };

    fetchExchangeRate();
  }, []);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await api.get("/documents/");
        setDocuments(response.data || []);
      } catch (err) {
        setError(err?.response?.data?.detail || err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const dashboardRows = useMemo(() => {
    const rows = [];
    const completedDocuments = documents.filter(
      (doc) => doc.processing_status === "completed" && doc.extracted_data
    );

    for (const doc of completedDocuments) {
      const data = doc.extracted_data || {};
      const documentCurrency = normalizeCurrency(String(data.moneda || data.currency || ""));

      // Handle general module data
      let categoria_tipo = data.categoria_tipo;
      let categoria_subtipo = data.categoria_subtipo || data.tipo || "GENERAL";
      if (!categoria_tipo) {
        [categoria_tipo, categoria_subtipo] = classifyText(`${data.proveedor || ''} ${data.tipo || ''}`);
      }
      if (categoria_tipo && Number(data.monto_total ?? 0) > 0) {
        rows.push({
          id: doc.id,
          categoria_tipo,
          categoria_subtipo,
          monto_total: Number(data.monto_total ?? 0),
          subcategoria_label: categoria_subtipo,
          currency: documentCurrency,
        });
      }

      // Handle specialized module data
      for (const section of ["ventas_terceros", "telefonia_movil", "rentas_servicios", "resumen_consumo"]) {
        const items = Array.isArray(data[section]) ? data[section] : [];
        for (const item of items) {
          let item_categoria_tipo = item.categoria_tipo;
          let item_categoria_subtipo = item.categoria_subtipo || item.descripcion || "GENERAL";
          if (!item_categoria_tipo) {
            [item_categoria_tipo, item_categoria_subtipo] = classifyText(item.descripcion || '');
          }
          const itemCurrency = normalizeCurrency(String(item.moneda || item.currency || data.moneda || data.currency || ""));
          if (item_categoria_tipo && Number(item.monto_bs ?? 0) > 0) {
            rows.push({
              id: doc.id,
              categoria_tipo: item_categoria_tipo,
              categoria_subtipo: item_categoria_subtipo,
              monto_total: Number(item.monto_bs ?? 0),
              subcategoria_label: item_categoria_subtipo,
              currency: itemCurrency || documentCurrency,
            });
          }
        }
      }
    }

    return rows;
  }, [documents]);

  const totalByCategory = useMemo(() => {
    const totals = {};
    dashboardRows.forEach((row) => {
      if (!row.categoria_tipo) return;
      totals[row.categoria_tipo] = (totals[row.categoria_tipo] || 0) + (row.monto_total || 0);
    });
    return Object.entries(totals).map(([categoria_tipo, monto_total]) => ({ categoria_tipo, monto_total }));
  }, [dashboardRows]);

  const totalBySubcategory = useMemo(() => {
    const totals = {};
    dashboardRows.forEach((row) => {
      if (!row.categoria_tipo || !row.categoria_subtipo) return;
      const key = `${row.categoria_tipo}||${row.categoria_subtipo}`;
      totals[key] = (totals[key] || 0) + (row.monto_total || 0);
    });
    return Object.entries(totals).map(([key, monto_total]) => {
      const [categoria_tipo, categoria_subtipo] = key.split("||");
      return { categoria_tipo, categoria_subtipo, monto_total };
    });
  }, [dashboardRows]);

  const COLORS = ["#0033CC", "#16A34A", "#F59E0B", "#DC2626", "#8B5CF6", "#0EA5E9"];

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalByCurrency = useMemo(() => {
    const totals = {};
    dashboardRows.forEach((row) => {
      const currency = row.currency === "USD" ? "USD" : "VES";
      totals[currency] = (totals[currency] || 0) + (row.monto_total || 0);
    });
    return Object.entries(totals).map(([currency, monto_total]) => ({ currency, monto_total }));
  }, [dashboardRows]);

  const pageCount = Math.max(1, Math.ceil(dashboardRows.length / rowsPerPage));

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const paginatedRows = dashboardRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const goToPage = (page) => {
    if (page < 1 || page > pageCount) return;
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-none p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-4xl font-bold text-[#09090B] tracking-tight mb-3">
              Sistema de Extraccion de Datos
            </h1>
            <p className="text-lg text-zinc-600 leading-relaxed max-w-3xl">
              Procesa documentos de facturacion y archivos complejos.
            </p>
          </div>
          <TrendingUp className="w-16 h-16 text-[#0033CC]" strokeWidth={1.5} />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-none p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-3">
            <ExchangeRateWidget onRateChange={setExchangeRate} />
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-none p-5">
            <h3 className="font-semibold text-lg text-[#09090B] mb-3">Gastos en Bolívares</h3>
            <p className="text-3xl font-bold text-[#16A34A]">
              {formatAmount(totalByCurrency.find((item) => item.currency === "VES")?.monto_total || 0, "VES")}
            </p>
            <p className="text-sm text-zinc-600 mt-2">
              Equivalente aprox. {formatAmount((totalByCurrency.find((item) => item.currency === "VES")?.monto_total || 0) / exchangeRate, "USD")} según tasa BCV de {exchangeRate.toFixed(2)}
            </p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-none p-5">
            <h3 className="font-semibold text-lg text-[#09090B] mb-3">Gastos en Dólares</h3>
            <p className="text-3xl font-bold text-[#0033CC]">
              {formatAmount(totalByCurrency.find((item) => item.currency === "USD")?.monto_total || 0, "USD")}
            </p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-none p-5">
          <h3 className="font-semibold text-lg text-[#09090B] mb-3">Gastos por Moneda</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalByCurrency} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="currency" />
                <YAxis />
                <Tooltip formatter={(value, name, props) => formatAmount(value, props.payload.currency)} />
                <Legend />
                <Bar dataKey="monto_total" name="Monto Total" fill="#0033CC">
                  {totalByCurrency.map((entry, index) => (
                    <Cell key={`cell-currency-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-none p-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold text-[#09090B]">Resumen de Categorías</h2>
              <p className="text-sm text-zinc-600">
                Visualiza los totales clasificados en SERVICIOS y CONSUMOS, y el desglose por subcategoría.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-zinc-600">Cargando datos...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : dashboardRows.length === 0 ? (
            <div className="text-zinc-600">No hay datos categorizados disponibles aún.</div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-zinc-50 border border-zinc-200 rounded-none p-5">
                  <h3 className="font-semibold text-lg text-[#09090B] mb-3">Servicios vs Consumos</h3>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={totalByCategory} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="categoria_tipo" />
                        <YAxis />
                        <Tooltip formatter={(value) => new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES", maximumFractionDigits: 2 }).format(value)} />
                        <Legend />
                        <Bar dataKey="monto_total" name="Monto Total" fill="#0033CC">
                          {totalByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-none p-5">
                  <h3 className="font-semibold text-lg text-[#09090B] mb-3">Desglose por Subcategoría</h3>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={totalBySubcategory} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="categoria_subtipo" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" interval={0} height={80} />
                        <YAxis />
                        <Tooltip formatter={(value) => new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES", maximumFractionDigits: 2 }).format(value)} />
                        <Legend />
                        <Bar dataKey="monto_total" name="Monto Total" fill="#16A34A">
                          {totalBySubcategory.map((entry, index) => (
                            <Cell key={`cell-sub-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-none p-5">
                <h3 className="font-semibold text-lg text-[#09090B] mb-4">Datos Detallados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-zinc-700">
                    <thead>
                      <tr>
                        <th className="border-b border-zinc-200 px-3 py-2">Categoría</th>
                        <th className="border-b border-zinc-200 px-3 py-2">Subcategoría</th>
                        <th className="border-b border-zinc-200 px-3 py-2">Moneda</th>
                        <th className="border-b border-zinc-200 px-3 py-2">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row, index) => (
                        <tr key={`${row.id}-${index}`} className="even:bg-zinc-50">
                          <td className="border-b border-zinc-200 px-3 py-2">{row.categoria_tipo}</td>
                          <td className="border-b border-zinc-200 px-3 py-2">{row.categoria_subtipo}</td>
                          <td className="border-b border-zinc-200 px-3 py-2">{row.currency === "USD" ? "Dólares" : "Bolívares"}</td>
                          <td className="border-b border-zinc-200 px-3 py-2">{formatAmount(row.monto_total, row.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3">
                  <p className="text-sm text-zinc-500">Mostrando {paginatedRows.length} de {dashboardRows.length} registros</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-zinc-300 rounded-none text-sm bg-white hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    {[...Array(pageCount)].map((_, pageIndex) => {
                      const page = pageIndex + 1;
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 border rounded-none text-sm ${page === currentPage ? "border-[#0033CC] bg-[#0033CC] text-white" : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100"}`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === pageCount}
                      className="px-3 py-2 border border-zinc-300 rounded-none text-sm bg-white hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
