/**
 * Configuration object which is used to generate the selectedFiletype radio form from.
 * This has to include a regex for each file type, that will be used to determine the
 * filetype when selectedFiletype is "auto".
 * */
export const supportedFiletypes = {
    auto: {
        caption: "common:modules.fileImport.captions.supportedFiletypes.auto"
    },
    kml: {
        caption: "common:modules.fileImport.captions.supportedFiletypes.kml",
        rgx: /\.kml$/i
    },
    gpx: {
        caption: "common:modules.fileImport.captions.supportedFiletypes.gpx",
        rgx: /\.gpx$/i
    },
    geojson: {
        caption: "common:modules.fileImport.captions.supportedFiletypes.geojson",
        rgx: /\.(geo)?json$/i
    }
};
