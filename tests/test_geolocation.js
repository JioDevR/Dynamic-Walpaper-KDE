/**
 * Unit tests for geolocation response parsing and validation (geolocation.js)
 */

const assert = require('assert');
const GeoClient = require('../contents/js/geolocation.js');

console.log('--- Testing Geolocation Client (geolocation.js) ---');

// Test 1: Interface exports
console.log('Test 1: Interface exports');
assert.strictEqual(typeof GeoClient.parseLocationResponse, 'function', 'parseLocationResponse should be a function');
assert.strictEqual(typeof GeoClient.fetchLocation, 'function', 'fetchLocation should be a function');

// Test 2: Parse valid ip-api.com response
console.log('Test 2: Parse valid ip-api.com response');
const ipApiResponse = JSON.stringify({
    status: "success",
    country: "Spain",
    city: "Madrid",
    lat: 40.4168,
    lon: -3.7038
});
const parsedIpApi = GeoClient.parseLocationResponse(ipApiResponse);
assert.strictEqual(parsedIpApi.lat, 40.4168, 'Latitude should match');
assert.strictEqual(parsedIpApi.lon, -3.7038, 'Longitude should match');
assert.strictEqual(parsedIpApi.city, "Madrid", 'City should match');
assert.strictEqual(parsedIpApi.country, "Spain", 'Country should match');

// Test 3: Parse valid ipapi.co response
console.log('Test 3: Parse valid ipapi.co response');
const ipapiCoResponse = JSON.stringify({
    latitude: -12.0464,
    longitude: -77.0428,
    city: "Lima",
    country_name: "Peru"
});
const parsedIpapiCo = GeoClient.parseLocationResponse(ipapiCoResponse);
assert.strictEqual(parsedIpapiCo.lat, -12.0464, 'Latitude should match');
assert.strictEqual(parsedIpapiCo.lon, -77.0428, 'Longitude should match');
assert.strictEqual(parsedIpapiCo.city, "Lima", 'City should match');
assert.strictEqual(parsedIpapiCo.country, "Peru", 'Country should match');

// Test 4: Reject API error format
console.log('Test 4: Reject API error format');
const errorResponse = JSON.stringify({
    status: "fail",
    message: "invalid query"
});
assert.throws(() => {
    GeoClient.parseLocationResponse(errorResponse);
}, /invalid query|API returned failure/i, 'Should throw error when API status is fail');

// Test 5: Reject malformed JSON or empty string
console.log('Test 5: Reject malformed JSON or empty string');
assert.throws(() => {
    GeoClient.parseLocationResponse("");
}, /Invalid response/i, 'Should throw error on empty response');

assert.throws(() => {
    GeoClient.parseLocationResponse("<html>Not Found</html>");
}, /Invalid response|JSON/i, 'Should throw error on non-JSON response');

// Test 6: Reject out-of-range coordinates
console.log('Test 6: Reject out-of-range coordinates');
const outOfRangeLat = JSON.stringify({ status: "success", lat: 100.5, lon: -3.7 });
assert.throws(() => {
    GeoClient.parseLocationResponse(outOfRangeLat);
}, /Latitude out of range/i, 'Should throw error when lat > 90');

const outOfRangeLon = JSON.stringify({ status: "success", lat: 40.5, lon: 200.0 });
assert.throws(() => {
    GeoClient.parseLocationResponse(outOfRangeLon);
}, /Longitude out of range/i, 'Should throw error when lon > 180');

console.log('All geolocation tests passed successfully!');
