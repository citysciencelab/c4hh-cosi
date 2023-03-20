import downloadBlobToFile from "./downloadBlobToFile";

/**
 * @description Opens the download/save prompt for given data
 * @param {String} dataUrl - the data to download, encoded as a href URL
 * @param {String} filename - the filename of the file
 * @returns {void}
 */
export function download (dataUrl, filename) {
    const link = document.createElement("a");

    link.setAttribute("href", dataUrl);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * @description downloads a string to a json file
 * @param {Object} json - the json object to download
 * @param {String} filename - the filename of the file
 * @returns {void}
*/
export function downloadJsonToFile (json, filename) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));

    download(dataStr, filename);
}

/**
 * @description downloads a string to a csv file
 * @param {String} string - the string to download
 * @param {String} filename - the filename of the file
 * @returns {void}
*/
export function downloadTextToFile (string, filename) {
    const dataStr = "data:text/plain;charset=utf-8," + encodeURI(string);

    download(dataStr, filename);
}

/**
 * @description downloads a string to a text file
 * @param {String} string - the string to download
 * @param {String} filename - the filename of the file
 * @returns {void}
*/
export function downloadCsvToFile (string, filename) {
    const dataStr = "data:text/csv;charset=utf-8," + encodeURI(string);

    download(dataStr, filename);
}

export default {
    download,
    downloadCsvToFile,
    downloadJsonToFile,
    downloadTextToFile,
    downloadBlobToFile
};
