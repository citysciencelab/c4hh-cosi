# Combined GFI Addon

The Combined GFI (GetFeatureInfo) addon is an extension for the Masterportal that enhances the standard GetFeatureInfo functionality. It allows users to query and display information from multiple layers simultaneously, apply spatial buffers, and export the results in various formats.

## Overview

The Combined GFI addon provides the following key features:

- **Multi-layer Queries**: Query multiple layers at once from a single click or geometry
- **Attribute Aliasing**: Display user-friendly attribute names instead of technical field names
- **Spatial Buffering**: Apply distance buffers to expand the query area
- **Alternative Geometries**: Use geometries from one layer to query features in other layers
- **Export Capabilities**: Export query results to PDF, DOC, and JSON formats
- **Tabular Display**: View results in a paginated table format

## Installation

1. Place the `combinedGfi` folder in the `addons/gfiThemes/` directory of your Masterportal installation.
2. Run `npm install` in the `addons` folder.
3. Register the addon in your Masterportal configuration.

## Configuration

The Combined GFI addon can be configured with the following parameters:

### Complete Configuration Example

Here's a complete example using the recommended nested format:

```json
{
  "gfiTheme": {
    "name": "combinedGfi",
    "params": {
      "showBuffer": true,
      "bufferDistances": [100, 500, 1000],
      "bufferAttributes": {
        "naturschutzgebiete": "showAll"
      },
      "bufferHint": "Beispieltext",
      "export": {
        "fileName": "Naturschutzgebiete",
        "shownFormatList": ["PDF", "DOC", "JSON"]
      },
      "printServerUrl": "https://example.com/mapfish/print/report/buildreport.pdf",
      "layersToRequest": [
        {
          "id": "naturschutzgebiete",
          "gfiAttributes": {
            "gebietsname": "Gebietsname",
            "schutzstatus": "Schutzstatus",
            "flaeche_ha": "Fläche (ha)"
          },
          "wfsQueryBufferSize": 0.00005
        },
        {
          "id": "landschaftsschutzgebiete",
          "gfiAttributes": {
            "name": "Name",
            "typ": "Typ",
            "groesse": "Größe"
          }
        }
      ],
      "additionalRequests": []
    }
  }
}
```

### Layer Configuration

Each layer in the `layersToRequest` array can have the following properties:

- `id`: The ID of the layer to request.
- `gfiAttributes`: GFI attributes configuration. Supports the same options as layer configuration:
  - `"ignore"`: GFI requests disabled for this layer
  - `"showAll"`: All GFI attributes are requested and shown (ignoredKeys will be applied)
  - Object: Key-value pairs for attribute mapping (e.g., `{ "key1": "Display Name 1" }`)
- `wfsQueryBufferSize`: (Optional) The buffer size to use for WFS queries. Default is 0.0001 (in map units). Map units are the units used by the map’s coordinate reference system (CRS)—for example, degrees in EPSG:4326 or meters in EPSG:3857. [Learn more about map units, display units, and location units](https://pro.arcgis.com/en/pro-app/latest/help/mapping/navigation/map-units-location-units-and-display-units.htm)
- `geometryProvider`: (Optional) Configuration for using this layer as a geometry provider for other layers.

Example:

```json
{
  "layersToRequest": [
    {
      "id": "layer1",
      "gfiAttributes": {
        "attr1": "attr1",
        "attr2": "attr2"
      },
      "wfsQueryBufferSize": 0.00005
    },
    {
      "id": "layer2",
      "gfiAttributes": {
        "technical_name": "Display Name",
        "code": "Status Code"
      },
      "wfsQueryBufferSize": 0.0001
    },
    {
      "id": "layer3",
      "gfiAttributes": "showAll"
    },
    {
      "id": "layer4",
      "gfiAttributes": "ignore"
    },
    {
      "id": "geometryLayer",
      "gfiAttributes": {
        "geom_attr": "Geometry"
      },
      "geometryProvider": {
        "geometryAttribute": "geom_attr"
      }
    }
  ]
}
```

### Buffer Configuration

The addon supports spatial buffering to expand the query area:

- `showBuffer`: Boolean to enable/disable the buffer option in the UI.
- `bufferDistances`: An array of buffer distances (in meters) to choose from. If only one option is available, it is automatically chosen upon selecting a feature, and the selection element is hidden.
- `bufferAttributes`: Mapping of layer ids to gfiAttributes. Optional and to be used in case buffered requests are to have diverging attributes from normal requests, or are to be fetched additionally to the usual layers.
- `bufferHint`: Hint text shown below the buffer buttons.

Example:

```json
{
  "showBuffer": true,
  "bufferDistances": [100, 500, 1000],
  "bufferAttributes": {
    "1234": "showAll"
  },
  "bufferHint": "Beispieltext",
}
```

### Additional Requests

You can configure additional requests to be made alongside the layer queries:

- `additionalRequests`: An array of additional request configurations:

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `url` | string | Service URL. |
| `infoText` | string? | If given, this text is additionally shown beneath the service return value. |
| `triggerRequestOn` | enum["init", "queryBuffer"] | The additional request will either fire on every request or only on queryBuffer requests, where an additional area around the target can be defined. |
| `type` | enum["ogcApiProcesses"] | Service type. Currently, only "ogcApiProcesses" are supported. |
| `resultText` | string[]? | If defined, it is assumed that the service return value is json, and that it can be stepped into. For each string in this array, the return object will be stepped into, and the final step should return a displayable string. If not defined in `type` `"ogcApiProcesses"`, it defaults to `["outputs"]`. |
| `processId` | string? | If `type` is `ogcApiProcesses`, this will be used as process id. |
| `staticInputs` | object | If `type` is `ogcApiProcesses`, this will be spread into the request's `inputs` initially. |
| `dynamicInputs` | object | If `type` is `ogcApiProcesses`, this will be used to spread dynamic data into the request's `inputs` initially. |
| `dynamicInputs.getters` | {path: string, key: string}[]? | An optional array of getters. If given, the getter at `path` (as seen from root) will be used as input with name `key`. |
| `dynamicInputs.parsers` | {path: string, key: string}[]? | An optional array of parsers that can be provided via configuration. If given, the javascript file at `path` must direct to a `.js` that has the parser as `module.exports`. The method will be called with the `context` action and may therefore be written like a payloadless action. The response will be used as input with name `key`. |
| `timeout` | number? | If `type` is `ogcApiProcesses`, this many miliseconds will be waited until the service is considered timeouted. |
| `stallFor` | number? | If `type` is `ogcApiProcesses`, this many miliseconds will be waited before a new request. |

Example:

```json
{
  "additionalRequests": [
    {
      "url": "https://gwbfp-text-generation.dsc.dataport.de",
      "infoText": "Die Textgenerierung wird mithilfe von KI erstellt und dient zur schnellen Informationsgewinnung. Bitte prüfen Sie alle automatisch generierten Inhalte sorgfältig, bevor Sie diese weiterverwenden.",
      "resultText": ["outputs", "text"],
      "type": "ogcApiProcesses",
      "processId": "gewerbeflaechenportal.generate_description",
      "triggerRequestOn": "queryBuffer",
      "staticInputs": {
        "kiss me baby": "one more time"
      },
      "dynamicInputs": {
        "getters": [{"path": "Modules/CombinedGfi/jsonData", "key": "getter"}],
        "parsers": [{"path": "./resources/inputsFormatter.js", "key": "parser"}]
      },
      "timeout": 20000,
      "stallFor": 2000
    }
  ]
}
```

### Export Configuration

The addon supports exporting query results in various formats using the nested `export` object:

```json
{
  "export": {
    "fileName": "MyExportFile",
    "shownFormatList": ["PDF", "DOC", "JSON"]
  }
}
```

#### Properties

- `export.fileName`: The default file name for exports.
- `export.shownFormatList`: An array of export formats to display in the UI. Supported formats: "PDF", "DOC", "JSON".

### Print Configuration

The addon supports printing reports through a MapFish print server:

- `printServerUrl`: The URL of the MapFish print server to use for generating reports.

Example:

```json
{
  "printServerUrl": "https://example.com/mapfish/print/report/buildreport.pdf"
}
```

## Usage

### Basic Usage

1. Configure the addon with your desired layers and attributes.
2. Click on the map to query features at that location.
3. View the results in the tabular display.
4. Use the buffer option to expand the query area if needed.
5. Export the results in your preferred format.

### Using Aliases

Aliases allow you to display user-friendly attribute names instead of technical field names:

```json
{
  "gfiAttributes": {
    "gebietsname": "Gebietsname",
    "schutzstatus": "Schutzstatus"
  }
}
```

This will display "Gebietsname" and "Schutzstatus" in the UI instead of "gebietsname" and "schutzstatus".

You can also use translation keys as aliases. The addon will automatically translate these keys using the current language:

```json
{
  "gfiAttributes": {
    "gebietsname": "additional:modules.combinedGfi.attributes.gebietsname",
    "schutzstatus": "additional:modules.combinedGfi.attributes.schutzstatus"
  }
}
```

In this case, the addon will look up the translation keys in the current language's translation files and display the translated text.

### Using Geometry Providers

A geometry provider layer can provide geometries to query other layers:

```json
{
  "id": "administrativeAreas",
  "geometryProvider": {
    "geometryAttribute": "geometry"
  }
}
```

When a user clicks on a feature in this layer, its geometry will be used to query all other configured layers.

### Using the Print Functionality

The Combined GFI addon provides two printing options:

1. **Download Print Request**: This button generates a MapFish print request JSON file that you can manually submit to your MapFish print server or use for debugging.

2. **Direct Print**: This button sends the print request directly to the configured MapFish print server URL and downloads the resulting PDF. The button is labeled "Bericht erstellen" (or its translated equivalent) in the UI.

The direct print functionality requires a valid `printServerUrl` configuration pointing to your MapFish print server endpoint.

## Technical Details

### Supported Layer Types

The addon supports the following layer types:
- WFS (Web Feature Service)
- WMS (Web Map Service)
- ESRI WMS
- OAF (OGC API - Features)

### Query Methods

- **Point Query**: Uses a small buffer around the click point
- **Geometry Query**: Uses a geometry (polygon, line, etc.) to query features
- **Buffer Query**: Applies a distance buffer to expand the query area

### Export Formats

- **PDF**: Portable Document Format for printing
- **DOC**: Microsoft Word compatible format
- **JSON**: JavaScript Object Notation for data interchange

## Troubleshooting

### Multiple Features in WFS Queries

If your WFS queries return too many features, try reducing the `wfsQueryBufferSize` value in your layer configuration. The default is 0.0001, but you can use smaller values like 0.00005 or 0.00001 for more precise queries.

### Missing Attributes

If attributes are missing from the results, check that:
1. The attribute names in your configuration match the actual attribute names in the layer
2. The layer's GetFeatureInfo capability is enabled
3. The attributes are included in the layer's GetFeatureInfo response

## Print Request Structure

The Combined GFI addon includes functionality to generate and send print requests to a MapFish print server. Understanding the structure of these print requests can help you customize and extend the printing capabilities.

### Print Request Basics

The print request is a JSON object that follows the MapFish Print specification. It typically contains:

1. **Layout information** - The template and paper size to use
2. **Map configuration** - Details about the map view, layers, and scales
3. **Feature data** - The GFI feature data to include in tables or text elements
4. **Additional attributes** - Custom attributes for titles, legends, etc.

### Example Print Request Structure

Here's a simplified example of a print request structure:

```json
{
  "layout": "A4 Hochformat",
  "outputFormat": "pdf",
  "attributes": {
            "title": "Flächenbericht",
    "map": {
      "center": [561210, 5932600],
      "dpi": 72,
      "projection": "EPSG:25832",
      "rotation": 0,
      "scale": 10000,
      "layers": [
        {
          "type": "osm",
          "baseURL": "https://tile.openstreetmap.org",
          "opacity": 1
        },
        {
          "type": "geojson",
          "geojson": { /* Feature geometry */ },
          "style": { /* Style definition */ }
        }
      ]
    },
    "dataTable": {
      "data": [
        /* Layer results data */
      ]
    },
    "featureInfo": {
      "layers": [
        {
          "layerName": "WFS_HH_ALKIS_vereinfacht",
          "values": [
            { "key": "Straßenname", "value": "Musterstraße 123" },
            { "key": "Gemarkung", "value": "Hamburg-Altstadt" },
            { "key": "Flurstücksnummer", "value": "12345" }
          ]
        }
      ]
    }
  }
}
```

### The printUtils.js File

**Hinweis:** Die Datei `printUtils.js` muss als CommonJS-Modul exportiert werden, da dynamisches `import()` im Browser nicht unterstützt wird. Verwende daher folgende Export-Syntax:

```javascript
function preparePrintRequest(...) { /* ... */ }
module.exports = { preparePrintRequest };
```

Die Datei wird im Addon per CommonJS-Mechanismus geladen. Ein ES-Module-Export (`export function ...`) funktioniert nicht!

**Pfad-Konfiguration nach Build:**
Nach dem Build müssen die Pfade zu `printUtils.js` und `combinedGfiPrintConfig.json` in der Konfiguration absolut und portal-spezifisch gesetzt werden, z.B.:
```json
"printUtilsPath": "/test/gewerbeflaechen_internetV12/resources/printUtils.js",
"printConfigPath": "/test/gewerbeflaechen_internetV12/resources/combinedGfiPrintConfig.json"
```
Relative Pfade wie `./resources/printUtils.js` funktionieren im Build nicht zuverlässig.

### Sample printUtils.js Implementation

Here's a basic example of what the `printUtils.js` file might contain:

```javascript
/**
 * Prepares a print request for the MapFish print service
 * 
 * @param {Object} olFeature - The OpenLayers feature that was clicked
 * @param {Array} layerResults - The layer results from GFI queries
 * @param {Object} alternativePolygonFeature - Optional alternative geometry to use
 * @param {String} printConfigPath - Path to additional print configuration
 * @returns {Object} - The formatted print request
 */
function preparePrintRequest(olFeature, layerResults, alternativePolygonFeature, printConfigPath) {
  // Load base configuration
  const baseConfig = loadPrintConfig(printConfigPath);
  
  // Get feature geometry
  const geometry = alternativePolygonFeature || olFeature;
  const geojsonFormat = new GeoJSON();
  const geojsonFeature = geojsonFormat.writeFeatureObject(geometry);
  
  // Format layer results for tables
  const tables = formatLayerResultsForPrint(layerResults);
  
  // Build complete request
  return {
    layout: baseConfig.layout || "A4 Hochformat",
    outputFormat: "pdf",
    attributes: {
      title: "Flächenbericht",
      map: {
        center: calculateMapCenter(geometry),
        dpi: 150,
        projection: "EPSG:25832",
        scale: calculateAppropriateScale(geometry),
        layers: [
          // Base layer
          {
            type: "wms",
            baseURL: "https://example.com/wms-service",
            layers: "Geobasiskarten_farbig",
            imageFormat: "image/png",
            opacity: 1
          },
          // Feature highlight
          {
            type: "geojson",
            geojson: geojsonFeature,
            style: {
              version: "2",
              "*": {
                symbolizers: [{
                  type: "polygon",
                  fillColor: "#ff000033",
                  fillOpacity: 0.3,
                  strokeColor: "#ff0000",
                  strokeWidth: 2
                }]
              }
            }
          }
        ]
      },
      dataTable: {
        data: tables
      }
    }
  };
}

/**
 * Formats layer results into a structure suitable for print tables
 * 
 * @param {Array} layerResults - The layer results from GFI queries
 * @returns {Array} - Formatted table data
 */
function formatLayerResultsForPrint(layerResults) {
  return layerResults.map(layer => ({
    title: layer.layerName,
    headers: layer.headers.map(header => header.name),
    rows: layer.rows.map(row => 
      Object.values(row).map(value => value !== null ? value.toString() : "")
    )
  }));
}

/* Additional helper functions... */
```

### Integration with MapFish Print

The print request is sent to a MapFish print server URL specified in the configuration:

```json
{
  "printServerUrl": "https://example.com/mapfish/print/report/buildreport.pdf"
}
```

The MapFish print server must have a compatible template that expects the structure provided by your `printUtils.js` implementation. The template typically includes:

1. A map frame that displays the layers and features
2. Table elements that show the GFI data
3. Text elements for titles and additional information
4. Optional elements like legends, north arrows, etc.

### Customizing the Print Request

To customize the print request:

1. Create your own `printUtils.js` file with a custom `preparePrintRequest` function
2. Configure your MapFish print server with templates that match your data structure
3. Update the `printServerUrl` and `printUtilsPath` in your Combined GFI configuration

Consult the [MapFish Print documentation](https://mapfish.github.io/mapfish-print-doc/) for more details on available options and template configuration.

## Compatibility and Additional Features

### Masterportal Compatibility

This addon has been tested with Masterportal versions 3.x. While it may work with earlier versions, full functionality is only guaranteed with Masterportal 3.0 and above.

### Additional Print Configuration Options

Beyond the `printServerUrl` mentioned earlier, the addon supports additional print configuration:

- `printConfigPath`: Path to a JSON file with print configuration settings (e.g., "./resources/combinedGfiPrintConfig.json")
- `printUtilsPath`: Path to a JavaScript file containing print utility functions (e.g., "./resources/printUtils.js")

Example:

```json
{
  "printServerUrl": "https://example.com/mapfish/print/report/buildreport.pdf",
  "printConfigPath": "./resources/combinedGfiPrintConfig.json",
  "printUtilsPath": "./resources/printUtils.js"
}
```

### Additional Layer Configuration

For OAF (OGC API - Features) layers, you can configure:

- `oafQueryBufferSize`: The buffer size to use for OAF queries. Similar to `wfsQueryBufferSize`, it controls the search area around a point.

Example:

```json
{
  "id": "oaf_layer",
  "attributes": ["attr1", "attr2"],
  "oafQueryBufferSize": 0.0001
}
```

### Pagination

The Combined GFI addon includes built-in pagination for query results with many features. You can configure the number of items per page:

- `itemsPerPage`: The number of features to show per page (default: 5)

Example:

```json
{
  "itemsPerPage": 10
}
```

### Layer Name Display

By default, the addon displays layer names as they are defined in the layer source. You can override this by specifying a custom name in the `layersToRequest` configuration:

```json
{
  "id": "layer1",
  "name": "Custom Display Name",
  "attributes": ["attr1", "attr2"]
}
```

## Konfiguration

Das Addon wird über die `config.json` konfiguriert. Hier ein Beispiel für die Konfiguration:

```json
{
  "gfiTheme": {
    "name": "combinedGfi",
    "params": {
      "printUtilsPath": "./resources/printUtils.js",
      "printConfigPath": "./resources/combinedGfiPrintConfig.json",
      "printServerUrl": "https://gisdemo2.dp.dsecurecloud.de/mapfish/print/report/buildreport.pdf",
      "showBuffer": true,
      "bufferDistances": [100, 500, 1000],
      "bufferAttributes": {
        "6076": "showAll"
      },
      "bufferHint": "Beispieltext",
      "layersToRequest": [
        {
          "id": "6076",
          "name": "Flurstück",
          "hideEmptyAttributeValues": true,
          "geometryProvider": {
            "geometryAttribute": "posList"
          },
          "geometryAttribute": "geometrie",
          "featureType": "ave:Flurstueck",
          "gfiAttributes": {
            "lagebeztxt": "Straßenname(n) und Hausnummer(n)"
          }
        }
      ]
    }
  }
}
```

### Parameter

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `printUtilsPath` | String | Pfad zu den Print-Utilities |
| `printConfigPath` | String | Pfad zur Print-Konfiguration |
| `printServerUrl` | String | URL des Print-Servers |
| `showBuffer` | Boolean | Aktiviert/Deaktiviert die Puffer-Funktion |
| `bufferDistances` | Array | Liste der verfügbaren Puffer-Distanzen in Metern. Wenn es nur eine Option gibt, wird diese bei Auswahl eines Features automatisch gewählt, und das Auswahlelement wird nicht dargestellt. |
| `bufferAttributes` | Object | Mapping von Layer-IDs zu gfiAttributes, die für Buffer-Requests zu nutzen sind. Kann auch für zusätzliche Abfragen, die nur im Buffer-Kontext gebraucht werden, genutzt werden. |
| `bufferHint` | String? | Optionaler Hinweistext, der unter den Buffer-Elementen angezeigt wird. |
| `layersToRequest` | Array | Liste der Layer, die abgefragt werden sollen |

### Layer-Konfiguration

Jeder Layer in `layersToRequest` kann folgende Parameter haben:

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `id` | String | ID des Layers |
| `name` | String | Anzeigename des Layers |
| `hideEmptyAttributeValues` | Boolean | Wenn true, werden leere Attributwerte nicht angezeigt |
| `geometryProvider` | Object | Konfiguration für die Geometrie-Bereitstellung |
| `geometryAttribute` | String | Name des Geometrie-Attributs |
| `featureType` | String | Feature-Typ des Layers im Format `"namespace:FeatureName"` |
| `gfiAttributes` | String/Object | GFI-Attribut-Konfiguration (wie bei Layer-Konfiguration): `"ignore"`, `"showAll"`, Objekt mit Schlüssel-Wert-Paaren |

### Attribut-Konfiguration

Jedes Attribut in der `attributes`-Liste hat folgende Parameter:

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `name` | String | Name des Attributs im Feature |
| `alias` | String | Anzeigename des Attributs |

### Beispiel für eine vollständige Layer-Konfiguration

```json
{
  "id": "32744",
  "name": "Planungsrechtliche Situation",
  "hideEmptyAttributeValues": true,
  "gfiAttributes": {
    "xpPlanName": "Bebauungsplan",
    "text": "Textteil B"
  }
}
```

## Funktionen

### Puffer-Funktion

Die Puffer-Funktion ermöglicht es, einen Puffer um die ausgewählte Geometrie zu erstellen. Die Puffer-Distanzen können in der Konfiguration angepasst werden.

### Print-Funktion

Das Addon unterstützt das Drucken der Feature-Informationen. Dafür werden folgende Dateien benötigt:
- `printUtils.js`: Enthält die Logik für die Print-Request-Erstellung
- `combinedGfiPrintConfig.json`: Enthält die Print-Konfiguration

### Attribut-Anzeige

- Leere Attributwerte können ausgeblendet werden (`hideEmptyAttributeValues: true`)
- URLs werden automatisch als klickbare Links dargestellt
- Attribute können mit benutzerfreundlichen Alias-Namen angezeigt werden

## Best Practices

1. **Attribut-Gruppierung**: Gruppieren Sie verwandte Attribute logisch zusammen
2. **Leere Werte**: Nutzen Sie `hideEmptyAttributeValues` für bessere Übersichtlichkeit
3. **Print-Konfiguration**: Stellen Sie sicher, dass die Print-Pfade korrekt konfiguriert sind
4. **Layer-Namen**: Verwenden Sie aussagekräftige Namen für die Layer

## Fehlerbehandlung

- Fehlende Attribute werden übersprungen
- Fehlerhafte Geometrien werden protokolliert
- Print-Fehler werden dem Benutzer angezeigt
