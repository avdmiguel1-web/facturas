# ⚡ Guía Rápida de Instalación (5 minutos)

## 1. MongoDB
```bash
# Con Docker (recomendado):
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 2. Backend

```bash
cd backend

# Crear y activar entorno virtual
# Windows:
python -m venv venv
venv\Scripts\activate

# macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# INSTALAR DEPENDENCIAS:
# Windows:
install.bat

# macOS/Linux:
chmod +x install.sh
./install.sh

# Configurar .env
cp .env.example .env
# Edita .env y añade tu GEMINI_API_KEY

# Iniciar servidor
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## 3. Frontend (Nueva Terminal)

```bash
cd frontend

# Instalar dependencias
yarn install

# Configurar .env
cp .env.example .env

# Iniciar app
yarn start
```

## 4. ¡Listo!
- Backend: http://localhost:8001
- Frontend: http://localhost:3000

---

## 🔑 Obtener API Key de Gemini (GRATIS)

1. Ve a https://aistudio.google.com/app/apikey
2. Haz clic en "Create API Key"
3. Copia la key
4. Pégala en `backend/.env`:
   ```
   GEMINI_API_KEY=tu_key_aqui
   ```

---

## ⚠️ IMPORTANTE

**La instalación de dependencias del backend usa 2 comandos:**

```bash
# 1. Dependencias principales
pip install -r requirements.txt

# 2. Biblioteca especial de Gemini
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

**Los scripts `install.bat` y `install.sh` hacen esto automáticamente.**
