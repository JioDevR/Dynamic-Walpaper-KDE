#!/bin/bash
set -e

MAIN_QML="contents/ui/main.qml"

if [ ! -f "$MAIN_QML" ]; then
    echo "FAIL: $MAIN_QML does not exist"
    exit 1
fi

echo "Verifying $MAIN_QML syntax..."
qmllint "$MAIN_QML"

echo "PASS: $MAIN_QML verified successfully"
