import QtQuick
import QtQuick.Controls as QQC2
import QtQuick.Layouts
import QtQuick.Dialogs
import Qt.labs.folderlistmodel
import org.kde.kirigami as Kirigami
import "../js/solar.js" as SolarEngine

ColumnLayout {
    id: configRoot
    spacing: Kirigami.Units.largeSpacing
    Layout.fillWidth: true

    // KConfigXT configuration bindings
    property string cfg_folderPath: ""
    property string cfg_imageDawn: ""
    property string cfg_imageDay: ""
    property string cfg_imageSunset: ""
    property string cfg_imageNight: ""
    property real cfg_latitude: 0.0
    property real cfg_longitude: 0.0
    property int cfg_transitionDuration: 1500

    // Internal state for solar calculations preview
    property string previewSunrise: "--:--"
    property string previewSunset: "--:--"
    property string previewCurrentPhase: "Desconocido"

    function updateSolarPreview() {
        var now = new Date();
        try {
            var times = SolarEngine.getSolarTimes(now, cfg_latitude, cfg_longitude);
            if (times && times.sunrise && times.sunset) {
                previewSunrise = times.sunrise.toLocaleTimeString(Qt.locale(), Locale.ShortFormat);
                previewSunset = times.sunset.toLocaleTimeString(Qt.locale(), Locale.ShortFormat);
            } else {
                previewSunrise = "--:--";
                previewSunset = "--:--";
            }
            var phase = SolarEngine.getCurrentSolarPhase(now, cfg_latitude, cfg_longitude);
            switch (phase) {
                case "dawn":
                    previewCurrentPhase = "Amanecer";
                    break;
                case "day":
                    previewCurrentPhase = "Día";
                    break;
                case "sunset":
                    previewCurrentPhase = "Atardecer";
                    break;
                case "night":
                    previewCurrentPhase = "Noche";
                    break;
                default:
                    previewCurrentPhase = phase;
            }
        } catch (e) {
            previewSunrise = "--:--";
            previewSunset = "--:--";
            previewCurrentPhase = "Error";
        }
    }

    onCfg_latitudeChanged: updateSolarPreview()
    onCfg_longitudeChanged: updateSolarPreview()
    Component.onCompleted: updateSolarPreview()

    FolderDialog {
        id: folderDialog
        title: "Seleccionar Carpeta con Fondos de Pantalla"
        currentFolder: configRoot.cfg_folderPath !== "" ? (configRoot.cfg_folderPath.indexOf("file://") === 0 ? configRoot.cfg_folderPath : "file://" + configRoot.cfg_folderPath) : ""
        onAccepted: {
            var selected = folderDialog.selectedFolder.toString();
            if (selected.indexOf("file://") === 0) {
                selected = selected.substring(7);
            }
            configRoot.cfg_folderPath = selected;
        }
    }

    FolderListModel {
        id: imageModel
        folder: {
            if (!configRoot.cfg_folderPath || configRoot.cfg_folderPath.trim() === "") {
                return "";
            }
            var path = configRoot.cfg_folderPath.trim();
            return path.indexOf("file://") === 0 ? path : "file://" + path;
        }
        nameFilters: ["*.jpg", "*.jpeg", "*.png", "*.webp", "*.JPG", "*.JPEG", "*.PNG", "*.WEBP"]
        showDirs: false
    }

    // SECTION 1: Carpeta de imágenes
    Kirigami.FormLayout {
        Layout.fillWidth: true

        RowLayout {
            Kirigami.FormData.label: "Carpeta de Fondos:"
            Layout.fillWidth: true
            spacing: Kirigami.Units.smallSpacing

            QQC2.TextField {
                id: folderField
                Layout.fillWidth: true
                text: configRoot.cfg_folderPath
                placeholderText: "Selecciona una carpeta con imágenes (PNG, JPG, WebP)..."
                onTextChanged: configRoot.cfg_folderPath = text
            }

            QQC2.Button {
                text: "Examinar..."
                icon.name: "document-open-folder"
                onClicked: folderDialog.open()
            }
        }
    }

    // SECTION 2: Galería de imágenes y asignación
    QQC2.Label {
        text: "Imágenes en la carpeta (" + imageModel.count + " detectadas):"
        font.weight: Font.DemiBold
        Layout.leftMargin: Kirigami.Units.largeSpacing
    }

    Rectangle {
        Layout.fillWidth: true
        Layout.preferredHeight: 250
        Layout.leftMargin: Kirigami.Units.largeSpacing
        Layout.rightMargin: Kirigami.Units.largeSpacing
        color: Kirigami.Theme.backgroundColor
        border.color: Kirigami.Theme.alternateBackgroundColor
        border.width: 1
        radius: Kirigami.Units.smallSpacing

        QQC2.Label {
            anchors.centerIn: parent
            text: imageModel.count === 0 ? "No hay imágenes en la carpeta seleccionada o la carpeta no existe." : ""
            visible: imageModel.count === 0
            color: Kirigami.Theme.disabledTextColor
        }

        GridView {
            id: imageGrid
            anchors.fill: parent
            anchors.margins: Kirigami.Units.smallSpacing
            clip: true
            cellWidth: 150
            cellHeight: 180
            model: imageModel

            delegate: Item {
                width: imageGrid.cellWidth
                height: imageGrid.cellHeight

                property string fname: model.fileName ? model.fileName : ""
                property bool isDawn: configRoot.cfg_imageDawn === fname && fname !== ""
                property bool isDay: configRoot.cfg_imageDay === fname && fname !== ""
                property bool isSunset: configRoot.cfg_imageSunset === fname && fname !== ""
                property bool isNight: configRoot.cfg_imageNight === fname && fname !== ""

                Rectangle {
                    anchors.fill: parent
                    anchors.margins: 4
                    color: Kirigami.Theme.alternateBackgroundColor
                    border.color: isDawn ? "#ff9f0a" : (isDay ? "#0a84ff" : (isSunset ? "#ff453a" : (isNight ? "#5e5ce6" : Kirigami.Theme.backgroundColor)))
                    border.width: (isDawn || isDay || isSunset || isNight) ? 2 : 1
                    radius: 4

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 4
                        spacing: 2

                        Image {
                            Layout.fillWidth: true
                            Layout.fillHeight: true
                            source: model.fileUrl ? model.fileUrl : ""
                            fillMode: Image.PreserveAspectCrop
                            asynchronous: true
                            cache: true
                        }

                        QQC2.Label {
                            Layout.fillWidth: true
                            text: fname
                            elide: Text.ElideMiddle
                            font.pixelSize: Kirigami.Units.fontMetrics.font.pixelSize * 0.8
                            horizontalAlignment: Text.AlignHCenter
                        }

                        // Phase assignment ComboBox
                        QQC2.ComboBox {
                            Layout.fillWidth: true
                            model: ["(Sin asignar)", "🌅 Amanecer", "☀️ Día", "🌇 Atardecer", "🌙 Noche"]
                            currentIndex: isDawn ? 1 : (isDay ? 2 : (isSunset ? 3 : (isNight ? 4 : 0)))
                            onActivated: function(index) {
                                if (configRoot.cfg_imageDawn === fname) configRoot.cfg_imageDawn = "";
                                if (configRoot.cfg_imageDay === fname) configRoot.cfg_imageDay = "";
                                if (configRoot.cfg_imageSunset === fname) configRoot.cfg_imageSunset = "";
                                if (configRoot.cfg_imageNight === fname) configRoot.cfg_imageNight = "";

                                if (index === 1) configRoot.cfg_imageDawn = fname;
                                else if (index === 2) configRoot.cfg_imageDay = fname;
                                else if (index === 3) configRoot.cfg_imageSunset = fname;
                                else if (index === 4) configRoot.cfg_imageNight = fname;
                            }
                        }
                    }
                }
            }
        }
    }

    // SECTION 3: Ubicación y Cálculo Solar Offline
    Kirigami.FormLayout {
        Layout.fillWidth: true

        RowLayout {
            Kirigami.FormData.label: "Coordenadas (Lat / Lon):"
            spacing: Kirigami.Units.smallSpacing

            QQC2.TextField {
                id: latField
                text: configRoot.cfg_latitude.toString()
                placeholderText: "Latitud (-90 a 90)"
                implicitWidth: 120
                onTextChanged: {
                    var v = parseFloat(text);
                    if (!isNaN(v) && v >= -90.0 && v <= 90.0) {
                        configRoot.cfg_latitude = v;
                    }
                }
            }

            QQC2.TextField {
                id: lonField
                text: configRoot.cfg_longitude.toString()
                placeholderText: "Longitud (-180 a 180)"
                implicitWidth: 120
                onTextChanged: {
                    var v = parseFloat(text);
                    if (!isNaN(v) && v >= -180.0 && v <= 180.0) {
                        configRoot.cfg_longitude = v;
                    }
                }
            }
        }

        QQC2.SpinBox {
            Kirigami.FormData.label: "Duración de Transición (ms):"
            from: 200
            to: 10000
            stepSize: 250
            value: configRoot.cfg_transitionDuration
            onValueModified: configRoot.cfg_transitionDuration = value
        }

        // Solar info live status
        RowLayout {
            Kirigami.FormData.label: "Información Solar Hoy:"
            spacing: Kirigami.Units.largeSpacing

            QQC2.Label {
                text: "🌅 Salida: " + configRoot.previewSunrise
            }
            QQC2.Label {
                text: "🌇 Puesta: " + configRoot.previewSunset
            }
            QQC2.Label {
                text: "⚡ Fase actual: " + configRoot.previewCurrentPhase
                font.weight: Font.DemiBold
            }
        }
    }
}
