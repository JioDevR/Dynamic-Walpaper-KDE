# IP Geolocation Manual Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual "Detect Location" button to the wallpaper configuration dialog that queries an IP geolocation API via HTTP and populates the latitude and longitude settings.

**Architecture:** A standalone JavaScript helper module (`contents/js/geolocation.js`) encapsulates response parsing and `XMLHttpRequest` logic with dual CommonJS/QML export. In `contents/ui/config.qml`, a button, loading indicator, and status label in the coordinates section trigger the request, handle timeouts/errors, update `cfg_latitude` and `cfg_longitude`, and refresh the solar preview.

**Tech Stack:** KDE Plasma 6, Qt 6 (QtQuick, QtQuick.Controls, QtQuick.Layouts), Kirigami 6, JavaScript (XMLHttpRequest), Node.js (for testing).

**Spec:** `docs/superpowers/specs/2026-10-28-ip-geolocation-manual-button-design.md`

## Global Constraints

- **Plasma Version:** Targeted strictly for KDE Plasma 6 (Qt 6 / KF6).
- **Zero Binary Compilation:** Pure QML and JavaScript; no C++ compilation steps required.
- **Asynchronous & Non-blocking:** HTTP calls via `XMLHttpRequest` must be asynchronous with a strict timeout (max 7000ms).
- **Safe Parsing:** Handle unexpected, empty, or malformed JSON responses without throwing unhandled exceptions.
- **Schema Continuity:** Uses existing `latitude` and `longitude` keys in `contents/config/main.xml`; manual coordinate entry remains fully functional.

## Review Focus

1. **Network Disconnected / Offline:** When there is no internet connection, `XMLHttpRequest` fails or times out; the UI must display a clear error message ("Error de conexión" / "Tiempo de espera agotado") without freezing.
2. **Malformed or Rate-Limited API Response:** When the API returns non-JSON or `{ status: "fail", message: "..." }`, parser must catch the failure and report a friendly error.
3. **Out-of-range Coordinates:** If API returns invalid latitude/longitude (e.g. lat > 90 or lon > 180), they must be rejected before touching configuration properties.
4. **Debounced / Disabled During Request:** While a detection request is in-flight, the button must be disabled to prevent overlapping concurrent network calls.
5. **Manual Overrides Preserved:** If the user manually edits the text fields after an auto-detection, the manual values must remain valid and update the solar calculation.

---

### Task 1: Geolocation Client Logic and Unit Tests

**Files:**
- Create: `contents/js/geolocation.js`
- Create: `tests/test_geolocation.js`
- Modify: `tests/run_all_tests.sh`

**Interfaces:**
- Produces:
  - `parseLocationResponse(responseText: string) -> { lat: number, lon: number, city: string, country: string }`
  - `fetchLocation(onSuccess: function(result), onError: function(errorMsg), options: object)`

- [ ] **Step 1: Write unit tests for geolocation response parsing and validation**

Create `tests/test_geolocation.js` covering:
- Parsing valid `ip-api.com` JSON format: `{"status":"success","country":"Spain","city":"Madrid","lat":40.4168,"lon":-3.7038}`.
- Parsing valid `ipapi.co` JSON format: `{"latitude":40.4168,"longitude":-3.7038,"city":"Madrid","country_name":"Spain"}`.
- Rejecting API error format: `{"status":"fail","message":"invalid query"}`.
- Rejecting malformed JSON strings or empty responses.
- Rejecting out-of-range coordinate values (e.g. lat = 150).

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_geolocation.js`
Expected: FAIL (cannot find module `../contents/js/geolocation.js`).

- [ ] **Step 3: Implement `contents/js/geolocation.js`**

Implement `parseLocationResponse(responseText)` and `fetchLocation(onSuccess, onError, options)`:
- Primary URL: `https://ip-api.com/json/?fields=status,message,country,city,lat,lon`
- Use `XMLHttpRequest` with `timeout = (options && options.timeout) ? options.timeout : 7000`.
- Handle `onload`, `onerror`, `ontimeout`.
- Dual export pattern (CommonJS `module.exports` for Node tests + top-level functions for QML).

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test_geolocation.js`
Expected: PASS.

- [ ] **Step 5: Update `tests/run_all_tests.sh`**

Add step running `node tests/test_geolocation.js` in `tests/run_all_tests.sh`.
Run: `bash tests/run_all_tests.sh`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add contents/js/geolocation.js tests/test_geolocation.js tests/run_all_tests.sh
git commit -m "feat: add geolocation client and unit test suite"
```

---

### Task 2: UI Integration in Wallpaper Settings (`config.qml`)

**Files:**
- Modify: `contents/ui/config.qml`

**Interfaces:**
- Consumes:
  - `GeoClient.fetchLocation(onSuccess, onError, options)` from `../js/geolocation.js`
- Produces:
  - Button `QQC2.Button` with label "Detectar automáticamente"
  - Busy indicator `QQC2.BusyIndicator`
  - Feedback label `QQC2.Label`

- [ ] **Step 1: Import geolocation helper in `config.qml`**

Add `import "../js/geolocation.js" as GeoClient` at the top of `contents/ui/config.qml`.

- [ ] **Step 2: Add UI state properties to `configRoot`**

In `contents/ui/config.qml`:
- `property bool isDetectingLocation: false`
- `property string locationStatusText: ""`
- `property bool locationStatusIsError: false`

- [ ] **Step 3: Add auto-detection controls to Coordinate section**

In the Kirigami FormLayout section for Coordinates:
- Add a row containing:
  - `QQC2.Button`: text "Detectar automáticamente", icon `mark-location`, enabled `!configRoot.isDetectingLocation`.
  - `QQC2.BusyIndicator`: visible and running when `configRoot.isDetectingLocation`.
  - `QQC2.Label`: displays `configRoot.locationStatusText`, colored red when `locationStatusIsError` or standard theme text otherwise.
- On button click:
  - Set `isDetectingLocation = true`, clear status text.
  - Call `GeoClient.fetchLocation`:
    - On success: set `cfg_latitude = result.lat`, `cfg_longitude = result.lon`, update text fields, set status text (e.g. `"📍 " + result.city + (result.country ? ", " + result.country : "")`), set `locationStatusIsError = false`, set `isDetectingLocation = false`.
    - On error: set `locationStatusText = "⚠️ " + errorMsg`, set `locationStatusIsError = true`, set `isDetectingLocation = false`.

- [ ] **Step 4: Verify QML syntax with `qmllint`**

Run: `bash tests/test_qml_syntax.sh`
Expected: PASS with 0 errors.

- [ ] **Step 5: Run full test suite**

Run: `bash tests/run_all_tests.sh`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add contents/ui/config.qml
git commit -m "feat: integrate automatic location detection button in config UI"
```
