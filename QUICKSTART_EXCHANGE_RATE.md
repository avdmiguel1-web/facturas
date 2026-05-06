# 🚀 Guía Rápida: Sistema de Tasa de Cambio

## Inicio Rápido (5 minutos)

### 1️⃣ Iniciar el Servidor Backend
```bash
cd backend
python -m uvicorn server:app --reload --port 8001
```

**Resultado esperado:**
- El servidor sincronizará automáticamente la tasa del BCV al iniciar
- Verás en los logs: `Tasa de cambio sincronizada al inicio: 490.04`

### 2️⃣ Abrir el Dashboard
```bash
# En otra terminal, desde el frontend
cd frontend
npm start
```

### 3️⃣ Ver el Widget de Tasa

En el Dashboard, busca el widget azul **"Tasa de Cambio USD/VEF"** en la parte superior.

Verás:
- Tasa actual: **490.04 VEF**
- Última actualización: Fecha y hora
- Botón verde: **Sincronizar** (obtener tasa del BCV)
- Campo de entrada: Para actualizar manualmente

## 🎯 Acciones Comunes

### Ver Tasa Actual
1. Abre el Dashboard
2. Mira el widget de tasa (muestra 490.04)
3. Se actualiza cada que recargas la página

### Sincronizar con BCV (Obtener Tasa del Día)
1. Click en botón **"Sincronizar"** (verde con icono 🔄)
2. Espera 2-3 segundos
3. Se mostrará la tasa actualizada si hay conexión a Internet
4. Si falla, continuará usando la tasa anterior

### Actualizar Manualmente
1. En el campo de entrada, borra la tasa actual
2. Ingresa la nueva tasa (ej: 500.00)
3. Click en **"Actualizar"**
4. Se actualizará inmediatamente

### Convertir Monedas
1. Ver ejemplos en el widget:
   - 1 USD = 490.04 VEF
   - 100 USD = 49,004.00 VEF
   - 1000 USD = 490,040.00 VEF

## 🔧 Comandos Útiles

### Test de Endpoints (desde terminal)
```bash
# Ver tasa actual
curl http://localhost:8001/api/exchange-rate

# Sincronizar con BCV
curl -X POST http://localhost:8001/api/exchange-rate/sync

# Actualizar manualmente a 500.00
curl -X POST http://localhost:8001/api/exchange-rate \
  -H "Content-Type: application/json" \
  -d '{"rate": 500.00}'

# Convertir 100 USD a VEF
curl "http://localhost:8001/api/exchange-rate/convert?amount=100"
```

### Ejecutar Tests Automáticos
```bash
cd /data-extraction-app
python test_exchange_rate.py
```

Esto verificará que todos los endpoints funcionen correctamente.

## 📱 Características por Pantalla

### Dashboard
- ✅ Widget de tasa (arriba)
- ✅ Botón sincronizar
- ✅ Actualización manual
- ✅ Ejemplos de conversión

### Conversión de Montos
Los gastos en el dashboard ahora:
- Se calculan con la tasa actual
- Se actualizan automáticamente cuando cambias la tasa

## ⚙️ Configuración Automática (Opcional)

### Sincronizar Diariamente a las 9:00 AM

**Linux/Mac:**
```bash
# Agregar a crontab
crontab -e
# Pegar: 0 9 * * * curl -X POST http://localhost:8001/api/exchange-rate/sync
```

**Windows:**
```powershell
# Ejecutar PowerShell como Administrador
$trigger = New-ScheduledTaskTrigger -Daily -At 9:00AM
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument 'Invoke-WebRequest -Uri "http://localhost:8001/api/exchange-rate/sync" -Method POST'
Register-ScheduledTask -TaskName "Sync Exchange Rate" -Trigger $trigger -Action $action
```

**Con Python:**
```bash
# Modo continuo (sincroniza cada 24 horas)
python auto_sync_rate.py --mode continuous

# Modo schedule (09:00 AM diariamente)
python auto_sync_rate.py --mode schedule
```

## 🐛 Troubleshooting

### El widget no aparece
- ✅ Verifica que el servidor esté ejecutándose
- ✅ Abre la consola del navegador (F12) y busca errores
- ✅ Recarga la página

### "Error al obtener la tasa"
- ✅ Verifica conexión a Internet
- ✅ Es normal si no hay conexión - continuará con tasa anterior
- ✅ Mira los logs del servidor para más detalles

### Botón Sincronizar no funciona
- ✅ Verifica que el servidor esté corriendo
- ✅ Intenta manualmente: `curl -X POST http://localhost:8001/api/exchange-rate/sync`
- ✅ Si falla, es probable que el BCV API esté offline (intentará nuevamente)

### Tasa no se actualiza
- ✅ Abre DevTools (F12) → Network
- ✅ Click en botón Sincronizar
- ✅ Verifica que haya una solicitud POST exitosa
- ✅ Si es 200 OK, recarga la página

## 📊 Fuentes de Datos

El sistema intenta obtener la tasa de estas fuentes (en orden):
1. **DolarToday**: https://ve.dolartoday.com/api
2. **BCV**: https://api.bcv.org.ve/api/last

Si ambas fallan → usa **tasa por defecto: 490.04**

## 💡 Tips

1. **Actualiza diariamente**: Sincroniza cada mañana para tasa actual
2. **Usa la API**: Puedes integrar la tasa en otros sistemas
3. **Monitorea logs**: Verifica que sincronizaciones sean exitosas
4. **Valida tasas**: El sistema rechaza tasas <= 0

## 📞 Ayuda

Para más detalles:
- 📖 `EXCHANGE_RATE_DOCS.md` - Documentación técnica completa
- 📋 `CHANGELOG_EXCHANGE_RATE.md` - Cambios implementados
- 🧪 `test_exchange_rate.py` - Tests de endpoints
- 🔄 `auto_sync_rate.py` - Script de sincronización

---

**Versión**: 1.0
**Última actualización**: 5 de Mayo, 2026
