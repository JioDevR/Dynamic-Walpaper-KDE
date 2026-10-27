# Diseño: Plugin de Fondo de Pantalla Dinámico para KDE Plasma 6 (Estilo macOS)

- **Fecha:** 2026-10-27
- **Estado:** Propuesta de Diseño
- **Autor:** Antigravity & jiodev
- **Ubicación:** `docs/superpowers/specs/2026-10-27-dynamic-wallpaper-kde6-design.md`

---

## 1. Intención y Propósito ("The Why")
Proporcionar a los usuarios de KDE Plasma 6 una experiencia de fondos de pantalla dinámicos inspirada en macOS, donde el fondo de escritorio transiciona de forma fluida y automática a lo largo de las fases del día (Amanecer, Día, Atardecer, Noche) según la posición solar real del usuario. El plugin permite a los usuarios utilizar sus propias carpetas de imágenes (JPG, PNG, WebP) y asignar manualmente qué imagen corresponde a cada fase del día utilizando exclusivamente componentes nativos de KDE 6 (Qt 6, Kirigami, PlasmaComponents3) y funcionando 100% sin conexión a internet.

---

## 2. Metas, No-Metas y Anti-Metas

### Metas (Goals)
- **Integración nativa con KDE Plasma 6:** Empaquetado como un plugin de fondo de pantalla oficial (`plasma/wallpaper`), configurable desde el diálogo de ajustes de escritorio estándar de Plasma 6.
- **Asignación manual por fases del día:** Interfaz en la que el usuario selecciona una carpeta y asigna libremente cada una de las 4 etapas del día:
  1. **Amanecer** (Dawn / Sunrise)
  2. **Día** (Day / Noon)
  3. **Atardecer** (Sunset / Dusk)
  4. **Noche** (Night)
- **Cálculo solar local (100% offline):** Cálculo preciso de las horas de salida, puesta y elevación solar mediante algoritmos astronómicos matemáticos estándar (fórmulas NOAA / Jean Meeus / SPA) en JavaScript sin requerir APIs web externas.
- **Transiciones fluidas (Cross-fade):** Efecto de disolución cruzada suave y configurable entre las imágenes al cambiar de fase, evitando cambios bruscos.
- **Fácil instalación:** Estructura puramente declarativa (QML/JS), instalable sin requerir compilación C++ ni dependencias externas de desarrollo.

### No-Metas (Non-Goals)
- No es meta emular el formato binario propietario `.heic` o metadatos propietarios de Apple en esta primera versión (se utilizan formatos estándar universales en carpetas abiertas).
- No es meta crear un editor de imágenes o un recortador de fondos dentro de la configuración.
- No es meta soportar video en vivo o shaders complejos tipo Wallpaper Engine en esta fase.

### Anti-Metas (Anti-Goals)
- **Dependencia de servicios en la nube o APIs HTTP:** No depender de APIs externas (como sunrise-sunset.org) en tiempo de ejecución para evitar fallos de conexión, consumo de cuotas o lentitud.
- **Complejidad de compilación:** Evitar dependencias C++ pesadas que requieran compilar con GCC/Clang o cabeceras de desarrollo (`plasma-workspace-dev`), garantizando que cualquier usuario pueda instalarlo vía `kpackagetool6`.
- **Consumo innecesario de recursos:** Evitar bucles de cálculo continuo; el plugin debe evaluar la hora y posición solar periódicamente (ej. cada minuto) o programar un temporizador hacia el siguiente hito solar.

---

## 3. Restricciones Técnicas
- **Plataforma:** KDE Plasma 6 (Qt 6.x, KDE Frameworks 6).
- **Librerías de UI:** Kirigami 6, PlasmaComponents 3, QtQuick, QtQuick.Controls, QtQuick.Layouts, QtQuick.Dialogs.
- **Formato de empaquetado:** Estructura KPackage estándar para `plasma/wallpaper`.
- **Almacenamiento de configuración:** Subsistema KConfig de Plasma mediante `contents/config/main.xml`.

---

## 4. Enfoques Considerados y Selección

### Enfoque 1: Plugin 100% Declarativo en QML/JS (KPackage nativo de Plasma) — *SELECCIONADO*
- **Descripción:** Implementación como KPackage de tipo `plasma/wallpaper`. La configuración usa Kirigami y componentes de Plasma 6. El cálculo solar astronómico corre en un módulo JavaScript puro (`solar.js`).
- **Ventajas:** No requiere compilación; máxima portabilidad entre distribuciones Linux; distribución sencilla vía KDE Store o `kpackagetool6`; ciclo de vida gestionado directamente por Plasma.
- **Desventajas:** La enumeración de archivos se realiza a través de `FolderListModel` de QtQuick o JavaScript auxiliar.

### Enfoque 2: Híbrido C++ + QML/Kirigami
- **Descripción:** Un plugin de C++ compilado con CMake que expone un tipo QML personalizado para el cálculo solar y gestión de archivos en hilos separados.
- **Ventajas:** Máxima optimización de bajo nivel.
- **Desventajas:** Exige cadena de herramientas de compilación (`cmake`, `extra-cmake-modules`, `gcc`, librerías KF6 de desarrollo), mayor fricción para usuarios finales y riesgo de incompatibilidad binaria entre versiones de Qt 6.

**Decisión:** Se adopta el **Enfoque 1** por solicitud del usuario y por alinearse con los estándares modernos de extensiones ligeras de Plasma 6.

---

## 5. Arquitectura y Componentes del Sistema

### 5.1. Estructura del KPackage
```text
Dynamic-Walpaper-KDE/
├── metadata.json                         # Definición de plugin de Plasma 6 (Id, versión, autores, categoría)
└── contents/
    ├── config/
    │   └── main.xml                      # Definición del esquema KConfigXT (claves de configuración)
    ├── js/
    │   └── solar.js                      # Algoritmo matemático solar (cálculo astronómico local)
    └── ui/
        ├── main.qml                      # Vista principal del fondo de escritorio (pantalla + transiciones)
        └── config.qml                    # Diálogo de configuración en Ajustes de Escritorio de Plasma (Kirigami)
```

### 5.2. Esquema de Configuración (`main.xml`)
Claves persistentes gestionadas automáticamente por Plasma:
- `folderPath` (String): Ruta de la carpeta seleccionada por el usuario (ej. `~/Imágenes/DynamicWallpapers`).
- `imageDawn` (String): Nombre o ruta relativa del archivo para el **Amanecer**.
- `imageDay` (String): Nombre o ruta relativa del archivo para el **Día**.
- `imageSunset` (String): Nombre o ruta relativa del archivo para el **Atardecer**.
- `imageNight` (String): Nombre o ruta relativa del archivo para la **Noche**.
- `latitude` (Double): Latitud geográfica del usuario (por defecto: obtenida o valor configurable).
- `longitude` (Double): Longitud geográfica del usuario.
- `transitionDuration` (Int): Duración de la animación de cross-fade en milisegundos (ej. 1500 ms).

### 5.3. Interfaz de Configuración (`config.qml`) - Enfoque B (Galería + Asignación)
Construida con componentes nativos de KDE 6 / Kirigami:
- **Selector de carpeta:** Botón y campo de texto con `FolderDialog` nativo de Qt 6.
- **Galería de imágenes:** Cuadrícula (`GridView` / `CardsLayout`) que muestra miniaturas de todas las imágenes válidas encontradas en la carpeta seleccionada (`FolderListModel`).
- **Asignación a fases:** Cada tarjeta de imagen permite mediante un menú desplegable (`ComboBox` o botones de acción) asignar la imagen a una de las 4 fases: Amanecer, Día, Atardecer, Noche. Las imágenes asignadas muestran una insignia (*badge*) visual identificando su fase.
- **Resumen solar y coordenadas:** Sección inferior en `Kirigami.FormLayout` con los campos de Latitud y Longitud, mostrando en tiempo real los horarios calculados para el día de hoy (ej. "Amanecer: 06:14, Atardecer: 18:22").

### 5.4. Motor de Visualización y Transición (`main.qml`)
- Dispone de dos elementos `Image` superpuestos (Front Image y Back Image) para lograr un desvanecimiento cruzado (*cross-fade*) impecable.
- Un temporizador ligero (`Timer`) evalúa periódicamente (cada 60 segundos) la fase actual según la hora UTC y las fórmulas solares de `solar.js`.
- Cuando la fase calculada difiere de la fase activa, se carga la nueva imagen en segundo plano y se activa un `NumberAnimation` sobre la propiedad `opacity` para transicionar suavemente.

### 5.5. Motor Astronómico (`solar.js`)
- Implementación de las ecuaciones solares estándar de NOAA / Jean Meeus:
  - Cálculo del día juliano y siglo juliano.
  - Declinación solar y ecuación del tiempo.
  - Ángulo cenital solar para amanecer/atardecer oficial (-0.833°), crepúsculo civil (-6°).
  - Determinación exacta del intervalo para:
    - **Amanecer:** Desde el inicio del crepúsculo civil hasta elevación solar de ~6° sobre el horizonte.
    - **Día:** Cuando el sol está plenamente sobre el horizonte hasta el inicio del atardecer.
    - **Atardecer:** Desde elevación de ~6° descendiendo hasta el fin del crepúsculo civil (-6°).
    - **Noche:** Sol bajo el crepúsculo civil (-6° a nadir).

---

## 6. Lo que Queda a Criterio del Implementador (Builder)
- La duración por defecto de la transición cruzada (se sugiere 1500ms a 2000ms).
- El comportamiento por defecto si el usuario aún no ha asignado imágenes a las 4 fases (ej. mostrar un fondo de color neutro o la primera imagen disponible de la carpeta).
- Las opciones de escalado de la imagen (`Image.PreserveAspectCrop` por defecto, ajustable según el estándar de Plasma).
- Atajos para autodetectar la zona horaria/coordenadas aproximadas si Plasma provee propiedades de geolocalización.

---

## 7. Plan de Verificación y Pruebas
1. **Verificación de empaquetado:** Validar sintaxis de `metadata.json` y empaquetado con `kpackagetool6 --type Plasma/Wallpaper --install .` (o `--upgrade`).
2. **Prueba de configuración UI:** Abrir las preferencias de escritorio de KDE Plasma 6, seleccionar el plugin, elegir una carpeta de prueba con 4 imágenes y verificar la asignación visual.
3. **Prueba de motor solar:** Ejecutar pruebas unitarias en `solar.js` pasando coordenadas y horas conocidas para verificar que clasifique correctamente las 4 fases del día.
4. **Prueba de transición visual:** Simular cambios de fase horaria y comprobar que el cross-fade se ejecute de manera fluida y sin saltos visuales ni fugas de memoria.
