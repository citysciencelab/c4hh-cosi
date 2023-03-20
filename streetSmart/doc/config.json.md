# Portalconfig.menu.tools.children

List of all configurable tools. Each tool inherits from **[tool](#markdown-header-portalconfigmenutool)** and can/must therefore also have the attributes specified there configured.

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|streetSmart|no|**[streetSmart](#markdown-header-portalconfigmenutoolschildrenstreetsmart)**||Tool for displaying a 360° panoramic view.|true|



## Portalconfig.menu.tools.children.streetSmart

Tool to display a 360° panoramic view of [cyclomedia streetsmart](https://www.cyclomedia.com/de/street-smart) in the sidebar.

The tool includes

* a panorama view that displays aerial images and point clouds
* the panorama can also be displayed in full screen mode
* offers own tools, like measuring


***


### StreetSmart - Configuration

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|name|yes|String|360° panorama|The title of the tool or the entry in the tool list.|false|
|glyphicon|yes|String|glyphicon glyphicon-picture|The icon to use.|false|
|streetsmartAPIVersion|no|String|22.2|The version of streetsmartApi.|true|
|reactVersion|no|String|16.13.0|The version of React compatible with the version of streetsmartAPI.|true|
|styleId|no|String|"defaultMapMarkerPoint"|StyleId to replace the mapmarker in the map when streetsmart is open.|true|
|timeTravelVisible|no|Boolean|false|Enables timeTravel in panoramaViewer.|false|
|toggle3DCursor|no|Boolean|false|Toggles the visibility of the 3D cursor in the PanoramaViewer.|false|
|toggleAddressesVisible|no|Boolean|false|Toggles the visibility of addresses.|false|

**Example**
```
#!json
"streetSmart": {
    "name": "translate#additional:menu.tools.streetsmart",
    "glyphicon": "glyphicon-picture",
    "streetsmartAPIVersion": "22.2",
    "reactVersion": "16.13.0"
    },
```

***

