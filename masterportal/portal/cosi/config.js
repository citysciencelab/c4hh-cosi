const Config = {
    addons: ["toggleMouseHover", "dataTable", "exampleSearch", "populationRequest", "schulinfo", "districtSelector", "districtFinder", "accessibilityAnalysis", "dashboard", "featuresList", "distanceScoreService", "colorCodeMap", "areaSelector", "templateAdmin", "templateManager", "saveSession", "calculateRatio", "polygonStyler", "reportingTool", "cosiPrintLayoutSelection", "dipasProjects"],
    ignoredKeys: ["BOUNDEDBY", "SHAPE", "SHAPE_LENGTH", "SHAPE_AREA", "OBJECTID", "GLOBALID", "GEOMETRY", "SHP", "SHP_AREA", "SHP_LENGTH", "GEOM"],
    namedProjections: [
        // ETRS89 UTM
        ["EPSG:4647", "+title=ETRS89_UTM32, EPSG 4647 (zE-N) +proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=32500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"],
        // EPSG: 25832
        ["EPSG:25832", "+title=EPSG 25832 +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
        // ETRS89_3GK3
        ["EPSG:8395", "+title=ETRS89_3GK3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=GRS80 +datum=GRS80 +units=m +no_defs"],
        // EPSG: 8395
        ["EPSG:8395", "+title=EPSG 8395 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +datum=GRS80 +units=m +no_defs"],
        // GK DHDN
        ["EPSG:31467", "+title=DE_DHDN_3GK3, EPSG 31467 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs"],
        // WGS84
        ["EPSG:4326", "+title=WGS84_Lat-Lon (Grad, Minuten, Sekunden), EPSG 4326 +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"]
    ],
    layerConf: "./services.json",
    restConf: "./rest-services.json",
    styleConf: "https://geodienste.hamburg.de/lgv-config/style_v3.json",
    wfsImgPath: "https://geodienste.hamburg.de/lgv-config/img/",
    vuetifyFolder: "cosi",
    overwriteWmsLoadfunction: false,
    portalLanguage: {
        enabled: true,
        debug: false,
        languages: {
            de: "Deutsch",
            en: "English"
        },
        fallbackLanguage: "de",
        changeLanguageOnStartWhen: ["querystring", "localStorage", "htmlTag"]
    }
};

if (typeof module !== "undefined") {
    module.exports = Config;
}


