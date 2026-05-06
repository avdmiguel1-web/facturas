#!/usr/bin/env python3
"""
Script de testing para los endpoints de tasa de cambio.
Ejecutar desde el directorio raíz del proyecto.

Uso: python test_exchange_rate.py
"""

import requests
import json
import sys
from pathlib import Path

# Base URL del servidor
BASE_URL = "http://localhost:8001/api"


def test_get_exchange_rate():
    """Test: Obtener tasa actual"""
    print("\n📊 Test 1: Obtener tasa actual")
    print("GET /api/exchange-rate")
    
    try:
        response = requests.get(f"{BASE_URL}/exchange-rate")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Éxito (HTTP {response.status_code})")
            print(f"   Tasa: {data.get('formatted_rate')} VEF/USD")
            print(f"   Última actualización: {data.get('last_update')}")
            return True
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"   {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False


def test_update_exchange_rate():
    """Test: Actualizar tasa manualmente"""
    print("\n📝 Test 2: Actualizar tasa manualmente")
    print("POST /api/exchange-rate")
    
    new_rate = 495.50
    payload = {"rate": new_rate}
    
    try:
        response = requests.post(
            f"{BASE_URL}/exchange-rate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Éxito (HTTP {response.status_code})")
            print(f"   Nueva tasa: {data.get('formatted_rate')} VEF/USD")
            print(f"   Mensaje: {data.get('message')}")
            return True
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"   {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False


def test_sync_exchange_rate():
    """Test: Sincronizar con BCV"""
    print("\n🔄 Test 3: Sincronizar con BCV")
    print("POST /api/exchange-rate/sync")
    
    try:
        response = requests.post(f"{BASE_URL}/exchange-rate/sync")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Éxito (HTTP {response.status_code})")
            print(f"   Tasa obtenida: {data.get('formatted_rate')} VEF/USD")
            print(f"   Mensaje: {data.get('message')}")
            return True
        else:
            print(f"⚠️  Error: HTTP {response.status_code}")
            print(f"   {response.text}")
            print("   (Posible causa: sin conexión a Internet o BCV no disponible)")
            return False
    except Exception as e:
        print(f"⚠️  Error de conexión: {e}")
        print("   (Verifica que el servidor esté ejecutándose)")
        return False


def test_convert_currency():
    """Test: Convertir monedas"""
    print("\n💱 Test 4: Convertir monedas")
    print("GET /api/exchange-rate/convert?amount=100&from_currency=USD&to_currency=VEF")
    
    try:
        params = {
            "amount": 100,
            "from_currency": "USD",
            "to_currency": "VEF"
        }
        response = requests.get(f"{BASE_URL}/exchange-rate/convert", params=params)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Éxito (HTTP {response.status_code})")
            print(f"   {data.get('original_amount')} USD = {data.get('converted_amount'):,.2f} VEF")
            print(f"   Tasa usada: {data.get('exchange_rate_formatted')} VEF/USD")
            return True
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(f"   {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False


def test_invalid_rate():
    """Test: Intentar actualizar con tasa inválida"""
    print("\n⚠️  Test 5: Validación - Tasa inválida")
    print("POST /api/exchange-rate (con tasa inválida)")
    
    invalid_rate = -100
    payload = {"rate": invalid_rate}
    
    try:
        response = requests.post(
            f"{BASE_URL}/exchange-rate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code != 200:
            print(f"✅ Validación correcta (HTTP {response.status_code})")
            data = response.json()
            print(f"   Error: {data.get('detail', 'Tasa debe ser mayor a 0')}")
            return True
        else:
            print(f"❌ No se validó correctamente: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False


def main():
    """Ejecuta todos los tests"""
    print("=" * 60)
    print("🧪 TESTING ENDPOINTS DE TASA DE CAMBIO")
    print("=" * 60)
    print(f"\nBase URL: {BASE_URL}")
    print("Asegúrate de que el servidor esté ejecutándose:")
    print("  python -m uvicorn backend.server:app --reload --port 8001")
    
    results = []
    
    # Ejecutar tests
    results.append(("Obtener tasa", test_get_exchange_rate()))
    results.append(("Convertir monedas", test_convert_currency()))
    results.append(("Actualizar tasa", test_update_exchange_rate()))
    results.append(("Validación", test_invalid_rate()))
    results.append(("Sincronizar con BCV", test_sync_exchange_rate()))
    
    # Resumen
    print("\n" + "=" * 60)
    print("📋 RESUMEN DE RESULTADOS")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests pasados")
    
    if passed == total:
        print("\n🎉 ¡Todos los tests pasaron!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) fallaron")
        return 1


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⛔ Testing interrumpido por el usuario")
        sys.exit(1)
