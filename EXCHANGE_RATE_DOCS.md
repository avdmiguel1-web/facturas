# Actualización de Tasa de Cambio USD/VEF

Este proyecto ahora incluye un sistema automático y manual para actualizar la tasa de cambio del Banco Central de Venezuela (BCV).

## 🔄 Características

- **Tasa por defecto**: 490.04 (mostrando 2 decimales)
- **Sincronización automática**: Al iniciar la aplicación, intenta obtener la tasa del BCV
- **Actualización manual**: Permite actualizar la tasa manualmente desde la interfaz
- **APIs REST**: Endpoints para obtener, actualizar y sincronizar la tasa
- **Conversión automática**: Convierte USD a VEF usando la tasa actual

## 📡 Endpoints de la API

### 1. Obtener Tasa Actual
```
GET /api/exchange-rate
```

**Respuesta:**
```json
{
  "rate": 490.04,
  "formatted_rate": "490.04",
  "last_update": "2026-05-05T12:30:45.123Z",
  "message": "Tasa de cambio actual"
}
```

### 2. Actualizar Tasa Manualmente
```
POST /api/exchange-rate
Content-Type: application/json

{
  "rate": 490.04
}
```

**Respuesta:**
```json
{
  "rate": 490.04,
  "formatted_rate": "490.04",
  "last_update": "2026-05-05T12:30:45.123Z",
  "message": "Tasa actualizada a 490.04"
}
```

### 3. Sincronizar con BCV
```
POST /api/exchange-rate/sync
```

**Respuesta:**
```json
{
  "rate": 490.04,
  "formatted_rate": "490.04",
  "last_update": "2026-05-05T12:30:45.123Z",
  "message": "Tasa sincronizada con BCV"
}
```

### 4. Convertir Monedas
```
GET /api/exchange-rate/convert?amount=100&from_currency=USD&to_currency=VEF
```

**Respuesta:**
```json
{
  "original_amount": 100,
  "from_currency": "USD",
  "converted_amount": 49004.00,
  "to_currency": "VEF",
  "exchange_rate": 490.04,
  "exchange_rate_formatted": "490.04"
}
```

## 🖥️ Interfaz de Usuario

En el Dashboard, existe un widget **"Tasa de Cambio USD/VEF"** que permite:

1. **Ver la tasa actual** con la última actualización
2. **Sincronizar automáticamente** desde el BCV
3. **Actualizar manualmente** ingresando una nueva tasa
4. **Ver ejemplos de conversión** (1 USD, 100 USD, 1000 USD en VEF)

## 🔧 Instalación de Dependencias

Las dependencias están en `backend/requirements.txt`. Para instalar:

```bash
cd backend
pip install -r requirements.txt
```

Las siguientes librerías son clave:
- `requests`: Para obtener datos del BCV
- `fastapi`: Para los endpoints
- `pydantic`: Para validación de datos

## 🚀 Uso

### Iniciar el servidor
```bash
cd backend
python -m uvicorn server:app --reload --port 8001
```

El servidor sincronizará automáticamente la tasa del BCV al iniciar.

### Actualizar la tasa desde Python
```python
from services.exchange_rate import get_exchange_rate_service

service = get_exchange_rate_service()

# Obtener tasa actual
print(service.get_current_rate())  # 490.04

# Actualizar manualmente
service.set_rate(495.50)

# Convertir USD a VEF
vef_amount = service.convert_usd_to_vef(100)  # 49004.00

# Convertir VEF a USD
usd_amount = service.convert_vef_to_usd(49004)  # 100.0

# Sincronizar con BCV (async)
import asyncio
rate = asyncio.run(service.fetch_rate_from_bcv())
```

## 📅 Actualización Automática Diaria

Para actualizar la tasa automáticamente cada día, puedes usar:

### Opción 1: Linux/Mac con Cron
```bash
# Editar crontab
crontab -e

# Agregar esta línea para ejecutar cada día a las 9:00 AM
0 9 * * * curl -X POST http://localhost:8001/api/exchange-rate/sync
```

### Opción 2: Windows con Tareas Programadas
```powershell
# Crear una tarea que ejecute cada día
$trigger = New-ScheduledTaskTrigger -Daily -At 9:00AM
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument 'Invoke-WebRequest -Uri "http://localhost:8001/api/exchange-rate/sync" -Method POST'
Register-ScheduledTask -TaskName "Sync Exchange Rate" -Trigger $trigger -Action $action -RunLevel Highest
```

### Opción 3: Script Python Programado
```python
# auto_sync_rate.py
import asyncio
import schedule
import time
from services.exchange_rate import get_exchange_rate_service

def sync_rate():
    service = get_exchange_rate_service()
    asyncio.run(service.fetch_rate_from_bcv())
    print(f"Tasa sincronizada: {service.get_current_rate()}")

# Sincronizar cada día a las 9:00 AM
schedule.every().day.at("09:00").do(sync_rate)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## 📊 Fuentes de Datos

El sistema intenta obtener la tasa de las siguientes fuentes (en orden):

1. **DolarToday API**: `https://ve.dolartoday.com/api`
2. **BCV API**: `https://api.bcv.org.ve/api/last`

Si todas las fuentes fallan, usa la tasa por defecto (490.04).

## ⚠️ Notas Importantes

1. La tasa se almacena en memoria. Si el servidor reinicia, se sincronizará con el BCV automáticamente.
2. Solo se soporta conversión USD ↔ VEF.
3. La tasa se muestra con 2 decimales máximo.
4. Todos los montos se guardan en Bolívares (VEF) en la base de datos.

## 🔗 Integración con Documentos

La tasa de cambio se puede integrar automáticamente al procesar documentos para convertir montos de USD a VEF. Actualmente, los documentos se extraen con el campo `moneda` que indica si es USD o VEF.

Para futuras mejoras, se puede:
- Convertir automáticamente montos en USD a VEF durante la extracción
- Almacenar ambos valores (original y convertido)
- Crear reportes con conversiones históricas

## 📞 Soporte

Para reportar problemas o sugerencias, revisa los logs del servidor:
```bash
# Ver logs en tiempo real
tail -f logs/app.log
```
