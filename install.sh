#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ID="org.kde.plasma.dynamicwallpaper"
KPACKAGETOOL="kpackagetool6"

if ! command -v "$KPACKAGETOOL" &>/dev/null; then
    if [ -x "/usr/bin/kpackagetool6" ]; then
        KPACKAGETOOL="/usr/bin/kpackagetool6"
    else
        echo "Error: kpackagetool6 no fue encontrado en el sistema."
        echo "Asegúrate de tener instaladas las herramientas de KDE Plasma 6."
        exit 1
    fi
fi

if [ "$1" == "--uninstall" ] || [ "$1" == "-u" ]; then
    echo "Desinstalando plugin $PLUGIN_ID..."
    "$KPACKAGETOOL" --type Plasma/Wallpaper --remove "$PLUGIN_ID" || true
    echo "Desinstalación completada."
    exit 0
fi

echo "=== Instalando Plugin de Fondo Dinámico para KDE Plasma 6 ==="
echo "Directorio del plugin: $DIR"

# Eliminar versión previa si ya estaba instalada para asegurar una instalación limpia
echo "Comprobando instalaciones anteriores..."
"$KPACKAGETOOL" --type Plasma/Wallpaper --remove "$PLUGIN_ID" 2>/dev/null || true

# Instalar el nuevo paquete
echo "Instalando paquete en Plasma 6..."
"$KPACKAGETOOL" --type Plasma/Wallpaper --install "$DIR"

echo ""
echo "=== Verificación de Instalación ==="
"$KPACKAGETOOL" --type Plasma/Wallpaper --show "$PLUGIN_ID"

echo ""
echo "✓ Plugin $PLUGIN_ID instalado correctamente."
echo "Ya puedes seleccionarlo en: Preferencias del sistema -> Fondo de pantalla (o clic derecho en el escritorio -> Configurar escritorio y fondos de pantalla)."
