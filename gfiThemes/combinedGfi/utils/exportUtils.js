/**
 * Utility functions for exporting GFI data in various formats
 */

import {translateKeyIfPossible} from "./translationUtils.js";

/**
 * Gets the display name and key from a header
 * @param {Object|string} header - The header object or string
 * @param {Object} row - Optional: The data row to check for available keys
 * @returns {Object} Object with displayName and key properties
 */
function getHeaderInfo (header, row = null) {
    if (typeof header === "object" && header.name) {
        const headerName = header.name;

        if (typeof headerName === "string") {
            if (row && !row[headerName]) {
                const rowKeys = Object.keys(row);

                return {
                    displayName: headerName,
                    key: headerName,
                    actualKey: rowKeys[header.index] || headerName
                };
            }
            return {
                displayName: headerName,
                key: headerName
            };
        }
        else if (typeof headerName === "object") {
            return {
                displayName: translateKeyIfPossible(headerName.alias) || headerName.name,
                key: headerName.name
            };
        }
    }
    else if (typeof header === "string") {
        return {
            displayName: header,
            key: header
        };
    }

    return {
        displayName: String(header),
        key: String(header)
    };
}

/**
 * Gets value from row using the header key
 * @param {Object} row - The data row
 * @param {string} key - The primary key to look up
 * @param {Object|string} header - The original header (for fallback lookup)
 * @returns {any} The value from the row
 */
function getRowValue (row, key, header) {
    if (header && typeof header === "object" && header.index !== undefined) {
        const rowKeys = Object.keys(row),
            valueKey = rowKeys[header.index];

        if (valueKey && row[valueKey] !== undefined) {
            return row[valueKey];
        }
    }
    let value = row[key];

    if (value === undefined && typeof header === "string") {
        value = row[header];
    }

    if (value === undefined && typeof header === "object" && header.name) {
        if (typeof header.name === "string") {
            value = row[header.name];
        }
        else if (typeof header.name === "object") {
            const headerName = header.name;

            if (value === undefined) {
                value = row[headerName.name];
            }
            if (value === undefined && headerName.alias) {
                value = row[headerName.alias];
                if (value === undefined) {
                    const translatedAlias = translateKeyIfPossible(headerName.alias);

                    value = row[translatedAlias];
                }
            }
        }
    }

    if (value === undefined) {
        const {displayName} = getHeaderInfo(header);

        if (displayName !== key) {
            value = row[displayName];
        }
    }

    if (value === undefined && Object.keys(row).length > 0) {
        const rowKeys = Object.keys(row),
            keyLower = key.toLowerCase(),
            matchingKey = rowKeys.find(k => k.toLowerCase() === keyLower);

        if (matchingKey) {
            value = row[matchingKey];
        }
    }

    return value;
}

/**
 * Exports the data as a DOC file
 * @param {Object} options - The export options
 * @param {Array} options.layerResults - The layer results
 * @param {String} options.fileName - The file name
 * @param {Function} options.setIsLoading - Callback function to set the loading state
 */
export function exportToDOC ({layerResults, fileName, setIsLoading, translations}) {
    setIsLoading(true);

    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
          <head>
              <meta charset="utf-8">
              <title>${fileName || translations?.exportAsDoc || "Export as DOC"}</title>
              <style>
                  @page {
                      size: A4;
                      margin: 2cm;
                  }
                  body {
                      font-family: Arial, sans-serif;
                      margin: 20px;
                      line-height: 1.6;
                      font-size: 11pt;
                      width: 100%;
                      max-width: 21cm; /* A4 Breite abzüglich Ränder */
                  }
                  .layer-title {
                      font-size: 14pt;
                      font-weight: bold;
                      color: #003366;
                      margin: 20px 0 10px 0;
                      padding: 5px 0;
                      border-bottom: 2px solid #003366;
                      page-break-after: avoid;
                  }
                  .feature-title {
                      font-size: 12pt;
                      font-weight: bold;
                      color: #666;
                      margin: 15px 0 5px 0;
                      padding: 3px 0;
                      border-bottom: 1px solid #ccc;
                      page-break-after: avoid;
                  }
                  .attribute-table {
                      width: 100%;
                      table-layout: fixed; /* Wichtig für feste Spaltenbreiten */
                      border-collapse: collapse;
                      margin: 5px 0 15px 0;
                      page-break-inside: avoid;
                  }
                  .attribute-table td {
                      padding: 4px 8px;
                      border: 1px solid #e0e0e0;
                      vertical-align: top;
                      word-wrap: break-word; /* Wichtig für Zeilenumbruch */
                      overflow-wrap: break-word; /* Zusätzliche Unterstützung */
                      hyphens: auto; /* Automatische Silbentrennung */
                  }
                  .attribute-name {
                      width: 25%; /* Schmaler für mehr Platz für Werte */
                      background-color: #f8f8f8;
                      font-weight: bold;
                      color: #333;
                  }
                  .attribute-value {
                      width: 75%; /* Mehr Platz für Werte */
                      background-color: #ffffff;
                  }
                  .section-break {
                      height: 1px;
                      background-color: #e0e0e0;
                      margin: 20px 0;
                      page-break-after: always;
                  }
                  .feature-container {
                      margin-bottom: 15px;
                      page-break-inside: avoid;
                      width: 100%;
                  }
                  .empty-value {
                      color: #999;
                      font-style: italic;
                  }
                  /* Zusätzliche Unterstützung für lange URLs und Wörter */
                  .attribute-value {
                      word-break: break-word; /* Bricht sehr lange Wörter um */
                      white-space: pre-wrap; /* Erhält Zeilenumbrüche und Leerzeichen */
                  }
              </style>
          </head>
          <body>
    `;

    layerResults.forEach((layer, layerIndex) => {

        htmlContent += `
            ${layerIndex > 0 ? "<div class=\"section-break\"></div>" : ""}
            <h1 class="layer-title">${layer.layerName}</h1>
        `;

        if (layer.rows && layer.rows.length > 0) {
            layer.rows.forEach((row, rowIndex) => {
                htmlContent += `
                    <div class="feature-container">
                        <h2 class="feature-title">Feature ${rowIndex + 1}</h2>
                        <table class="attribute-table">
                            <tbody>
                `;

                if (layer.headers && layer.headers.length > 0) {
                    const rowKeys = Object.keys(row);

                    layer.headers.forEach(header => {
                        const {displayName, key} = getHeaderInfo(header);
                        let value = getRowValue(row, key, header),
                            displayValue;

                        if (value === undefined && header.index !== undefined && rowKeys[header.index]) {
                            value = row[rowKeys[header.index]];
                        }

                        displayValue = "";

                        if (value !== undefined && value !== null) {
                            if (value === "") {
                                displayValue = `<span class="empty-value">${translations?.noData || "-"}</span>`;
                            }
                            else {
                                displayValue = String(value)
                                    .replace(/&/g, "&amp;")
                                    .replace(/</g, "&lt;")
                                    .replace(/>/g, "&gt;")
                                    .replace(/\n/g, "<br>");
                            }
                        }
                        else {
                            displayValue = `<span class="empty-value">${translations?.noData || "-"}</span>`;
                        }

                        htmlContent += `
                            <tr>
                                <td class="attribute-name">${displayName}</td>
                                <td class="attribute-value">${displayValue}</td>
                            </tr>
                        `;
                    });
                }
                else {
                    Object.keys(row).forEach(key => {
                        const value = row[key];
                        let displayValue = "";

                        if (value !== undefined && value !== null && value !== "") {
                            displayValue = String(value)
                                .replace(/&/g, "&amp;")
                                .replace(/</g, "&lt;")
                                .replace(/>/g, "&gt;")
                                .replace(/\n/g, "<br>");
                        }
                        else {
                            displayValue = `<span class="empty-value">${translations?.noData || "-"}</span>`;
                        }

                        htmlContent += `
                            <tr>
                                <td class="attribute-name">${key}</td>
                                <td class="attribute-value">${displayValue}</td>
                            </tr>
                        `;
                    });
                }

                htmlContent += `
                            </tbody>
                        </table>
                    </div>
                `;
            });
        }
        else {
            htmlContent += `<p style="color: #999; font-style: italic;">${translations?.noData || "Keine Daten verfügbar"}</p>`;
        }
    });

    htmlContent += `
          </body>
      </html>
    `;

    const blob = new Blob([htmlContent], {
            type: "application/msword;charset=utf-8"
        }),
        link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `${fileName || translations?.defaultFileName || "Export-File"}.doc`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    setIsLoading(false);
}

/**
 * Exports the data as a PDF file
 * @param {Object} options - The export options
 * @param {Array} options.layerResults - The layer results
 * @param {String} options.fileName - The file name
 * @param {Function} options.setIsLoading - Callback function to set the loading state
 */
export function exportToPDF ({layerResults, fileName, setIsLoading, translations}) {
    setIsLoading(true);
    const printWindow = window.open("", "PRINT", "height=600,width=800");
    let htmlContent = "";

    if (!printWindow) {
        setIsLoading(false);
        return;
    }

    htmlContent = `
      <html>
          <head>
              <title>${fileName || translations?.exportAsPdf || "Export as PDF"}</title>
              <style>
                  @page {
                      size: landscape;
                      margin: 1cm;
                  }
                  body {
                      font-family: Arial, sans-serif;
                      margin: 20px;
                      line-height: 1.4;
                      font-size: 10pt;
                  }
                  h2 {
                      font-size: 14pt;
                      font-weight: bold;
                      margin-bottom: 10px;
                      border-bottom: 2px solid #000;
                      padding-bottom: 5px;
                      color: #333;
                  }
                  table {
                      width: 100%;
                      margin-bottom: 20px;
                      border-collapse: collapse;
                      table-layout: fixed;
                  }
                  th, td {
                      border: 1px solid #ddd;
                      padding: 6px;
                      text-align: left;
                      word-wrap: break-word;
                      overflow-wrap: break-word;
                      max-width: 150px;
                      font-size: 9pt;
                  }
                  th {
                      background-color: #f4f4f4;
                      font-weight: bold;
                  }
                  td {
                      background-color: #fff;
                  }
                  .section-break {
                      margin-top: 20px;
                      margin-bottom: 20px;
                      height: 2px;
                      background-color: #ccc;
                  }
                  /* Für Tabellen mit vielen Spalten */
                  @media print {
                      .many-columns th, .many-columns td {
                          font-size: 8pt;
                          padding: 4px;
                      }
                  }
              </style>
          </head>
          <body>
    `;

    layerResults.forEach(layer => {
        htmlContent += `<h2>${layer.layerName}</h2>`;

        const tableClass = layer.headers.length > 5 ? "many-columns" : "";

        htmlContent += `<table class="${tableClass}">`;

        if (layer.headers.length > 0) {
            htmlContent += "<tr>";
            layer.headers.forEach(header => {
                const {displayName} = getHeaderInfo(header);

                htmlContent += `<th>${displayName}</th>`;
            });
            htmlContent += "</tr>";
        }

        layer.rows.forEach(row => {
            htmlContent += "<tr>";
            layer.headers.forEach(header => {
                const {key} = getHeaderInfo(header),
                    value = getRowValue(row, key, header);

                htmlContent += `<td>${value !== undefined ? value : ""}</td>`;
            });
            htmlContent += "</tr>";
        });
        htmlContent += "</table>";
        htmlContent += "<div class=\"section-break\"></div>";
    });

    htmlContent += `
          </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    setIsLoading(false);
}

/**
 * Return value formatter.
 * @param {Array} layerResults - The layer results
 * @returns {object} json format usable for export and getter
 */
export function formatJsonData (layerResults) {
    return layerResults.map(layer => {
        return {
            layerName: layer.layerName,
            headers: layer.headers.map(header => {
                const {displayName} = getHeaderInfo(header);

                return displayName;
            }),
            rows: layer.rows.map(row => {
                const newRow = {};

                layer.headers.forEach(header => {
                    const {displayName, key} = getHeaderInfo(header),
                        value = getRowValue(row, key, header);

                    newRow[displayName] = value !== undefined ? value : "";
                });
                return newRow;
            })
        };
    });
}

/**
 * Exports the data as a JSON file
 * @param {Object} options - The export options
 * @param {Array} options.layerResults - The layer results
 * @param {String} options.fileName - The file name
 * @param {Function} options.setIsLoading - Callback function to set the loading state
 */
export function exportToJSON ({layerResults, fileName, setIsLoading, translations}) {
    setIsLoading(true);
    const jsonData = formatJsonData(layerResults),
        blob = new Blob([JSON.stringify(jsonData, null, 2)], {type: "application/json"}),
        link = document.createElement("a"),
        url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName || translations?.defaultFileName || "Export-File"}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsLoading(false);
}
