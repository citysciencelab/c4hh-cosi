## Portalconfig.menu.sections.streetSmart

Module to display a 360° panoramic view of [cyclomedia streetsmart](https://www.cyclomedia.com/de/street-smart) in the sidebar.

The module includes

* a panorama view that displays aerial images and point clouds
* the panorama can also be displayed in full screen mode
* offers own tools, like measuring


***


### StreetSmart - Configuration

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|type|yes|String|"streetSmart"|The type used to identify the module.|false|
|icon|no|String|"bi-camera"|The icon to use.|false|
|name|no|String|"360° panorama"|The title of the module or the entry in the menu.|false|
|reactVersion|no|String|18.3.1|The version of React compatible with the version of streetsmartAPI.|true|
|streetsmartAPIVersion|no|String|24.14|The version of streetsmartApi.|true|
|styleId|no|String|"defaultMapMarkerPoint"|StyleId to replace the mapmarker in the map when streetsmart is open.|false|
|timeTravelVisible|no|Boolean|false|Enables timeTravel in panoramaViewer.|false|
|toggle3DCursor|no|Boolean|false|Toggles the visibility of the 3D cursor in the PanoramaViewer.|false|
|toggleAddressesVisible|no|Boolean|false|Toggles the visibility of addresses.|false|

**Example**
```
#!json
{
    "type": "streetSmart",
    "icon": "bi-camera",
    "name": "additional:menu.tools.streetsmart",
    "reactVersion": "18.3.1",
    "streetsmartAPIVersion": "24.14"
},
```

***
