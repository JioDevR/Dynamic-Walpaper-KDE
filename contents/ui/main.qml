import QtQuick
import QtQuick.Layouts
import org.kde.plasma.plasmoid
import "../js/solar.js" as SolarEngine

WallpaperItem {
    id: root

    // Plasma 6 provides 'root.configuration' through WallpaperItem
    readonly property var config: (root.configuration) ? root.configuration : fallbackConfig

    QtObject {
        id: fallbackConfig
        property string folderPath: ""
        property string imageDawn: ""
        property string imageDay: ""
        property string imageSunset: ""
        property string imageNight: ""
        property real latitude: 0.0
        property real longitude: 0.0
        property int transitionDuration: 1500
    }

    property string currentPhase: ""
    property string currentSource: ""
    property double lastCheckTimestamp: 0.0
    property bool isInitialized: false

    // Background layer (always holds current or incoming base)
    Image {
        id: backImage
        anchors.fill: parent
        fillMode: Image.PreserveAspectCrop
        asynchronous: true
        cache: true
        smooth: true
    }

    // Foreground layer (used for cross-fade transitions)
    Image {
        id: frontImage
        anchors.fill: parent
        fillMode: Image.PreserveAspectCrop
        asynchronous: true
        cache: true
        smooth: true
        opacity: 0.0

        Behavior on opacity {
            NumberAnimation {
                id: fadeAnimation
                duration: root.config ? root.config.transitionDuration : 1500
                easing.type: Easing.InOutQuad

                onRunningChanged: {
                    if (!running && frontImage.opacity === 1.0) {
                        // Cross-fade complete: transfer source to back layer and reset front
                        backImage.source = frontImage.source;
                        frontImage.opacity = 0.0;
                    }
                }
            }
        }
    }

    // Periodic evaluation timer (checks every 60 seconds)
    Timer {
        id: phaseTimer
        interval: 60000
        running: true
        repeat: true
        triggeredOnStart: false
        onTriggered: root.updateWallpaper(false)
    }

    function formatFolderUrl(path) {
        if (!path || path.trim() === "") {
            return "";
        }
        var p = path.trim();
        if (p.indexOf("file://") === 0) {
            return p.endsWith("/") ? p : p + "/";
        }
        return (p.endsWith("/") ? "file://" + p : "file://" + p + "/");
    }

    function resolveImagePath(phase) {
        if (!config) {
            return "";
        }

        var folder = formatFolderUrl(config.folderPath);
        if (folder === "") {
            return "";
        }

        var filename = "";
        switch (phase) {
            case "dawn":
                filename = config.imageDawn;
                break;
            case "day":
                filename = config.imageDay;
                break;
            case "sunset":
                filename = config.imageSunset;
                break;
            case "night":
                filename = config.imageNight;
                break;
        }

        // Fallback: If requested phase image is not assigned, fall back to any assigned image
        if (!filename || filename.trim() === "") {
            var fallbacks = [config.imageDay, config.imageSunset, config.imageDawn, config.imageNight];
            for (var i = 0; i < fallbacks.length; ++i) {
                if (fallbacks[i] && fallbacks[i].trim() !== "") {
                    filename = fallbacks[i];
                    break;
                }
            }
        }

        if (!filename || filename.trim() === "") {
            return "";
        }

        return folder + filename;
    }

    function updateWallpaper(immediate) {
        var now = new Date();
        var currentMs = now.getTime();
        var timeJump = (root.lastCheckTimestamp > 0 && (currentMs - root.lastCheckTimestamp) > 180000);
        root.lastCheckTimestamp = currentMs;

        var lat = config ? config.latitude : 0.0;
        var lon = config ? config.longitude : 0.0;
        var newPhase = SolarEngine.getCurrentSolarPhase(now, lat, lon);
        root.currentPhase = newPhase;

        var newSource = resolveImagePath(newPhase);
        if (!newSource || newSource === "") {
            return;
        }

        if (newSource === root.currentSource && root.isInitialized) {
            return;
        }

        root.currentSource = newSource;

        // If initial load or waking up from long system sleep, switch instantly
        if (!root.isInitialized || immediate || timeJump) {
            fadeAnimation.stop();
            frontImage.opacity = 0.0;
            backImage.source = newSource;
            root.isInitialized = true;
            return;
        }

        // Smooth cross-fade transition
        frontImage.opacity = 0.0;
        frontImage.source = newSource;
        frontImage.opacity = 1.0;
    }

    // React to configuration changes dynamically
    Connections {
        target: root.config
        function onFolderPathChanged() { root.updateWallpaper(true); }
        function onImageDawnChanged() { root.updateWallpaper(false); }
        function onImageDayChanged() { root.updateWallpaper(false); }
        function onImageSunsetChanged() { root.updateWallpaper(false); }
        function onImageNightChanged() { root.updateWallpaper(false); }
        function onLatitudeChanged() { root.updateWallpaper(false); }
        function onLongitudeChanged() { root.updateWallpaper(false); }
    }

    Component.onCompleted: {
        root.updateWallpaper(true);
    }
}
