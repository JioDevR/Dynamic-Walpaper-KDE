/**
 * Astronomical Solar Engine (solar.js)
 *
 * Implements standard NOAA / Jean Meeus astronomical algorithms to calculate
 * solar position, solar elevation, sunrise, sunset, civil twilight (dawn/dusk),
 * and solar phases ("dawn" | "day" | "sunset" | "night").
 *
 * 100% offline, zero-dependency, compatible with both Node.js unit tests
 * and KDE Plasma 6 QtQuick / QML V4 JavaScript engine.
 */

/**
 * Convert degrees to radians.
 * @param {number} deg
 * @returns {number}
 */
function deg2rad(deg) {
    return deg * (Math.PI / 180.0);
}

/**
 * Convert radians to degrees.
 * @param {number} rad
 * @returns {number}
 */
function rad2deg(rad) {
    return rad * (180.0 / Math.PI);
}

/**
 * Normalize an angle in degrees to [0, 360).
 * @param {number} deg
 * @returns {number}
 */
function normalizeDeg(deg) {
    var d = deg % 360.0;
    if (d < 0) {
        d += 360.0;
    }
    return d;
}

/**
 * Calculate Julian Day from a JavaScript Date (UTC).
 * Unix epoch 1970-01-01 00:00:00 UTC corresponds to JD 2440587.5.
 * @param {Date} date
 * @returns {number}
 */
function getJulianDay(date) {
    return (date.getTime() / 86400000.0) + 2440587.5;
}

/**
 * Calculate Julian Century from Julian Day.
 * Epoch J2000.0 corresponds to JD 2451545.0.
 * @param {number} jd
 * @returns {number}
 */
function getJulianCentury(jd) {
    return (jd - 2451545.0) / 36525.0;
}

/**
 * Calculate NOAA solar parameters for Julian Century T:
 * - Geometric Mean Longitude (L0)
 * - Geometric Mean Anomaly (M)
 * - Eccentricity of Earth's orbit (e)
 * - Equation of the Center (C)
 * - Sun True Longitude & Apparent Longitude (lambda)
 * - Obliquity of the Ecliptic (eps)
 * - Sun Declination (delta)
 * - Equation of Time (eqTime in minutes)
 *
 * @param {number} T - Julian Century
 * @returns {object}
 */
function calculateSolarParams(T) {
    // Geometric Mean Longitude of Sun (deg)
    var L0 = normalizeDeg(280.46646 + T * (36000.76983 + 0.0003032 * T));

    // Geometric Mean Anomaly of Sun (deg)
    var M = 357.52911 + T * (35999.05029 - 0.0001537 * T);

    // Eccentricity of Earth's Orbit
    var e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

    // Sun's Equation of the Center (deg)
    var mRad = deg2rad(M);
    var C = Math.sin(mRad) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
            Math.sin(2.0 * mRad) * (0.019993 - 0.000101 * T) +
            Math.sin(3.0 * mRad) * 0.000289;

    // Sun's True Longitude (deg)
    var sunTrueLong = L0 + C;

    // Sun's Apparent Longitude (deg)
    var omega = 125.04 - 1934.136 * T;
    var lambda = sunTrueLong - 0.00569 - 0.00478 * Math.sin(deg2rad(omega));

    // Mean Obliquity of the Ecliptic (deg)
    var eps0 = 23.0 + (26.0 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60.0) / 60.0;

    // Obliquity Correction (deg)
    var eps = eps0 + 0.00256 * Math.cos(deg2rad(omega));

    // Sun Declination (deg)
    var sinDelta = Math.sin(deg2rad(eps)) * Math.sin(deg2rad(lambda));
    var delta = rad2deg(Math.asin(Math.max(-1.0, Math.min(1.0, sinDelta))));

    // Equation of Time (minutes)
    var y = Math.tan(deg2rad(eps / 2.0));
    y = y * y;
    var l0Rad = deg2rad(L0);
    var eqTime = 4.0 * rad2deg(
        y * Math.sin(2.0 * l0Rad) -
        2.0 * e * Math.sin(mRad) +
        4.0 * e * y * Math.sin(mRad) * Math.cos(2.0 * l0Rad) -
        0.5 * y * y * Math.sin(4.0 * l0Rad) -
        1.25 * e * e * Math.sin(2.0 * mRad)
    );

    return {
        L0: L0,
        M: M,
        e: e,
        delta: delta,
        eqTime: eqTime
    };
}

/**
 * Calculate the hour angle (in degrees) for a given zenith angle.
 * Returns null if the sun never reaches that zenith (polar day / polar night).
 *
 * @param {number} lat - Latitude in degrees
 * @param {number} delta - Solar declination in degrees
 * @param {number} zenith - Solar zenith angle in degrees (e.g. 90.833° for sunrise, 96° for dawn)
 * @returns {number|null} Hour angle in degrees [0, 180] or null
 */
function calculateHourAngle(lat, delta, zenith) {
    var latRad = deg2rad(lat);
    var deltaRad = deg2rad(delta);
    var cosLat = Math.cos(latRad);
    var cosDelta = Math.cos(deltaRad);

    if (Math.abs(cosLat * cosDelta) < 1e-9) {
        // Polar extreme singularity
        return null;
    }

    var cosHA = (Math.cos(deg2rad(zenith)) - Math.sin(latRad) * Math.sin(deltaRad)) / (cosLat * cosDelta);

    if (cosHA > 1.0 || cosHA < -1.0) {
        // Polar night (cosHA > 1) or polar day (cosHA < -1)
        return null;
    }

    return rad2deg(Math.acos(Math.max(-1.0, Math.min(1.0, cosHA))));
}

/**
 * Calculate solar elevation (solar altitude) angle in degrees for a given timestamp and coordinates.
 * Elevation > 0 means sun is above horizon, < 0 means below horizon.
 *
 * @param {Date} date - Timestamp to evaluate
 * @param {number} lat - Latitude in degrees (North positive)
 * @param {number} lon - Longitude in degrees (East positive)
 * @returns {number} Solar elevation in degrees
 */
function calculateSolarElevation(date, lat, lon) {
    var jd = getJulianDay(date);
    var T = getJulianCentury(jd);
    var solar = calculateSolarParams(T);

    // Time in minutes within UTC day
    var timeMinutes = date.getUTCHours() * 60.0 +
                      date.getUTCMinutes() +
                      date.getUTCSeconds() / 60.0 +
                      date.getUTCMilliseconds() / 60000.0;

    // True Solar Time in minutes
    var trueSolarTime = (timeMinutes + solar.eqTime + 4.0 * lon) % 1440.0;
    if (trueSolarTime < 0) {
        trueSolarTime += 1440.0;
    }

    // Solar Hour Angle in degrees (-180° to +180°)
    var hourAngle = trueSolarTime / 4.0 - 180.0;
    if (hourAngle < -180.0) {
        hourAngle += 360.0;
    }

    var latRad = deg2rad(lat);
    var deltaRad = deg2rad(solar.delta);
    var haRad = deg2rad(hourAngle);

    var cosZenith = Math.sin(latRad) * Math.sin(deltaRad) +
                    Math.cos(latRad) * Math.cos(deltaRad) * Math.cos(haRad);
    cosZenith = Math.max(-1.0, Math.min(1.0, cosZenith));

    var zenith = rad2deg(Math.acos(cosZenith));
    return 90.0 - zenith;
}

/**
 * Calculate solar event times for the date and coordinates:
 * - sunrise: Official sunrise (zenith = 90.833°)
 * - sunset: Official sunset (zenith = 90.833°)
 * - dawn: Civil twilight dawn (zenith = 96.0°)
 * - dusk: Civil twilight dusk (zenith = 96.0°)
 * - solarNoon: Solar meridian transit
 *
 * During polar night / polar day, events that do not occur return null safely without throwing.
 *
 * @param {Date} date - Target date
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @returns {{ sunrise: Date|null, sunset: Date|null, dawn: Date|null, dusk: Date|null, solarNoon: Date }}
 */
function getSolarTimes(date, lat, lon) {
    // Base UTC midnight for the requested calendar date
    var baseDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));

    // Approximate solar noon UTC to sample solar parameters
    var approxNoonMinutes = 720.0 - 4.0 * lon;
    var approxNoonDate = new Date(baseDate.getTime() + approxNoonMinutes * 60000.0);
    var jdNoon = getJulianDay(approxNoonDate);
    var TNoon = getJulianCentury(jdNoon);
    var solarNoonParams = calculateSolarParams(TNoon);

    // Exact solar noon in UTC minutes from UTC midnight
    var solarNoonUTCMinutes = 720.0 - 4.0 * lon - solarNoonParams.eqTime;
    var solarNoon = new Date(baseDate.getTime() + Math.round(solarNoonUTCMinutes * 60000.0));

    // Hour angles for official rise/set (90.833°) and civil twilight (96°)
    var haRise = calculateHourAngle(lat, solarNoonParams.delta, 90.833);
    var haCivil = calculateHourAngle(lat, solarNoonParams.delta, 96.0);

    var sunrise = haRise !== null
        ? new Date(baseDate.getTime() + Math.round((solarNoonUTCMinutes - haRise * 4.0) * 60000.0))
        : null;

    var sunset = haRise !== null
        ? new Date(baseDate.getTime() + Math.round((solarNoonUTCMinutes + haRise * 4.0) * 60000.0))
        : null;

    var dawn = haCivil !== null
        ? new Date(baseDate.getTime() + Math.round((solarNoonUTCMinutes - haCivil * 4.0) * 60000.0))
        : null;

    var dusk = haCivil !== null
        ? new Date(baseDate.getTime() + Math.round((solarNoonUTCMinutes + haCivil * 4.0) * 60000.0))
        : null;

    return {
        sunrise: sunrise,
        sunset: sunset,
        dawn: dawn,
        dusk: dusk,
        solarNoon: solarNoon
    };
}

/**
 * Determine the current solar phase for the given timestamp and location:
 * - "dawn": Solar elevation between [-6°, +6°] before solar noon
 * - "day": Solar elevation > 6° (or 24h polar day fallback)
 * - "sunset": Solar elevation between [+6°, -6°] after solar noon
 * - "night": Solar elevation < -6° (or 24h polar night fallback)
 *
 * Handles extreme polar latitudes safely without returning NaN or throwing.
 *
 * @param {Date} date - Timestamp to evaluate
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @returns {"dawn" | "day" | "sunset" | "night"}
 */
function getCurrentSolarPhase(date, lat, lon) {
    var jd = getJulianDay(date);
    var T = getJulianCentury(jd);
    var solar = calculateSolarParams(T);

    // Extreme polar latitude check:
    // Determine whether the location is experiencing 24h polar day or polar night
    var latRad = deg2rad(lat);
    var deltaRad = deg2rad(solar.delta);
    var cosLat = Math.cos(latRad);
    var cosDelta = Math.cos(deltaRad);

    if (Math.abs(cosLat * cosDelta) >= 1e-9) {
        var cosHARise = (Math.cos(deg2rad(90.833)) - Math.sin(latRad) * Math.sin(deltaRad)) / (cosLat * cosDelta);
        if (cosHARise > 1.0) {
            // Polar night: Sun never rises above official horizon
            return "night";
        }
        if (cosHARise < -1.0) {
            // Polar day: Sun never sets below official horizon
            return "day";
        }
    } else {
        // At exact geographical pole:
        if (lat > 0) {
            return solar.delta >= 0 ? "day" : "night";
        } else {
            return solar.delta <= 0 ? "day" : "night";
        }
    }

    // Time in minutes within UTC day
    var timeMinutes = date.getUTCHours() * 60.0 +
                      date.getUTCMinutes() +
                      date.getUTCSeconds() / 60.0 +
                      date.getUTCMilliseconds() / 60000.0;

    var trueSolarTime = (timeMinutes + solar.eqTime + 4.0 * lon) % 1440.0;
    if (trueSolarTime < 0) {
        trueSolarTime += 1440.0;
    }

    var hourAngle = trueSolarTime / 4.0 - 180.0;
    if (hourAngle < -180.0) {
        hourAngle += 360.0;
    }

    var haRad = deg2rad(hourAngle);
    var cosZenith = Math.sin(latRad) * Math.sin(deltaRad) +
                    cosLat * cosDelta * Math.cos(haRad);
    cosZenith = Math.max(-1.0, Math.min(1.0, cosZenith));
    var zenith = rad2deg(Math.acos(cosZenith));
    var elevation = 90.0 - zenith;

    // Phase categorization
    if (elevation > 6.0) {
        return "day";
    }
    if (elevation < -6.0) {
        return "night";
    }

    // In [-6°, +6°] interval:
    // hourAngle < 0 corresponds to morning (sun ascending toward solar noon)
    // hourAngle >= 0 corresponds to afternoon (sun descending from solar noon)
    return (hourAngle < 0) ? "dawn" : "sunset";
}

// Dual export: CommonJS for Node.js test environment, top-level globals for QML engine
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateSolarElevation: calculateSolarElevation,
        getSolarTimes: getSolarTimes,
        getCurrentSolarPhase: getCurrentSolarPhase
    };
}
