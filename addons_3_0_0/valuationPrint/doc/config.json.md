#### Portalconfig.menu.tools.children.valuationPrint

Tool to support the valuation of land on the basis of parcels.

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|name|yes|String|Wertermittlung|The title of the tool or the entry in the tool list.|false|
|icon|yes|String|bi-bar-chart-line-fill|The icon to use.|false|
|parcelLayerId|yes|String|""|Layer-Id of the parcels, whose data are required for this tool.|false|
|showStatusProgress|no|Boolean|true|Whether or not status progress is shown.|false|
|multiSelectParcels|no|Boolean|false|If true, user can have more than one parcel selected at a time.|false|
|showParcelSearch|no|Boolean|false|If true, WfsSearch is rendered, otherwise the valuation.|false|
|isModalRequired|no|Boolean|true|Whether or not a modal is displayed asking for reference number and specific address before starting report generation.|false|
|reportPath|no|String|"config.valuation.json"|File name/path for configuration of the report.|false|


**Example**
```
#!json
"valuationPrint": {
        "name": "Wertermittlung",
        "icon": "bi-bar-chart-line-fill",
        "parcelLayerId": "6076",
        "showStatusProgress": false,
        "multiSelectParcels": true,
        "showParcelSearch": true,
        "isModalRequired": false,
        "reportPath": "config.valuation.json"
    },
```

***




