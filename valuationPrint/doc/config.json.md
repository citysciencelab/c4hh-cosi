#### Portalconfig.menu.tools.children.valuationPrint

Tool to support the valuation of land on the basis of parcels.

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|name|yes|String|Wertermittlung|The title of the tool or the entry in the tool list.|false|
|icon|yes|String|bi-bar-chart-line-fill|The icon to use.|false|
|parcelLayerId|yes|String|""|Layer-Id of the parcels, whose data are required for this tool.|false|


**Example**
```
#!json
"valuationPrint": {
        "name": "Wertermittlung",
        "icon": "bi-bar-chart-line-fill",
        "parcelLayerId": "6076"
    },
```

***




