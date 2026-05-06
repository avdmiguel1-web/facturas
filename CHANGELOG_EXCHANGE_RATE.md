# 🔄 Actualización: Sistema de Tasa de Cambio USD/VEF

## 📋 Resumen de Cambios

Se ha implementado un sistema completo de gestión de tasa de cambio del Banco Central de Venezuela (BCV) que actualiza automáticamente la tasa según el día.

## ✨ Nuevas Características

### 1. **Widget de Tasa de Cambio en el Dashboard**
   - Visualiza la tasa actual (490.04 VEF por USD)
   - Muestra la última fecha de actualización
   - Botón para sincronizar automáticamente con el BCV
   - Formulario para actualizar manualmente la tasa
   - Ejemplos de conversión (1, 100, 1000 USD → VEF)

### 2. **API REST Completa**

#### Obtener tasa actual
```bash
curl http://localhost:8001/api/exchange-rate
```

#### Actualizar tasa manualmente
```bash
curl -X POST http://localhost:8001/api/exchange-rate \
  -H "Content-Type: application/json" \
  -d '{"rate": 490.04}'
```

#### Sincronizar con BCV
```bash
curl -X POST http://localhost:8001/api/exchange-rate/sync
```

#### Convertir monedas
```bash
curl "http://localhost:8001/api/exchange-rate/convert?amount=100&from_currency=USD&to_currency=VEF"
```

### 3. **Sincronización Automática**
- Se ejecuta automáticamente al iniciar el servidor
- Intenta obtener la tasa de múltiples fuentes (DolarToday, BCV API)
- Usa tasa por defecto (490.04) si las fuentes fallan
- Mantiene la tasa actualizada en memoria durante la sesión

### 4. **Script de Sincronización Programada**

Para sincronización automática diaria:

```bash
# Sincronización única
python auto_sync_rate.py --mode once

# Sincronización continua cada 24 horas
python auto_sync_rate.py --mode continuous

# Sincronización con schedule (09:00 AM diariamente)
python auto_sync_rate.py --mode schedule
```

## 🔧 Archivos Nuevos/Modificados

### Nuevos Archivos
- ✅ `backend/services/exchange_rate.py` - Servicio de tasa de cambio
- ✅ `backend/models/exchange_rate.py` - Modelos Pydantic
- ✅ `backend/routes/exchange_rate.py` - Endpoints API
- ✅ `frontend/src/components/ExchangeRateWidget.js` - Widget React
- ✅ `auto_sync_rate.py` - Script de sincronización
- ✅ `EXCHANGE_RATE_DOCS.md` - Documentación técnica

### Archivos Modificados
- 📝 `backend/server.py` - Agregadas rutas y evento de startup
- 📝 `frontend/src/pages/Dashboard.js` - Integrado widget de tasa

## 💡 Cómo Usar

### En el Dashboard
1. Busca el widget **"Tasa de Cambio USD/VEF"** en la parte superior
2. Verás la tasa actual (490.04) y cuándo se actualizó por última vez
3. **Sincronizar**: Click en el botón verde para obtener la tasa del BCV
4. **Actualizar manualmente**: Ingresa una tasa y haz click en "Actualizar"

### Desde la API
```python
from services.exchange_rate import get_exchange_rate_service

service = get_exchange_rate_service()

# Obtener tasa actual
tasa = service.get_current_rate()  # 490.04

# Convertir USD a VEF
monto_vef = service.convert_usd_to_vef(100)  # 49004.00

# Convertir VEF a USD
monto_usd = service.convert_vef_to_usd(49004)  # 100.0
```

## ⚙️ Configuración

### Actualización Automática Diaria

#### Linux/Mac (Cron)
```bash
crontab -e
# Agregar: 0 9 * * * curl -X POST http://localhost:8001/api/exchange-rate/sync
```

#### Windows (Task Scheduler)
```powershell
$trigger = New-ScheduledTaskTrigger -Daily -At 9:00AM
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument 'Invoke-WebRequest -Uri "http://localhost:8001/api/exchange-rate/sync" -Method POST'
Register-ScheduledTask -TaskName "Sync Exchange Rate" -Trigger $trigger -Action $action -RunLevel Highest
```

## 📊 Características Técnicas

- **Tasa por defecto**: 490.04 (2 decimales)
- **Almacenamiento**: En memoria (sincroniza con BCV al iniciar)
- **Fuentes de datos**:
  - DolarToday API: https://ve.dolartoday.com/api
  - BCV API: https://api.bcv.org.ve/api/last
- **Conversión**: Bidireccional USD ↔ VEF
- **Precisión**: 2 decimales

## 🎯 Próximas Mejoras (Futuro)

- [ ] Persistencia en base de datos
- [ ] Historial de cambios de tasa
- [ ] Conversión automática en procesamiento de documentos
- [ ] Gráfico histórico de tasas
- [ ] Alertas de cambios significativos

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si no puede conectar al BCV?**
R: Usa la tasa por defecto (490.04) y continúa funcionando normalmente.

**P: ¿Se guarda el historial de tasas?**
R: Actualmente no, se almacena en memoria. Se puede agregar en futuras versiones.

**P: ¿Puedo cambiar la tasa manualmente?**
R: Sí, en el widget del Dashboard o mediante la API.

**P: ¿Cómo se usa para convertir documentos?**
R: Actualmente es informativo. Próximas versiones integrarán conversiones automáticas.

## 📞 Soporte

Para más detalles técnicos, consulta:
- `EXCHANGE_RATE_DOCS.md` - Documentación técnica completa
- `auto_sync_rate.py` - Script con ejemplos
- Logs del servidor para detalles de sincronización

---

**Versión**: 1.0
**Fecha**: 5 de Mayo de 2026
**Estado**: ✅ Implementado y funcional
