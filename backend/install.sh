#!/bin/bash
# Script de instalación del Backend

echo "🚀 Instalando dependencias del Backend..."
echo ""

# Instalar dependencias principales
pip install -r requirements.txt

echo ""
echo "📦 Instalando emergentintegrations (Gemini AI)..."
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

echo ""
echo "✅ ¡Instalación completada!"
echo ""
echo "Próximo paso: Configura tu .env con tu GEMINI_API_KEY"
