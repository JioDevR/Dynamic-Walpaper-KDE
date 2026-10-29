#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=== 1. Testing Metadata & KConfigXT Schema ==="
python3 tests/test_metadata.py

echo ""
echo "=== 2. Testing Astronomical Solar Engine (solar.js) ==="
node tests/test_solar.js

echo ""
echo "=== 3. Testing Geolocation Client (geolocation.js) ==="
node tests/test_geolocation.js

echo ""
echo "=== 4. Testing QML Syntax & Components (qmllint) ==="
bash tests/test_qml_syntax.sh

echo ""
echo "=== All Tests Passed Successfully! ==="
