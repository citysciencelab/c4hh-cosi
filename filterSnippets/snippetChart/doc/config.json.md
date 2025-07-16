# config.json 3.0
## Datatypes
### Datatypes Snippets [componentName: `snippetChart`]

|Name|Required|Type|Default|Description|Expert|
|----|--------|----|-------|-----------|------|
|type|yes|String||The type of the snippet. This documentation refers to the type `customComponent`.|true|
|componentName|yes|String||The name of the component. This documentation refers to the componentName `snippetChart`.|true|
|||||||
|alternativeTextForEmptyChart|no|String||Alternative text displayed instead of the chart if it contains no values.|false|
|chartConfig|yes|**[chartConfig](#datatypessnippetschartconfig)**||In conjunction with 'service' (see example): The configuration for the chart. All configuration options (currently only "type: bar") from Chart.js are supported (see: https://www.chartjs.org/docs/latest/configuration/). Additionally, the parameter 'featureAttributes' is required. This parameter specifies which attributes contain the data to be displayed (see example).|false|
|infoText|no|String|false|Info text for this snippet.|false|
|subtitle|no|String[]/String[][]||Allows displaying any combination of text and data as a subtitle for the chart.|false|
|tooltipUnit|no|String||Adds a unit symbol to the numeric value in the tooltip.|false|

**Example**

Example of a chart snippet. Queries features from the configured "service" and displays the data of the configured "featureAttributes" in a bar chart.

```json
{
    "type": "customComponent",
    "componentName": "snippetChart",
    "title": "Phänogramm",
    "subtitle": ["Number of observations = ", ["anzahl_beobachtungen"]],
    "tooltipUnit": "%",
    "chartConfig": {
        "type": "bar",
        "data": {
            "datasets": [{
                "label": "Label",
                "backgroundColor": "rgba(214, 227, 255, 0.8)",
                "featureAttributes": ["januar_1", "februar_1", "maerz_1", "april_1", "mai_1", "juni_1", "juli_1", "august_1", "september_1", "oktober_1", "november_1", "dezember_1"]
            },
            {
                "label": "Label 2",
                "backgroundColor": "rgba(214, 227, 255, 0.8)",
                "featureAttributes": ["januar_2", "februar_2", "maerz_2", "april_2", "mai_2", "juni_2", "juli_2", "august_2", "september_2", "oktober_2", "november_2", "dezember_2"]
            }
        ],
        "labels": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        },
        "options": {
            "plugins": {
                "legend": {
                    "display": false
                },
                "subtitle": {
                  "display": true,
                  "position": "bottom",
                  }
                }
            }
        }
    },
    "service": {
        "extern": true,
        "type": "WFS",
        "url": "https://qs-geodienste.hamburg.de/HH_WFS_verbreitung_tiere",
        "typename": "verbreitung_tiere_eindeutige_liste",
        "featureNS": "https://registry.gdi-de.org/id/de.hh.up",
        "featureTypes": ["verbreitung_tiere_eindeutige_liste"],
        "filter": {
            "attrName": "artname",
            "operator": "EQ"
        }
    }
}
```

***
#### Datatypes.Snippets.ChartConfig {data-toc-label='ChartConfig'}

[type:object]: # (Datatypes.Snippets.ChartConfig.Object)

An object that describes a chart. For more information, click **[here](https://www.chartjs.org/docs/latest/configuration/)**.

|Name|Required|Type|Default|Description|Expert|
|----|--------|----|-------|-----------|------|
|data|yes|**[object](#datatypessnippetschartconfigobject)**||The data. For more information, click **[here](https://www.chartjs.org/docs/latest/general/data-structures.html)**|false|
|options|yes|**[object](#datatypessnippetschartconfigobject)**||Options for creating the chart.|false|
|plugins|yes|enum[]||Inline plugins can be included in this array. This is an alternative way to add plugins for individual charts (as opposed to global plugin registration). More about plugins in the **[developers section](https://www.chartjs.org/docs/latest/developers/plugins.html)**.|false|
|type|yes|String||The chart type determines the main type of the chart.|false|

**Example**

The top-level structure of the Chart.js configuration:

```json
{
    "chartConfig": {
        "type": "bar",
        "data": {},
        "options": {},
        "plugins": []
    }
}
```

***

##### Datatypes.Snippets.ChartConfig.Object {data-toc-label='ChartConfig Object'}

|Name|Required|Type|Default|Description|Expert|
|----|--------|----|-------|-----------|------|
|foo|no|String||bar|false|

***


