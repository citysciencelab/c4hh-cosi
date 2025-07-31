/**
 * Utility functions for exporting GFI data in various formats
 */

import {translateKeyIfPossible} from "./translationUtils.js";

/**
 * Exports the data as a CSV file
 * @param {Object} options - The export options
 * @param {Array} options.layerResults - The layer results
 * @param {String} options.fileName - The file name
 * @param {Function} options.setIsLoading - Callback function to set the loading state
 */
export function exportToCSV ({layerResults, fileName, setIsLoading, translations}) {
    setIsLoading(true);
    let csvContent = "\uFEFF";

    layerResults.forEach(layer => {
        csvContent += `${layer.layerName}\n`;

        if (layer.headers.length > 0) {
            const headerRow = layer.headers
                .map(header => {
                    const headerName = header.name?.target || header.name;

                    return typeof headerName === "object" ? translateKeyIfPossible(headerName.alias) || headerName.name : headerName;
                })
                .join(";");

            csvContent += headerRow + "\n";
        }

        layer.rows.forEach(row => {
            const values = layer.headers
                .map(header => {
                    const headerName = header.name?.target || header.name;

                    let key, value;

                    if (typeof headerName === "object") {
                        key = headerName.name;
                    }
                    else {
                        key = headerName;
                    }

                    value = row[key];

                    if (value === undefined && typeof headerName === "object" && headerName.alias) {
                        value = row[headerName.alias];
                    }

                    return value !== undefined ? value : "";
                })
                .join(";");

            csvContent += values + "\n";
        });
        csvContent += "\n";
    });

    const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"}),
        link = document.createElement("a"),
        url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName || translations?.defaultFileName || "Export-File"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsLoading(false);
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

        layer.rows.forEach((row, rowIndex) => {
            htmlContent += `
                <div class="feature-container">
                    <h2 class="feature-title">Feature ${rowIndex + 1}</h2>
                    <table class="attribute-table">
                        <tbody>
            `;

            layer.headers.forEach(header => {
                const headerName = header.name?.target || header.name;
                let displayName, key, value;

                if (typeof headerName === "object") {
                    displayName = translateKeyIfPossible(headerName.alias) || headerName.name;
                    key = headerName.name;
                }
                else {
                    displayName = headerName;
                    key = headerName;
                }

                value = row[key];
                if (value === undefined && typeof headerName === "object" && headerName.alias) {
                    value = row[headerName.alias];
                }

                if (value) {
                    const displayValue = value !== undefined && value !== ""
                        ? String(value).replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/\n/g, "<br>")
                        : `<span class="empty-value">${translations?.noData || "No data"}</span>`;

                    htmlContent += `
                        <tr>
                            <td class="attribute-name">${displayName}</td>
                            <td class="attribute-value">${displayValue}</td>
                        </tr>
                    `;
                }
            });

            htmlContent += `
                        </tbody>
                    </table>
                </div>
            `;
        });
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

    if (!printWindow) {
        console.warn("PDF export failed: Popup blocked or window.open returned null");
        setIsLoading(false);
        return;
    }
    let htmlContent = `
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
                const headerName = header.name?.target || header.name,
                    displayName = typeof headerName === "object" ? translateKeyIfPossible(headerName.alias) || headerName.name : headerName;

                htmlContent += `<th>${displayName}</th>`;
            });
            htmlContent += "</tr>";
        }

        layer.rows.forEach(row => {
            htmlContent += "<tr>";
            layer.headers.forEach(header => {
                const headerName = header.name?.target || header.name;

                let key, value;

                if (typeof headerName === "object") {
                    key = headerName.name;
                }
                else {
                    key = headerName;
                }

                value = row[key];

                if (value === undefined && typeof headerName === "object" && headerName.alias) {
                    value = row[headerName.alias];
                }

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
 * Exports the data as a JSON file
 * @param {Object} options - The export options
 * @param {Array} options.layerResults - The layer results
 * @param {String} options.fileName - The file name
 * @param {Function} options.setIsLoading - Callback function to set the loading state
 */
export function exportToJSON ({layerResults, fileName, setIsLoading, translations}) {
    setIsLoading(true);
    const jsonData = layerResults.map(layer => {
            return {
                layerName: layer.layerName,
                headers: layer.headers.map(header => {
                    const headerName = header.name?.target || header.name;

                    return typeof headerName === "object" ? translateKeyIfPossible(headerName.alias) || headerName.name : headerName;
                }),
                rows: layer.rows.map(row => {
                    const newRow = {};

                    layer.headers.forEach(header => {
                        const headerName = header.name?.target || header.name;

                        let key, displayKey, value;

                        if (typeof headerName === "object") {
                            key = headerName.name;
                            displayKey = translateKeyIfPossible(headerName.alias) || headerName.name;
                        }
                        else {
                            key = headerName;
                            displayKey = headerName;
                        }

                        value = row[key];

                        if (value === undefined && typeof headerName === "object" && headerName.alias) {
                            value = row[headerName.alias];
                        }

                        newRow[displayKey] = value !== undefined ? value : "";
                    });
                    return newRow;
                })
            };
        }),

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
