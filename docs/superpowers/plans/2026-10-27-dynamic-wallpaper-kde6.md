# Dynamic Wallpaper for KDE Plasma 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a native KDE Plasma 6 wallpaper plugin that smoothly transitions desktop backgrounds between images in a folder across four solar phases (Dawn, Day, Sunset, Night) calculated offline.

**Architecture:** Pure declarative QML/JS KPackage (`plasma/wallpaper`). Background rendering and cross-fade animations are managed in `main.qml`, solar timing is computed mathematically offline via NOAA equations in `solar.js`, and settings/image assignments are handled via a native Kirigami UI in `config.qml` with KConfig persistence.

**Tech Stack:** KDE Plasma 6, Qt 6 (QtQuick, QtQuick.Layouts, QtQuick.Dialogs, Qt.labs.folderlistmodel), Kirigami 6, PlasmaComponents3, JavaScript (ES6), `kpackagetool6`.

**Spec:** `docs/superpowers/specs/2026-10-27-dynamic-wallpaper-kde6-design.md`

## Global Constraints

- **Plasma Version:** Targeted strictly for KDE Plasma 6 (Qt 6 / KF6).
- **Zero Binary Compilation:** Pure QML and JavaScript; no C++ compilation steps required.
- **Offline Reliability:** No external HTTP APIs for solar calculations; all astronomical calculations must run locally.
- **Image Compatibility:** Must support standard file formats (JPG, JPEG, PNG, WEBP).
- **Configuration Persistence:** Must use standard Plasma `KConfigXT` schema (`contents/config/main.xml`).

## Review Focus

1. **Extreme Latitudes (Midnight Sun / Polar Night):** Solar formulas must not return `NaN` or crash when the sun never sets or never rises; fallback gracefully to daytime or nighttime.
2. **Missing or Incomplete Image Assignments:** If the user has assigned only 1, 2, or 3 phases, the wallpaper engine must display the closest assigned phase without a black screen.
3. **Invalid or Deleted Folder Path:** If the configured folder is removed or inaccessible, the plugin must remain stable and show a fallback neutral background or placeholder.
4. **Invalid Coordinates Input:** If latitude or longitude inputs are non-numeric or out-of-range (`[-90, 90]`, `[-180, 180]`), values must clamp safely.
5. **Fast Phase Changes / System Resume:** When resuming from suspend across multiple phases, the engine must catch up immediately without queuing redundant transition animations.

---

### Task 1: Package Scaffolding and KConfig Schema

**Files:**
- Create: `metadata.json`
- Create: `contents/config/main.xml`
- Create: `tests/test_metadata.py`

**Interfaces:**
- Produces: KPackage plugin definition (`org.kde.plasma.dynamicwallpaper`) and KConfig keys:
  - `folderPath` (String, default `""`)
  - `imageDawn` (String, default `""`)
  - `imageDay` (String, default `""`)
  - `imageSunset` (String, default `""`)
  - `imageNight` (String, default `""`)
  - `latitude` (Double, default `0.0`)
  - `longitude` (Double, default `0.0`)
  - `transitionDuration` (Int, default `1500`)

- [ ] **Step 1: Write the failing test for metadata and schema structure**

Write `tests/test_metadata.py` checking that:
- `metadata.json` exists, is valid JSON, has `KPlugin.Id = "org.kde.plasma.dynamicwallpaper"`, `KPackageStructure = "Plasma/Wallpaper"`.
- `contents/config/main.xml` exists, is valid XML, and defines all 8 required config keys with correct types.

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 tests/test_metadata.py`
Expected: FAIL (files missing).

- [ ] **Step 3: Implement `metadata.json` and `contents/config/main.xml`**

- Create `metadata.json` with Plasma 6 compliant metadata format.
- Create `contents/config/main.xml` with KConfigXT schema declaring group `General` and the 8 configuration entries.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 tests/test_metadata.py`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add metadata.json contents/config/main.xml tests/test_metadata.py
git commit -m "feat: scaffold plasma 6 wallpaper metadata and kconfig schema"
```

---

### Task 2: Astronomical Solar Engine (`solar.js`)

**Files:**
- Create: `contents/js/solar.js`
- Create: `tests/test_solar.js`

**Interfaces:**
- Produces:
  - `calculateSolarElevation(date: Date, lat: number, lon: number): number` (solar altitude in degrees)
  - `getSolarTimes(date: Date, lat: number, lon: number): { sunrise: Date, sunset: Date, dawn: Date, dusk: Date, solarNoon: Date }`
  - `getCurrentSolarPhase(date: Date, lat: number, lon: number): "dawn" | "day" | "sunset" | "night"`

- [ ] **Step 1: Write the failing tests for solar calculations**

Create `tests/test_solar.js` with Node.js assertions testing:
- Calculation of sunrise, sunset, dawn (-6° civil twilight), and dusk for known coordinates (e.g., Lima -12.04 / -77.03, Madrid 40.41 / -3.70, London 51.50 / -0.12).
- Boundary conditions: Extreme polar latitudes (68°N in December/June) returning valid phases ("night" or "day") without throwing or returning `NaN`.
- Correct phase categorization based on solar elevation angle (Dawn: [-6°, +6°] before noon; Day: > 6°; Sunset: [+6°, -6°] afternoon; Night: < -6°).

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test_solar.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `contents/js/solar.js`**

Implement NOAA standard astronomical solar position algorithms in pure JavaScript (ES6 compatible for Qt 6 QML V4 engine):
- Julian Day and Julian Century calculation.
- Geometric Mean Longitude, Anomaly, and Sun's True Longitude.
- Equation of the Center and Apparent Longitude.
- Mean Obliquity of the Ecliptic and Obliquity Correction.
- Sun Declination and Equation of Time.
- Zenith angle calculations for Official Sunrise/Sunset (90.833°) and Civil Twilight (96°).
- Extreme latitude fallback logic (polar day = "day", polar night = "night").

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test_solar.js`
Expected: PASS (all assertions succeed).

- [ ] **Step 5: Commit**

```bash
git add contents/js/solar.js tests/test_solar.js
git commit -m "feat: implement offline astronomical solar calculation engine"
```

---

### Task 3: Wallpaper Presentation & Cross-Fade View (`main.qml`)

**Files:**
- Create: `contents/ui/main.qml`
- Create: `tests/test_qml_syntax.sh`

**Interfaces:**
- Consumes: `contents/js/solar.js` (`getCurrentSolarPhase`), Plasma `wallpaper.configuration` (`folderPath`, `imageDawn`, `imageDay`, `imageSunset`, `imageNight`, `transitionDuration`).
- Produces: Wallpaper surface visual component conforming to KDE Plasma 6 WallpaperInterface.

- [ ] **Step 1: Write verification script for QML components**

Create `tests/test_qml_syntax.sh` using `qmllint` or `qml6` (or fallback QML parser check) to verify syntax, imports, and component bindings.

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test_qml_syntax.sh`
Expected: FAIL (`main.qml` missing).

- [ ] **Step 3: Implement `contents/ui/main.qml`**

Implement `main.qml` using QtQuick:
- Import `QtQuick`, `QtQuick.Layouts`, and `"../js/solar.js" as SolarEngine`.
- Dual `Image` architecture: `frontImage` and `backImage` with `fillMode: Image.PreserveAspectCrop`.
- `NumberAnimation` on `opacity` for cross-fading over `wallpaper.configuration.transitionDuration`.
- `Timer` running every 60 seconds (and triggered immediately on settings change) evaluating current phase.
- Helper function `resolveImagePath(phase)` resolving full path from `folderPath` + phase image filename, with fallback to any available assigned image if the current phase image is unassigned.
- Instant catch-up logic when time jumps (e.g. system wake) preventing animation backlog.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test_qml_syntax.sh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add contents/ui/main.qml tests/test_qml_syntax.sh
git commit -m "feat: implement wallpaper presentation view with smooth cross-fade"
```

---

### Task 4: Configuration Dialog UI (`config.qml`)

**Files:**
- Create: `contents/ui/config.qml`
- Modify: `tests/test_qml_syntax.sh`

**Interfaces:**
- Consumes: `contents/js/solar.js`, `wallpaper.configuration`.
- Produces: Plasma 6 desktop settings configuration interface with Kirigami.

- [ ] **Step 1: Update QML verification script to include `config.qml`**

Modify `tests/test_qml_syntax.sh` to check `contents/ui/config.qml`.

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test_qml_syntax.sh`
Expected: FAIL (`config.qml` missing).

- [ ] **Step 3: Implement `contents/ui/config.qml`**

Implement `config.qml`:
- Use `Kirigami.FormLayout` and `Kirigami.CardsLayout`.
- Folder selection row with text field, "Examinar..." button, and `FolderDialog` (from `QtQuick.Dialogs`).
- `FolderListModel` from `Qt.labs.folderlistmodel` configured with `folder: cfg_folderPath` and `nameFilters: ["*.jpg", "*.jpeg", "*.png", "*.webp", "*.JPG", "*.PNG"]`.
- Image gallery grid (`GridView` / repeater) showing image thumbnails.
- For each image card:
  - Thumbnail preview.
  - Filename label.
  - Phase assignment controls: action buttons or a `ComboBox` to tag as "Amanecer", "Día", "Atardecer", "Noche", or "Ninguno".
  - Color-coded phase badges identifying active assignments.
- Location & Solar info section:
  - Latitude and Longitude spinboxes/textfields with auto-clamp validation.
  - Live preview labels showing today's calculated Sunrise, Sunset, and current Solar Phase using `solar.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/test_qml_syntax.sh`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add contents/ui/config.qml tests/test_qml_syntax.sh
git commit -m "feat: implement kirigami-based configuration interface"
```

---

### Task 5: End-to-End Package Installation & Verification

**Files:**
- Create: `tests/run_all_tests.sh`
- Create: `Makefile` or `install.sh` for convenient local installation.

**Interfaces:**
- Consumes: All package files (`metadata.json`, `contents/`).
- Produces: Functional installation in `~/.local/share/plasma/wallpapers/org.kde.plasma.dynamicwallpaper`.

- [ ] **Step 1: Write full test runner script `tests/run_all_tests.sh`**

Script runs:
1. `python3 tests/test_metadata.py`
2. `node tests/test_solar.js`
3. `bash tests/test_qml_syntax.sh`

- [ ] **Step 2: Run test suite to verify baseline passes**

Run: `bash tests/run_all_tests.sh`
Expected: PASS (all tests green).

- [ ] **Step 3: Create installation helper script `install.sh`**

Script performs:
- Checks for `kpackagetool6`.
- Uninstalls prior version if present: `kpackagetool6 --type Plasma/Wallpaper --remove org.kde.plasma.dynamicwallpaper`.
- Installs fresh package: `kpackagetool6 --type Plasma/Wallpaper --install .`.
- Displays verification confirmation.

- [ ] **Step 4: Run install script in user environment**

Run: `bash install.sh`
Expected: Success message from `kpackagetool6` indicating `org.kde.plasma.dynamicwallpaper` installed successfully.

- [ ] **Step 5: Commit**

```bash
git add tests/run_all_tests.sh install.sh
git commit -m "feat: add test runner and automated plasma 6 installation script"
```
