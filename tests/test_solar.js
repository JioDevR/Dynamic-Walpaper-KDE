/**
 * Unit tests for Astronomical Solar Engine (solar.js)
 * Tests sunrise, sunset, dawn, dusk, elevation, and phase categorization.
 */

const assert = require('assert');
const path = require('path');

// Target module to test
const solarPath = path.resolve(__dirname, '../contents/js/solar.js');
let Solar;
try {
    Solar = require(solarPath);
} catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
        console.error('Module not found:', solarPath);
        process.exit(1);
    }
    throw e;
}

const { calculateSolarElevation, getSolarTimes, getCurrentSolarPhase } = Solar;

console.log('--- Testing Solar Calculations (solar.js) ---');

// Test 1: Interface exports
console.log('Test 1: Interface exports');
assert.strictEqual(typeof calculateSolarElevation, 'function', 'calculateSolarElevation must be a function');
assert.strictEqual(typeof getSolarTimes, 'function', 'getSolarTimes must be a function');
assert.strictEqual(typeof getCurrentSolarPhase, 'function', 'getCurrentSolarPhase must be a function');

// Test 2: Known coordinates solar times
console.log('Test 2: Known coordinates solar times (Lima, Madrid, London)');
const testDate = new Date('2026-10-27T12:00:00Z');

const locations = [
    { name: 'Lima', lat: -12.04, lon: -77.03 },
    { name: 'Madrid', lat: 40.41, lon: -3.70 },
    { name: 'London', lat: 51.50, lon: -0.12 }
];

for (const loc of locations) {
    const times = getSolarTimes(testDate, loc.lat, loc.lon);
    
    // Verify properties exist and are Date instances
    assert.ok(times.sunrise instanceof Date, `${loc.name}: sunrise must be a Date`);
    assert.ok(times.sunset instanceof Date, `${loc.name}: sunset must be a Date`);
    assert.ok(times.dawn instanceof Date, `${loc.name}: dawn must be a Date`);
    assert.ok(times.dusk instanceof Date, `${loc.name}: dusk must be a Date`);
    assert.ok(times.solarNoon instanceof Date, `${loc.name}: solarNoon must be a Date`);

    // Verify chronological order: dawn < sunrise < solarNoon < sunset < dusk
    assert.ok(times.dawn.getTime() < times.sunrise.getTime(), `${loc.name}: dawn must precede sunrise`);
    assert.ok(times.sunrise.getTime() < times.solarNoon.getTime(), `${loc.name}: sunrise must precede solarNoon`);
    assert.ok(times.solarNoon.getTime() < times.sunset.getTime(), `${loc.name}: solarNoon must precede sunset`);
    assert.ok(times.sunset.getTime() < times.dusk.getTime(), `${loc.name}: sunset must precede dusk`);

    // Verify elevations at these specific calculated times match astronomical definitions
    const elevDawn = calculateSolarElevation(times.dawn, loc.lat, loc.lon);
    assert.ok(Math.abs(elevDawn - (-6.0)) < 0.5, `${loc.name}: dawn elevation should be ~ -6°, got ${elevDawn}`);

    const elevSunrise = calculateSolarElevation(times.sunrise, loc.lat, loc.lon);
    assert.ok(Math.abs(elevSunrise - (-0.833)) < 0.5, `${loc.name}: sunrise elevation should be ~ -0.833°, got ${elevSunrise}`);

    const elevSunset = calculateSolarElevation(times.sunset, loc.lat, loc.lon);
    assert.ok(Math.abs(elevSunset - (-0.833)) < 0.5, `${loc.name}: sunset elevation should be ~ -0.833°, got ${elevSunset}`);

    const elevDusk = calculateSolarElevation(times.dusk, loc.lat, loc.lon);
    assert.ok(Math.abs(elevDusk - (-6.0)) < 0.5, `${loc.name}: dusk elevation should be ~ -6°, got ${elevDusk}`);

    const elevNoon = calculateSolarElevation(times.solarNoon, loc.lat, loc.lon);
    assert.ok(elevNoon > 0, `${loc.name}: solar noon elevation must be positive, got ${elevNoon}`);
}

// Test 3: Specific reference times verification
console.log('Test 3: Reference time range verification');
// For Madrid on 2026-10-27:
// Sunrise is expected ~ 06:38 UTC, Sunset ~ 17:19 UTC
const madridTimes = getSolarTimes(testDate, 40.41, -3.70);
const madridSunriseUTCMinutes = madridTimes.sunrise.getUTCHours() * 60 + madridTimes.sunrise.getUTCMinutes();
assert.ok(madridSunriseUTCMinutes >= 390 && madridSunriseUTCMinutes <= 410, `Madrid sunrise UTC expected ~06:38, got ${madridTimes.sunrise.toISOString()}`);
const madridSunsetUTCMinutes = madridTimes.sunset.getUTCHours() * 60 + madridTimes.sunset.getUTCMinutes();
assert.ok(madridSunsetUTCMinutes >= 1030 && madridSunsetUTCMinutes <= 1050, `Madrid sunset UTC expected ~17:19, got ${madridTimes.sunset.toISOString()}`);

// Test 4: Extreme polar latitudes (68°N in December/June)
console.log('Test 4: Polar latitudes handling (68°N)');

// 68°N Winter Solstice (Polar Night)
const winterSolstice = new Date('2026-12-21T12:00:00Z');
const winterElevationNoon = calculateSolarElevation(winterSolstice, 68.0, 18.0);
assert.ok(!Number.isNaN(winterElevationNoon), 'Elevation at 68°N winter noon must not be NaN');
assert.ok(Number.isFinite(winterElevationNoon), 'Elevation at 68°N winter noon must be finite');
assert.ok(winterElevationNoon < 0, `At 68°N in winter solstice, sun should never rise above 0°, got ${winterElevationNoon}`);

const winterTimes = getSolarTimes(winterSolstice, 68.0, 18.0);
assert.ok(!Number.isNaN(winterTimes.solarNoon.getTime()), 'Solar noon must be valid Date in polar night');

// Polar night phases must return 'night' without NaN or throwing
const phaseWinterNoon = getCurrentSolarPhase(winterSolstice, 68.0, 18.0);
assert.strictEqual(phaseWinterNoon, 'night', '68°N winter noon should be classified as night in polar night');
const winterMidnight = new Date('2026-12-21T00:00:00Z');
const phaseWinterMidnight = getCurrentSolarPhase(winterMidnight, 68.0, 18.0);
assert.strictEqual(phaseWinterMidnight, 'night', '68°N winter midnight should be classified as night');

// 68°N Summer Solstice (Polar Day / Midnight Sun)
const summerSolstice = new Date('2026-06-21T12:00:00Z');
const summerElevationNoon = calculateSolarElevation(summerSolstice, 68.0, 18.0);
assert.ok(!Number.isNaN(summerElevationNoon), 'Elevation at 68°N summer noon must not be NaN');
assert.ok(summerElevationNoon > 40, `At 68°N summer noon, elevation should be > 40°, got ${summerElevationNoon}`);

const summerMidnight = new Date('2026-06-21T23:00:00Z');
const summerElevationMidnight = calculateSolarElevation(summerMidnight, 68.0, 18.0);
assert.ok(!Number.isNaN(summerElevationMidnight), 'Elevation at 68°N summer midnight must not be NaN');
assert.ok(summerElevationMidnight > 0, `At 68°N summer midnight, sun stays above horizon (midnight sun), got ${summerElevationMidnight}`);

const summerTimes = getSolarTimes(summerSolstice, 68.0, 18.0);
assert.ok(!Number.isNaN(summerTimes.solarNoon.getTime()), 'Solar noon must be valid Date in polar day');

// Polar day phases must return 'day' without NaN or throwing
const phaseSummerNoon = getCurrentSolarPhase(summerSolstice, 68.0, 18.0);
assert.strictEqual(phaseSummerNoon, 'day', '68°N summer noon should be classified as day in polar day');
const phaseSummerMidnight = getCurrentSolarPhase(summerMidnight, 68.0, 18.0);
assert.strictEqual(phaseSummerMidnight, 'day', '68°N summer midnight should be classified as day in polar day');

// Test 5: Exact Phase Categorization (Dawn, Day, Sunset, Night)
console.log('Test 5: Phase Categorization');

// Madrid 2026-10-27:
// Dawn: ~06:10 UTC (elev ~ -6°)
// Sunrise: ~06:38 UTC (elev ~ -0.8°)
// Elevation reaches +6° around ~07:25 UTC
// Solar noon: ~11:58 UTC (elev ~ 38°)
// Afternoon elevation reaches +6° around ~16:32 UTC
// Sunset: ~17:19 UTC (elev ~ -0.8°)
// Dusk: ~17:47 UTC (elev ~ -6°)
// Night: after 17:47 UTC and before 06:10 UTC

// Deep night (03:00 UTC): elevation < -6° -> 'night'
const tNightEarly = new Date('2026-10-27T03:00:00Z');
assert.ok(calculateSolarElevation(tNightEarly, 40.41, -3.70) < -6, '03:00 UTC elevation should be < -6°');
assert.strictEqual(getCurrentSolarPhase(tNightEarly, 40.41, -3.70), 'night');

// Dawn (06:30 UTC): elevation between -6° and +6°, before solar noon -> 'dawn'
const tDawn = new Date('2026-10-27T06:30:00Z');
const elevDawnTest = calculateSolarElevation(tDawn, 40.41, -3.70);
assert.ok(elevDawnTest >= -6 && elevDawnTest <= 6, `06:30 UTC elevation should be in [-6, 6], got ${elevDawnTest}`);
assert.strictEqual(getCurrentSolarPhase(tDawn, 40.41, -3.70), 'dawn');

// Day (12:00 UTC): elevation > 6° -> 'day'
const tDay = new Date('2026-10-27T12:00:00Z');
assert.ok(calculateSolarElevation(tDay, 40.41, -3.70) > 6, '12:00 UTC elevation should be > 6°');
assert.strictEqual(getCurrentSolarPhase(tDay, 40.41, -3.70), 'day');

// Sunset (17:30 UTC): elevation between -6° and +6°, after solar noon -> 'sunset'
const tSunset = new Date('2026-10-27T17:30:00Z');
const elevSunsetTest = calculateSolarElevation(tSunset, 40.41, -3.70);
assert.ok(elevSunsetTest >= -6 && elevSunsetTest <= 6, `17:30 UTC elevation should be in [-6, 6], got ${elevSunsetTest}`);
assert.strictEqual(getCurrentSolarPhase(tSunset, 40.41, -3.70), 'sunset');

// Late night (22:00 UTC): elevation < -6° -> 'night'
const tNightLate = new Date('2026-10-27T22:00:00Z');
assert.ok(calculateSolarElevation(tNightLate, 40.41, -3.70) < -6, '22:00 UTC elevation should be < -6°');
assert.strictEqual(getCurrentSolarPhase(tNightLate, 40.41, -3.70), 'night');

console.log('All tests passed successfully!');
