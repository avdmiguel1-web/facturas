import streamlit as st
import pandas as pd
import plotly.express as px
import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8001/api")

st.title("Dashboard de Extracción de Datos")

# Instrucciones: Ejecutar con 'streamlit run backend/dashboard.py' después de iniciar el servidor FastAPI con 'uvicorn backend.server:app --reload'

# Función para obtener datos del API
def get_documents():
    try:
        response = requests.get(f"{API_BASE_URL}/documents/")
        if response.status_code == 200:
            return response.json()
        else:
            st.error("Error al obtener documentos")
            return []
    except Exception as e:
        st.error(f"Error de conexión: {e}")
        return []

documents = get_documents()

if documents:
    # Convertir a DataFrame
    df_list = []
    for doc in documents:
        data = doc.get("extracted_data", {})
        if "categoria_tipo" in data:
            df_list.append({
                "id": doc["id"],
                "categoria_tipo": data["categoria_tipo"],
                "categoria_subtipo": data.get("categoria_subtipo", data.get("tipo", "GENERAL")),
                "monto_total": data.get("monto_total", 0),
                "proveedor": data.get("proveedor", ""),
                "fecha": doc.get("upload_date", ""),
            })
        # Para specialized, procesar las listas
        for category in ["ventas_terceros", "telefonia_movil", "rentas_servicios", "resumen_consumo"]:
            if category in data:
                for item in data[category]:
                    if "categoria_tipo" in item:
                        df_list.append({
                            "id": doc["id"],
                            "categoria_tipo": item["categoria_tipo"],
                            "categoria_subtipo": item.get("categoria_subtipo", item.get("descripcion", "GENERAL")),
                            "monto_total": item.get("monto_bs", 0),
                            "proveedor": item.get("descripcion", ""),
                            "fecha": doc.get("upload_date", ""),
                        })

    if df_list:
        df = pd.DataFrame(df_list)

        st.subheader("Total Servicios vs Consumos")
        total_by_category = df.groupby("categoria_tipo")["monto_total"].sum().reset_index()
        fig = px.bar(
            total_by_category,
            x="categoria_tipo",
            y="monto_total",
            color="categoria_tipo",
            title="Total por Categoría",
            labels={"monto_total": "Monto Total", "categoria_tipo": "Categoría"},
        )
        st.plotly_chart(fig, use_container_width=True)

        st.subheader("Desglose por Subcategoría")
        subcategory_total = df.groupby(["categoria_tipo", "categoria_subtipo"])["monto_total"].sum().reset_index()
        fig2 = px.bar(
            subcategory_total,
            x="categoria_subtipo",
            y="monto_total",
            color="categoria_tipo",
            title="Desglose por Subcategoría",
            labels={"monto_total": "Monto Total", "categoria_subtipo": "Subcategoría", "categoria_tipo": "Categoría"},
        )
        st.plotly_chart(fig2, use_container_width=True)

        st.subheader("Datos Detallados")
        st.dataframe(df.sort_values(by="monto_total", ascending=False).reset_index(drop=True))
    else:
        st.info("No hay datos categorizados disponibles")
else:
    st.info("No hay documentos procesados")