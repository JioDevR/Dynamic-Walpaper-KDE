# Diseño: Detección Automática de Ubicación por IP (Botón Manual)

- **Fecha:** 2026-10-28
- **Estado:** Propuesta de Diseño (Cambio menor)
- **Autor:** Antigravity & jiodev
- **Ubicación:** `docs/superpowers/specs/2026-10-28-ip-geolocation-manual-button-design.md`

---

## 1. Intención y Propósito ("The Why")
Permitir que el usuario configure fácilmente sus coordenadas geográficas (latitud y longitud) en el diálogo de configuración del fondo de pantalla dinámico de KDE Plasma 6 mediante un botón manual de detección automática vía IP, evitando tener que buscar o ingresar manualmente las coordenadas numéricas.

---

## 2. Metas y No-Metas

### Metas (Goals)
- Proveer un botón manual "Detectar ubicación" en [config.qml](file:///home/jiodev/Documents/Proyects/Dynamic-Walpaper-KDE/contents/ui/config.qml) junto a los campos de Latitud y Longitud.
- Realizar una petición HTTP GET asíncrona mediante `XMLHttpRequest` a un servicio web público y ligero de geolocalización IP (con fallback si uno falla, ej. `ip-api.com` o `ipapi.co`).
- Actualizar automáticamente los campos de configuración `cfg_latitude` y `cfg_longitude`.
- Mostrar retroalimentación clara al usuario: estado de carga ("Detectando..."), éxito ("Ubicación: Ciudad, País") o mensaje de error descriptivo en caso de fallo de red/tiempo de espera.
- Actualizar de inmediato la vista previa solar existente al recibir las coordenadas.

### No-Metas (Non-Goals)
- No realizar rastreo en segundo plano sin intervención del usuario.
- No requerir el demonio `geoclue2` ni permisos especiales del sistema.

---

## 3. Enfoques Considerados y Selección

### Enfoque A: Botón Manual con Consulta HTTP por IP (Seleccionado)
- **Descripción:** Un botón en `config.qml` que invoca una función JavaScript para consultar por HTTP la ubicación aproximada según la IP pública.
- **Ventajas:** Cero dependencias adicionales, funciona en cualquier distribución Linux, precisión adecuada para cálculos solares (~ciudad), control total por parte del usuario.
- **Desventajas:** Requiere conexión a internet al momento de pulsar el botón.

### Enfoque B: Servicio del Sistema `QtPositioning` / `GeoClue2`
- **Descripción:** Integrar `PositionSource` para obtener la posición por hardware o Wi-Fi local.
- **Desventajas:** `geoclue.service` no viene activo ni configurado por defecto en muchas distribuciones (como Arch Linux minimal), lo que genera fallos silenciosos.

---

## 4. Detalles de Implementación
1. **Módulo o función de geolocalización:**
   - Crear una función auxiliar (puede residir en `contents/js/geolocation.js` o integrada en `config.qml`) que ejecute `XMLHttpRequest` con un timeout razonable (ej. 7 segundos).
   - Servicio principal: `https://ip-api.com/json/?fields=status,message,country,city,lat,lon` (o `https://ipapi.co/json/`).
2. **Interfaz de usuario en [contents/ui/config.qml](file:///home/jiodev/Documents/Proyects/Dynamic-Walpaper-KDE/contents/ui/config.qml):**
   - En la sección "Coordenadas (Lat / Lon)":
     - Botón `QQC2.Button` con texto "Detectar automáticamente" e icono `mark-location` o `find-location`.
     - `QQC2.BusyIndicator` o etiqueta de estado para indicar progreso ("Buscando...", "📍 Detectado: Madrid, España", o mensaje de error en rojo).
     - Al completar con éxito, asigna `configRoot.cfg_latitude = data.lat` y `configRoot.cfg_longitude = data.lon`, lo cual dispara reactivamente `updateSolarPreview()`.
3. **Pruebas y Verificación:**
   - Pruebas sintácticas con `qmllint` mediante `bash tests/test_qml_syntax.sh`.
   - Pruebas unitarias de respuesta y parseo en `tests/`.
