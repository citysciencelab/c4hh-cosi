# GFI Theme: `waterStatistics`

The `waterStatistics` GFI theme renders a tabbed detail view for a layer feature, combining classic attribute display with a time-series chart ("Ganglinie"), table, CSV export, and PDF export for time-series data such as measuring-station data (e.g. groundwater level stations).

## Top-level structure

| Parameter | Type | Description |
|---|---|---|
| `name` | string | Must be `"waterStatistics"` to activate this GFI theme. |
| `params` | object | Configuration object for the theme, see below. |

```json
"gfiTheme": {
  "name": "waterStatistics",
  "params": {
    "themeTabs": []
  }
}
```

## `params.themeTabs[]`

Defines the tabs shown in the GFI popup/detail view.

| Parameter | Type | Description |
|---|---|---|
| `tabId` | number | Unique numeric identifier of the tab. |
| `title` | string | Tab label shown to the user. |
| `type` | string | Tab content type. Allowed values: `"gfiAttributes"` (renders the standard attribute table from `gfiAttributes`), `"timeline"` (renders chart/table/ view for time-series data including csv and pdf export). |
| `oafParams` | object | OGC API Features connection parameters used to fetch the time series data. |
| `disclaimer` | object | *(only for `type: "timeline"`)* Disclaimer/liability notice shown with the timeline tab. |
| `chartThemes` | array | *(only for `type: "timeline"`)* One or more chart definitions rendered in this tab. |

```json
"themeTabs": [
  {
    "tabId": 1,
    "title": "Stammdaten",
    "type": "gfiAttributes"
  },
  {
    "tabId": 2,
    "title": "Ganglinie",
    "type": "timeline",
    "oafParams": { "...": "see below" },
    "disclaimer": { "...": "see below" },
    "chartThemes": [ "...see below" ]
  }
]
```

## `oafParams`

Connection details for the OGC API Features (OAF) endpoint providing the time-series records.

| Parameter | Type | Description |
|---|---|---|
| `url` | string | Base URL of the OGC API Features service. |
| `collection` | string | Name of the OAF collection/feature type to query. |
| `filterCRS` | string | CRS URI used when constructing spatial/attribute filters against the OAF service. |

```json
"oafParams": {
  "url": "https://api.hamburg.de/datasets/v1/grundwassermessstellen",
  "collection": "grundwassermessstellen",
  "filterCRS": "http://www.opengis.net/def/crs/EPSG/0/25832"
}
```

## `disclaimer`

Legal/liability notice displayed below the timeline data (since it is typically unvalidated raw sensor data).

| Parameter | Type | Description |
|---|---|---|
| `text` | string | Disclaimer text. Supports a `<link>...</link>` placeholder that gets turned into a clickable link pointing to `data`. |
| `data` | string | Path to a JSON file (rendered via a text/block renderer) containing the full disclaimer content shown when the link is clicked. See further description of [disclaimer.json](./disclaimerJson.md). |

```json
"disclaimer": {
  "text": "Ungeprüfte Rohdaten. Bitte beachten Sie den <link>Haftungsausschluss</link>.",
  "data": "./resources/disclaimer.json"
}
```

## `chartThemes[]`

Each entry defines one chart (and its associated table/CSV/PDF export) shown within the timeline tab.

| Parameter | Type | Description |
|---|---|---|
| `chartId` | number | Unique numeric identifier of the chart. |
| `chartTitle` | string | Title shown above the chart. |
| `queryParams` | object | Defines which attributes to request from the OAF and how to filter/sort them, see below. |
| `chartParams` | object | Defines chart axes and value transformations, see below. |
| `tableParams` | string[] | List of attribute names shown as columns in the accompanying data table, in display order. |
| `csvParams` | string[] | List of attribute names included as columns when exporting to CSV in display order. |
| `excludeCsvParams` | string[] | List of attribute names to exclude from the CSV export (used to filter out fields that would otherwise be included). Only use this if csvParams are not specified. |
| `pdfParams` | object | Configuration for PDF export, see below. |

```json
"chartThemes": [
  {
    "chartId": 1,
    "chartTitle": "Wasserstand",
    "queryParams": { "...": "see below" },
    "chartParams": { "...": "see below" },
    "tableParams": [
      "datum_as_date",
      "wasserstand_mnhn",
      "wasserstand_mugok",
      "klassifikation_gwstand"
    ],
    "csvParams": [
      "messstellennummer",
      "messstellenbezeichnung",
      "eigentuemer",
      "baudatum",
      "gok",
      "filteroberkante",
      "filterunterkante",
      "messprogramm",
      "grundwasserleiter",
      "grundwasserleiterzuordnung",
      "grundwasserleiterart",
      "messwertart",
      "datum_as_date",
      "wasserstand_mnhn",
      "wasserstand_mugok",
      "anzahl_messwerte_pro_tag",
      "prz_referenzmonat",
      "klassifikation_gwstand",
      "info"
    ],
    "excludeCsvParams": [],
    "pdfParams": { "...": "see below" }
  }
]
```

### `queryParams`

| Parameter | Type | Description |
|---|---|---|
| `properties` | string[] | Attribute names to request from the OAF service for this chart/table/export. |
| `literalFilters.queryAttribute` | string | Attribute name used to filter/scope the query to the currently selected feature (e.g. the station number). |
| `literalFilters.sortBy` | string | Attribute name used to sort the returned records (typically the date/time attribute). |

```json
"queryParams": {
  "properties": [
    "gid",
    "datum_as_date",
    "messstellennummer",
    "wasserstand_mnhn",
    "wasserstand_mugok",
    "klassifikation_gwstand"
  ],
  "literalFilters": {
    "queryAttribute": "messstellennummer",
    "sortBy": "datum_as_date"
  }
}
```

### `chartParams`

| Parameter | Type | Description |
|---|---|---|
| `xAxis` | string | Attribute name plotted on the x-axis (typically the date attribute). |
| `yAxisLeft` | string | Attribute name plotted on the primary (left) y-axis. |
| `yAxisRight` | string | Attribute name plotted on the secondary (right) y-axis. This axis is optional. Use null to disable this y-axis.|
| `rightAxisTransform.referenceAttribute` | string | Attribute used as reference value for computing the right-axis value (e.g. terrain elevation `gok`). |
| `rightAxisTransform.operator` | string | Arithmetic operator applied between the reference attribute and the source value. Observed value: `"subtract"`. |
| `rightAxisTransform.factor` | number | Multiplier applied as part of the transform calculation. |
| `rightAxisTransform.reverse` | boolean | Defines if the order of the right axis is ascending (false) or descending (true). |
| `percentiles` | string | Path to a JSON file providing percentile/classification bands overlaid on the chart (see below). A descripton about the perzentile.json can be found here [perzentile.json](./perzentileJson.md)|
| `additionalLines.buttonTitle` | string | String to show on the button under the graphic that de-/activates the lines in the graph (optional)
| `additionalLines.pdfLegendTitle` | string | String to show in the legend of the pdf export if the additional lines are shown; will use upper.title if not given (optional)
| `additionalLines.upper` | string | Attribute name plotted as additional grey line in the chart (mandatory)
| `additionalLines.lower` | string | Attribute name plotted as additional grey line in the chart, the space inbetween upper an lower line is filled light grey (optional)

```json
"chartParams": {
  "xAxis": "datum_as_date",
  "yAxisLeft": "wasserstand_mnhn",
  "yAxisRight": "wasserstand_mugok",
  "rightAxisTransform": {
    "referenceAttribute": "gok",
    "operator": "subtract",
    "factor": 1,
    "reverse": true
  },
  "percentiles": "./resources/perzentile.json",
  "additionalLines": {
    "buttonTitle": "Lage der Filterstrecke",
    "pdfLegendTitle": "Filterstrecke",
    "upper": "filteroberkante",
    "lower": "filterunterkante"
  }
}
```

The calculation as configured by rightAxisTransform in the above example would be as follows:
referenceAttribute - (yAxisLeft-datavalue * factor) 

### `pdfParams`

| Parameter | Type | Description |
|---|---|---|
| `titleAttributes` | object | Map of attribute name → `{ "label": string, "postfix": string }`, used to render a title/header block of key attribute values on the exported PDF. The parameter postfix is optional. |
| `useHamburgDesign` | boolean | Whether to apply the Hamburg corporate design template to the PDF export. |
| `base64LogoPath` | string | Path to a text file containing a base64-encoded logo image embedded into the PDF. |

```json
"pdfParams": {
  "titleAttributes": {
    "messstellennummer": {
      "label": "Messstellennummer"
    },
    "gok": {
      "label": "Geländeoberkante",
      "postfix": "m ü. NHN"
    }
  },
  "useHamburgDesign": true,
  "base64LogoPath": "./resources/bukeaLogo_base64.txt"
}
```

## Full example

```json
"gfiTheme": {
  "name": "waterStatistics",
  "params": {
    "themeTabs": [
      {
        "tabId": 1,
        "title": "Stammdaten",
        "type": "gfiAttributes"
      },
      {
        "tabId": 2,
        "title": "Ganglinie",
        "type": "timeline",
        "oafParams": {
          "url": "https://api.hamburg.de/datasets/v1/grundwassermessstellen",
          "collection": "grundwassermessstellen",
          "filterCRS": "http://www.opengis.net/def/crs/EPSG/0/25832"
        },
        "disclaimer": {
          "text": "Ungeprüfte Rohdaten. Bitte beachten Sie den <link>Haftungsausschluss</link>.",
          "data": "./resources/disclaimer.json"
        },
        "chartThemes": [
          {
            "chartId": 1,
            "chartTitle": "Wasserstand",
            "queryParams": {
              "properties": [
                "gid",
                "datum_as_date",
                "messstellennummer",
                "wasserstand_mnhn",
                "wasserstand_mugok",
                "klassifikation_gwstand"
              ],
              "literalFilters": {
                "queryAttribute": "messstellennummer",
                "sortBy": "datum_as_date"
              }
            },
            "chartParams": {
              "xAxis": "datum_as_date",
              "yAxisLeft": "wasserstand_mnhn",
              "yAxisRight": "wasserstand_mugok",
              "rightAxisTransform": {
                "referenceAttribute": "gok",
                "operator": "subtract",
                "factor": 1
              },
              "percentiles": "./resources/perzentile_v3.json"
            },
            "tableParams": [
              "datum_as_date",
              "wasserstand_mnhn",
              "wasserstand_mugok",
              "klassifikation_gwstand"
            ],
            "csvParams": [
              "messstellennummer",
              "messstellenbezeichnung",
              "eigentuemer",
              "baudatum",
              "gok",
              "filteroberkante",
              "filterunterkante",
              "messprogramm",
              "grundwasserleiter",
              "grundwasserleiterzuordnung",
              "grundwasserleiterart",
              "messwertart",
              "datum_as_date",
              "wasserstand_mnhn",
              "wasserstand_mugok",
              "anzahl_messwerte_pro_tag",
              "prz_referenzmonat",
              "klassifikation_gwstand",
              "info"
            ],
            "excludeCsvParams": [],
            "pdfParams": {
              "titleAttributes": {
                "messstellennummer": {
                  "label": "Messstellennummer"
                },
                "gok": {
                  "label": "Geländeoberkante",
                  "unit": "m ü. NHN"
                }
              },
              "useHamburgDesign": true,
              "base64LogoPath": "./resources/bukeaLogo_base64.txt"
            }
          }
        ]
      }
    ]
  }
}
```
