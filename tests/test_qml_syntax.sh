#!/bin/bash
set -e

MAIN_QML="contents/ui/main.qml"
CONFIG_QML="contents/ui/config.qml"

for FILE in "$MAIN_QML" "$CONFIG_QML"; do
    if [ ! -f "$FILE" ]; then
        echo "FAIL: $FILE does not exist"
        exit 1
    fi
    echo "Verifying $FILE syntax..."
    qmllint "$FILE"
done

echo "PASS: All QML files verified successfully"
