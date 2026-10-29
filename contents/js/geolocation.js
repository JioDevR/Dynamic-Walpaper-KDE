/**
 * Geolocation Client (geolocation.js)
 *
 * Lightweight, asynchronous IP geolocation client using standard XMLHttpRequest.
 * Parses and validates geolocation responses (supports ip-api.com, ipapi.co, etc.)
 * with strict error handling and coordinate boundary checks.
 *
 * Compatible with both Node.js unit tests and KDE Plasma 6 QML / QtQuick runtime.
 */

/**
 * Parse and validate raw JSON response text from a geolocation service.
 * @param {string} responseText
 * @returns {{lat: number, lon: number, city: string, country: string}}
 */
function parseLocationResponse(responseText) {
    if (!responseText || typeof responseText !== 'string' || responseText.trim() === '') {
        throw new Error('Invalid response: empty response body');
    }

    var data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        throw new Error('Invalid response: payload is not valid JSON');
    }

    if (!data || typeof data !== 'object') {
        throw new Error('Invalid response: expected JSON object');
    }

    // Check for API-level failure formats (e.g., ip-api.com: { status: "fail", message: "..." })
    if (data.status === 'fail' || data.status === 'error') {
        throw new Error('API returned failure: ' + (data.message || 'Unknown error'));
    }

    var latRaw = (typeof data.lat === 'number') ? data.lat : (typeof data.latitude === 'number' ? data.latitude : parseFloat(data.lat || data.latitude));
    var lonRaw = (typeof data.lon === 'number') ? data.lon : (typeof data.longitude === 'number' ? data.longitude : parseFloat(data.lon || data.longitude));

    if (isNaN(latRaw) || isNaN(lonRaw)) {
        throw new Error('Invalid response: missing or non-numeric coordinates');
    }

    if (latRaw < -90.0 || latRaw > 90.0) {
        throw new Error('Latitude out of range [-90, 90]: ' + latRaw);
    }

    if (lonRaw < -180.0 || lonRaw > 180.0) {
        throw new Error('Longitude out of range [-180, 180]: ' + lonRaw);
    }

    var city = (typeof data.city === 'string') ? data.city : '';
    var country = (typeof data.country === 'string') ? data.country : ((typeof data.country_name === 'string') ? data.country_name : '');

    return {
        lat: latRaw,
        lon: lonRaw,
        city: city,
        country: country
    };
}

/**
 * Fetch geographic coordinates asynchronously via an IP geolocation HTTP request.
 * @param {function(object)} onSuccess Callback invoked with parsed location object
 * @param {function(string)} onError Callback invoked with error message
 * @param {object} [options] Optional configuration (timeout, url)
 */
function fetchLocation(onSuccess, onError, options) {
    options = options || {};
    var timeout = options.timeout || 7000;
    var primaryUrl = options.url || 'https://ip-api.com/json/?fields=status,message,country,city,lat,lon';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', primaryUrl, true);
    xhr.timeout = timeout;

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var result = parseLocationResponse(xhr.responseText);
                    if (typeof onSuccess === 'function') {
                        onSuccess(result);
                    }
                } catch (err) {
                    if (typeof onError === 'function') {
                        onError(err.message || 'Error al procesar la respuesta');
                    }
                }
            } else if (xhr.status > 0) {
                if (typeof onError === 'function') {
                    onError('Error en el servicio de ubicación (HTTP ' + xhr.status + ')');
                }
            }
        }
    };

    xhr.onerror = function() {
        if (typeof onError === 'function') {
            onError('No se pudo conectar al servicio de ubicación. Verifica tu conexión a internet.');
        }
    };

    xhr.ontimeout = function() {
        if (typeof onError === 'function') {
            onError('Tiempo de espera agotado al consultar la ubicación.');
        }
    };

    try {
        xhr.send();
    } catch (e) {
        if (typeof onError === 'function') {
            onError('Error al enviar la solicitud: ' + e.message);
        }
    }
}

// Dual export: CommonJS for Node.js test environment, top-level globals for QML engine
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseLocationResponse: parseLocationResponse,
        fetchLocation: fetchLocation
    };
}
