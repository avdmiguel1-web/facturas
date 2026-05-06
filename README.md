# 🚀 Sistema de Extracción Inteligente de Datos con IA

Aplicación profesional full-stack que utiliza **Gemini 2.5 Flash** para extraer datos automáticamente de facturas y documentos complejos (PDF, imágenes, Word, Excel).

---

## 📋 Requisitos Previos

1. **Python 3.11+** → https://www.python.org/downloads/
2. **Node.js 18+ y Yarn** → https://nodejs.org/
3. **MongoDB 4.4+** → https://www.mongodb.com/try/download/community
4. **Visual Studio Code** → https://code.visualstudio.com/
5. **API Key de Gemini (GRATIS)** → https://aistudio.google.com/app/apikey

---

## 🚀 Instalación Rápida

### Paso 1: Abrir en VS Code

1. Descarga y descomprime `data-extraction-app.zip`
2. Abre VS Code → `File > Open Folder` → Selecciona `data-extraction-app`
3. Abre la terminal integrada (`` Ctrl+` ``)

### Paso 2: Backend

```bash
cd backend

# Crear y activar entorno virtual
# Windows:
python -m venv venv
venv\\Scripts\\activate

# macOS/Linux:
python3 -m venv venv
source venv/bin/activate
```

**IMPORTANTE - Instalar dependencias:**

```bash
# Windows - Ejecutar el script:
install.bat

# macOS/Linux - Ejecutar el script:
chmod +x install.sh
./install.sh
```

**O manualmente:**
```bash
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

**Configurar .env:**
```bash
# Windows:
copy .env.example .env
# macOS/Linux:
cp .env.example .env
```

**Edita `backend/.env` y añade tu API key:**
```env
GEMINI_API_KEY=TU_API_KEY_AQUI
```

**Iniciar servidor:**
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

✅ Backend en: http://localhost:8001

### Paso 3: Frontend (Nueva Terminal)

```bash
cd frontend

# Instalar Yarn si no lo tienes
npm install -g yarn

# Instalar dependencias
yarn install

# Configurar .env
# Windows:
copy .env.example .env
# macOS/Linux:
cp .env.example .env

# Iniciar aplicación
yarn start
```

✅ Frontend en: http://localhost:3000

### Paso 4: MongoDB

**Opción 1 - Docker (Recomendado):**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Opción 2 - Local:** Inicia MongoDB desde tu instalación

---

## ✨ Características

### Módulo A - Facturación General
- ✅ Extrae: Proveedor, RIF, Fecha, Período, Sub-total, IVA, Monto Total, Moneda, Tipo

### Módulo B - Análisis Especializado  
- ✅ Extrae: Ventas de Terceros, Telefonía Móvil, Rentas y Servicios, Resumen de Consumo
- ✅ Asigna números móviles a centros de costo
- ✅ Calcula porcentajes y totales

### Funcionalidades
- ✅ Gestión de Centros de Costo
- ✅ Historial de documentos procesados
- ✅ Exportación a Excel con análisis detallado
- ✅ Soporta: PDF, JPG, PNG, Word (.docx), Excel (.xlsx)

---

## 📁 Estructura del Proyecto

```
data-extraction-app/
├── backend/                    # FastAPI + Python
│   ├── install.sh             # Script de instalación (Linux/Mac)
│   ├── install.bat            # Script de instalación (Windows)
│   ├── requirements.txt       # Dependencias Python
│   ├── server.py             # Servidor principal
│   ├── models/               # Modelos de datos
│   ├── routes/               # Endpoints API
│   └── services/             # Lógica de negocio
│
└── frontend/                  # React + Tailwind
    ├── package.json          # Dependencias Node.js
    ├── src/
    │   ├── components/       # Componentes reutilizables
    │   └── pages/            # Páginas de la aplicación
    └── public/
```

---

## 📚 Librerías Instaladas

### Backend (Python)
```
fastapi          # Framework web
uvicorn          # Servidor ASGI
motor            # Driver MongoDB asíncrono
emergentintegrations  # Integración Gemini AI ⚠️
openpyxl         # Generación Excel
python-docx      # Procesamiento Word
PyPDF2           # Procesamiento PDF
pillow           # Procesamiento imágenes
pandas           # Análisis de datos
```

⚠️ **emergentintegrations** requiere instalación especial (incluida en los scripts)

### Frontend (Node.js)
```
react            # Biblioteca UI
react-router-dom # Navegación
axios            # Cliente HTTP
tailwindcss      # Framework CSS
react-dropzone   # Upload de archivos
sonner           # Notificaciones
lucide-react     # Iconos
```

---

## 🛠️ Troubleshooting

### Error: "emergentintegrations not found"

**Solución:**
```bash
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

O usa los scripts `install.bat` (Windows) o `install.sh` (Linux/Mac)

### Error: "ModuleNotFoundError"

**Solución:**
```bash
cd backend
pip install -r requirements.txt
```

### Error: "command not found: yarn"

**Solución:**
```bash
npm install -g yarn
```

### MongoDB no conecta

**Solución:**
```bash
# Verifica que MongoDB esté corriendo
mongod

# O con Docker:
docker start mongodb
```

### Puerto ya en uso

**Solución:**
```bash
# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8001 | xargs kill -9
```

---

## 🔌 API Endpoints

```
POST   /api/documents/upload              # Subir archivos
POST   /api/documents/{id}/process        # Procesar con IA
GET    /api/documents/                    # Listar documentos
GET    /api/cost-centers/                 # Centros de costo
POST   /api/mobile-assignments/           # Asignar móviles
GET    /api/export/general/{id}           # Exportar Excel
GET    /api/export/specialized/{id}       # Exportar análisis
```

---

## 🎯 Uso

1. Abre http://localhost:3000
2. **Crea Centros de Costo** (ej: IT, Ventas)
3. **Módulo A**: Sube factura → Procesar → Exportar Excel
4. **Módulo B**: Sube documento complejo → Asignar móviles → Exportar

---

## 💡 Extensiones Recomendadas de VS Code

- Python (Microsoft)
- Pylance
- ES7+ React Snippets
- ESLint
- Tailwind CSS IntelliSense

---

## 📄 Licencia

Desarrollado con ❤️ usando [Emergent Agent](https://emergent.sh)
