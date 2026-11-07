# Dynamic Wallpaper for KDE Plasma 6 🌅🌄🌃

Plugin de fondo de pantalla dinámico para **KDE Plasma 6** que cambia automáticamente las imágenes del escritorio en función de las fases solares (**Amanecer**, **Día**, **Atardecer** y **Noche**) según tu ubicación geográfica.

---

## ✨ Características

- ☀️ **Cálculo Solar Astronómico Offline**: Determina con precisión las horas de amanecer, mediodía solar y puesta de sol según latitud y longitud, sin depender continuamente de servicios externos.
- 📍 **Detección Automática de Ubicación**: Botón integrado en la interfaz para autodetectar coordenadas geográficas por IP (vía servicios seguros fallback como ip-api e ipapi).
- 🎨 **Transiciones Suaves (Cross-Fade)**: Cambio gradual y animado entre fondos de pantalla con duración configurable para evitar saltos bruscos.
- 🛠️ **Interfaz Nativa Kirigami**: Diálogo de configuración integrado a la perfección con el estilo visual de KDE Plasma 6.
- 🧪 **Suite de Pruebas Automatizada**: Pruebas unitarias para cálculo astronómico, geolocalización, metadatos y sintaxis QML (`qmllint`).

---

## 📋 Requisitos

- **KDE Plasma 6**
- **kpackagetool6** (incluido en `plasma-workspace` / `kpackage`)
- **Qt 6 QML & Kirigami**

---

## 🚀 Instalación

### Método rápido (Script incluido)

Clona el repositorio e instala el plugin ejecutando:

```bash
git clone <URL_DEL_REPOSITORIO>
cd Dynamic-Walpaper-KDE
chmod +x install.sh
./install.sh
```

El script se encargará de remover versiones anteriores si existen e instalar el plugin en tu entorno local de Plasma 6.

### Desinstalación

Para desinstalar el plugin del sistema:

```bash
./install.sh --uninstall
```

O manualmente:

```bash
kpackagetool6 --type Plasma/Wallpaper --remove org.kde.plasma.dynamicwallpaper
```

---

## ⚙️ Configuración

1. Haz clic derecho en cualquier parte vacía de tu escritorio.
2. Selecciona **"Configurar escritorio y fondo de pantalla..."**.
3. En el selector de tipo de fondo de pantalla, elige **"Dynamic Wallpaper"**.
4. Configura tus imágenes:
   - **Amanecer (Dawn)**: Imagen para las primeras luces de la mañana.
   - **Día (Day)**: Imagen de día con iluminación completa.
   - **Atardecer (Sunset)**: Imagen del crepúsculo / puesta de sol.
   - **Noche (Night)**: Imagen nocturna.
5. Haz clic en **"Detectar ubicación automáticamente"** para obtener tus coordenadas, o ingrésalas manualmente.
6. Ajusta la duración de la transición a tu gusto y haz clic en **Aplicar**.

---

## 🧪 Pruebas Unitarias

El proyecto incluye una suite de pruebas que valida la integridad de los metadatos, los motores JavaScript y la sintaxis QML:

```bash
./tests/run_all_tests.sh
```

Componentes validados:
- `test_metadata.py`: Estructura de `metadata.json` y esquema KConfigXT `contents/config/main.xml`.
- `test_solar.js`: Cálculos astronómicos, latitudes polares y transiciones de fase.
- `test_geolocation.js`: Manejo de respuestas API, parsing y validación de rangos de coordenadas.
- `test_qml_syntax.sh`: Verificación estática con `qmllint`.

---

## 📁 Estructura del Proyecto

```text
├── contents/
│   ├── config/
│   │   └── main.xml         # Esquema de configuración KConfigXT
│   ├── js/
│   │   ├── solar.js         # Motor de cálculo solar astronómico
│   │   └── geolocation.js   # Cliente de geolocalización por IP
│   └── ui/
│       ├── config.qml       # Diálogo de configuración en Kirigami
│       └── main.qml         # Componente principal WallpaperItem con cross-fade
├── docs/                    # Especificaciones y planes de diseño
├── tests/                   # Suite de pruebas unitarias
├── install.sh               # Script de instalación/desinstalación
├── metadata.json            # Metadatos del plugin para KDE Plasma 6
├── .gitignore               # Configuración de exclusión para Git
├── LICENSE                  # Licencia GPL-3.0
└── README.md                # Documentación del proyecto
```

---

## 📄 Licencia

Este proyecto está bajo la licencia **GNU General Public License v3.0 or later** (GPL-3.0+). Consulta el archivo [LICENSE](LICENSE) para más detalles.

## 👤 Autor

- **JioDevR** - [joeldev.09@outlook.com](mailto:joeldev.09@outlook.com)
