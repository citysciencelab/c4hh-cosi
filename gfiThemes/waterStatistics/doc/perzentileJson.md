# Perzentile JSON Format (`perzentile_v3.json`)

This file provides monthly percentile classification bands per measuring station, used by the `waterStatistics` GFI theme to overlay/classify chart values.

## Top-level structure

| Parameter | Type | Description |
|---|---|---|
| `data` | array | List of percentile datasets, one entry per feature/ measuring station. |

```json
{
  "data": []
}
```

## Station entries (`data[]`)

| Parameter | Type | Description |
|---|---|---|
| `messstellennummer` | number | Station identifier, used to match the dataset to the currently selected feature/station. This identifier must match the value set in literalFilters.queryAttribute in the config.json for the gfiTheme in the gfiTheme settings. Both the content and the spelling must match. |
| `perzentile` | array | List of percentile classification bands, one entry per reference month. |

```json
{
  "messstellennummer": 43,
  "perzentile": []
}
```

## Percentile entries (`perzentile[]`)

Each entry defines percentile/classification thresholds for one calendar reference month, used to classify a measured value (e.g. groundwater level) into a category and assign it a display color. Needed are:

RZ_REFERENCE_MONTH

and then any combination of

KEY – to set the threshold value, i.e. P10

KEY_DESCR – to set the text to be displayed in the chart's legend, i.e. P10_DESCR

KEY_HEX – to set the colour of the line in the chart, i.e. P10_HEX

Ideally, the two percentiles P10 and P90 should be included so that the chart can be scaled accordingly. However, any additional percentiles can be defined, provided the syntax of the keys is followed.


| Parameter | Type | Description |
|---|---|---|
| `PRZ_REFERENZMONAT` | string | Two-digit reference month (`"01"`–`"12"`) this set of thresholds applies to. |
| `MIN` | number | Minimum observed value threshold. |
| `MIN_DESCR` | string | Classification label for values below `MIN` (e.g. `"unterhalb Minimum"`). |
| `MIN_HEX` | string | Hex color (without `#`) used to represent the `MIN`/below-minimum classification. |
| `P10` | number | 10th percentile threshold. |
| `P10_DESCR` | string | Classification label for the `P10` band (e.g. `"sehr niedrig"`). |
| `P10_HEX` | string | Hex color for the `P10` classification. |
| `P25` | number | 25th percentile threshold. |
| `P25_DESCR` | string | Classification label for the `P25` band (e.g. `"niedrig"`). |
| `P25_HEX` | string | Hex color for the `P25` classification. |
| `P75` | number | 75th percentile threshold. |
| `P75_DESCR` | string | Classification label for the `P75` band (e.g. `"hoch"`). |
| `P75_HEX` | string | Hex color for the `P75` classification. |
| `P90` | number | 90th percentile threshold. |
| `P90_DESCR` | string | Classification label for the `P90` band (e.g. `"sehr hoch"`). |
| `P90_HEX` | string | Hex color for the `P90` classification. |
| `MAX` | number | Maximum observed value threshold. |
| `MAX_DESCR` | string | Classification label for values above `MAX` (e.g. `"oberhalb Maximum"`). |
| `MAX_HEX` | string | Hex color for the `MAX`/above-maximum classification. |

The bands effectively define six classification ranges per month: below `MIN`, `MIN`–`P10`, `P10`–`P25`, `P25`–`P75`, `P75`–`P90`, `P90`–`MAX`, and above `MAX` — each with its own descriptive label and color used to visually classify the plotted value.

```json
{
  "PRZ_REFERENZMONAT": "01",
  "MIN": 9.68,
  "MIN_DESCR": "unterhalb Minimum",
  "MIN_HEX": "A900E6",
  "P10": 9.99,
  "P10_DESCR": "sehr niedrig",
  "P10_HEX": "FF0000",
  "P25": 10.13,
  "P25_DESCR": "niedrig",
  "P25_HEX": "FFFF00",
  "P75": 10.47,
  "P75_DESCR": "hoch",
  "P75_HEX": "00C5FF",
  "P90": 10.63,
  "P90_DESCR": "sehr hoch",
  "P90_HEX": "005CE6",
  "MAX": 10.92,
  "MAX_DESCR": "oberhalb Maximum",
  "MAX_HEX": "4C0073"
}
```

## Full example

```json
{
  "data": [
    {
      "messstellennummer": 43,
      "perzentile": [
        {
          "PRZ_REFERENZMONAT": "01",
          "MIN": 9.68,
          "MIN_DESCR": "unterhalb Minimum",
          "MIN_HEX": "A900E6",
          "P10": 9.99,
          "P10_DESCR": "sehr niedrig",
          "P10_HEX": "FF0000",
          "P25": 10.13,
          "P25_DESCR": "niedrig",
          "P25_HEX": "FFFF00",
          "P75": 10.47,
          "P75_DESCR": "hoch",
          "P75_HEX": "00C5FF",
          "P90": 10.63,
          "P90_DESCR": "sehr hoch",
          "P90_HEX": "005CE6",
          "MAX": 10.92,
          "MAX_DESCR": "oberhalb Maximum",
          "MAX_HEX": "4C0073"
        },
        {
          "PRZ_REFERENZMONAT": "02",
          "MIN": 9.68,
          "MIN_DESCR": "unterhalb Minimum",
          "MIN_HEX": "A900E6",
          "P10": 9.96,
          "P10_DESCR": "sehr niedrig",
          "P10_HEX": "FF0000",
          "P25": 10.08,
          "P25_DESCR": "niedrig",
          "P25_HEX": "FFFF00",
          "P75": 10.53,
          "P75_DESCR": "hoch",
          "P75_HEX": "00C5FF",
          "P90": 10.68,
          "P90_DESCR": "sehr hoch",
          "P90_HEX": "005CE6",
          "MAX": 10.92,
          "MAX_DESCR": "oberhalb Maximum",
          "MAX_HEX": "4C0073"
        }
      ]
    }
  ]
}
```
