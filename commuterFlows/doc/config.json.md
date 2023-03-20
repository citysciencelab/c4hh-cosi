# Portalconfig.menu.tools.children

List of all configurable tools. Each tool inherits from **[tool](#markdown-header-portalconfigmenutool)** and can/must therefore also have the attributes specified there configured.

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|commuterFlows|no|**[commuterFlows](#markdown-header-portalconfigmenutoolschildrencommuterflows)**||Tool for displaying commuter flows.|true|



## Portalconfig.menu.tools.children.commuterFlows

**ATTENTION: Backend required!**

This is a tool to graphicaly represent commuter flows.

* Presentation of commuter flows at two levels: The level of counties/free cities and the level of cities and municipalities.
* Selection of the graphical representation with county and municipality names, values, lines and circles including animation.
* Distinction between out-commuters and in-commuters.
* A list of any length of all counties or municipalities shown from or to which commuting takes place.
* A Link to the linked metadata catalog.
* A button for resetting the tool.
* An  **[extensive configuration](#markdown-header-Commuter-Flows-Configuration)**.

The Commuter Flows tool is divided into three modules:

* The **[CommuterAPI](#markdown-header-commuterapi)** that retrieves and prepares the data from the server.
* The class CommuterOL with intersections for easy handling of the OpenLayers functions.
* The Vue component with which the interface is displayed and the data from CommuterAPI is combined with the functions of CommuterOL.


***


### Commuter Flows - Configuration
For the Commuter Flows tool, many small things are made configurable to customize the behavior and appearance of the tool to your liking.

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|name|yes|String|Pendlerströme|The title of the tool or the entry in the tool list.|true|
|icon|yes|String|bi-arrow-left-right|The icon to use.|true|
|serviceURL|yes|String|""|The URL to the service to use.|true|
|metaVerPath|no|String|""|A link to the metadata used. If specified, it will be displayed as a "More Information" link in the tool.|true|
|blacklistedDistricts|no|String[]| [] |A list of counties or municipalities to ignore.|true|
|listChunk|no|Number|5|The number of features by which the list should be extendable or shortenable.|true|
|setMarkerOnClickInList|no|Boolean|true|When you click on an entry in the list, the map marker is set to the position of the associated feature in the map.|true|
|onstart|no|Object|Object|An object for setting the set hooks when starting or resetting the tool. - Explained in detail with the following points:|true|
|onstart.captionsChecked|no|Boolean|true|Set the name checkmark at startup or reset.|true|
|onstart.numbersChecked|no|Boolean|true|Set the value checkmark at startup or reset.|true|
|onstart.beamsChecked|no|Boolean|true|Set the line checkmark at startup or reset.|true|
|onstart.animationChecked|no|Boolean|false|Set animation checkmark at start or reset (animation start cannot be configured, animation always starts in stop state).|true|
|onstart.direction|no|String|"out"|For the out commuter radio box "out", for the in commuter radio box "in".|true|
|olFont|no|String|"10pt sans-serif"|Setting for the font size and font, following the rules of canvas rendering ( [external link cancas rendering](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font) ).|true|
|olFontShadow|no|Object|Object|The background on which the font sits - here a white shadow with a certain thickness should be set. - Explained in detail with the following points:|true|
|olFontShadow.color|no|Number[]|[255, 255, 255, 0.8]|The color as an array of 4 numbers: red [0..255], green [0..255], blue [0..255] and the alpha channel [0..1]. Example for white: [255, 255, 255, 1]|true|
|olFontShadow.width|no|Number|5|The thickness of the font shadow as a value from 0 upwards (5 should be good).|true|
|olBeam|no|Object|Object|The display mode of the displayed lines in color and line width - Explained in detail with the following points:|true|
|olBeam.color|no|Number[]|[192, 9, 9, 0.8]|The color as an array of 4 numbers: red [0..255], green [0..255], blue [0..255] and the alpha channel [0..1]. If the color is not specified (remove the "color" key along with the array), the lines will take on the bright colors of the associated animation circles.|true|
|olBeam.width|no|Number|3|The thickness of the lines as a value from 0 upwards (3 should be good).|true|
|olBubbleAlgorithm|no|String|"linear"|The algorithm to be used for the calculation of the circle radius.|true|
|||String|"linear"|`radius = (maxRadiusPx - minRadiusPx) / maxValue * value + minRadiusPx`|true|
|||String|"log"|`radius = (maxRadiusPx - minRadiusPx) / log10(maxValue) * log10(value) + minRadiusPx`|true|
|||String|"area"|`radius = maxRadiusPx / sqrt(maxValue / PI) * sqrt(value / PI)`|true|
|olBubblePixelMax|no|Number|50|The maximum radius size of an animation circle in pixels.|true|
|olBubblePixelMin|no|Number|5|The minimum radius size of an animation circle in pixels. Please note that the "area" algorithm does not take into account the minimum size set here.|true|
|olBubbleBorder|no|Object|Object|The representation of the edge of each animation circle. - Explained in detail with the following points:|true|
|olBubbleBorder.color|no|Number[]|[255, 255, 255, 1]|The color as an array of 4 numbers: red [0..255], green [0..255], blue [0..255] and the alpha channel [0..1]. Example for white: [255, 255, 255, 1]|true|
|olBubbleBorder.width|no|Number|1|The stroke width of the border of the animation circle as a value from 0 upwards (1 should be enough).|true|
|olBubbleColors|no|Number[]|[see "Color Universal Design"](http://people.apache.org/~crossley/cud/cud.html)|A list of colors to be used for the animation circles. Please consider accessibility.|true|
|olBubbleColorShift|no|Number[]|[0, -60, 60]|The color shifts as a list of values by which the olBubbleColors should be shifted to dark or light before the colors repeat. Example: [0, -60, 60]|true|
|olZoomOptions|no|Object|{padding: [20, 20, 20, 400]}|The options to be used for zooming. If this entry is omitted completely, no zooming will take place.|true|
|olAnimationPaces|no|Number[]|[5000, 500]|The speeds at which the animation circles should move during the animation (in milliseconds). The first, third, fifth, etc. value are the outward motion, the second, fourth, sixth, etc. value are the return. For a smooth oscillation it is enough to specify one value e.g. [5000] - for a slow running there and fast running back just specify two values e.g: [5000, 500] - to stop the return run completely, simply specify a 0 e.g. [5000, 0] - to do something completely crazy, any number of values can be specified e.g. [6000, 600, 3000, 300, 1000, 100, 0, 1000, 10000, 0].|true|



**Example**
```
#!json
"CommuterFlows": {
    "name": "translate#additional:modules.tools.CommuterFlows.titleLabel",
    "icon": "bi-arrow-left-right",
    "metaVerPath": "https://metaver.de/trefferanzeige?docuuid=4FC611E9-DDA4-42E5-9EE9-F118BCBB2D89",
    "blacklistedDistricts": ["Bremen", "Berlin", "Kiel", "Hannover"],
    "serviceURL": "https://geodienste.hamburg.de/MRH_WFS_Pendlerstroeme_im_Tool",
    "listChunk": 5,
    "setMarkerOnClickInList": true,
    "onstart": {
        "captionsChecked": true,
        "numbersChecked": true,
        "beamsChecked": true,
        "animationChecked": false,
        "direction": "out"
    },
    "olFont": "10pt sans-serif",
    "olFontShadow": {
        "color": [255, 255, 255, 0.8],
        "width": 5
    },
    "olBeam": {
        "color": [192, 9, 9, 0.8],
        "width": 3
    },
    "olBubbleAlgorithm": "linear",
    "olBubblePixelMax": 50,
    "olBubblePixelMin": 5,
    "olBubbleBorder": {
        "color": [255, 255, 255, 1],
        "width": 1
    },
    "olBubbleColors": [
        [230, 159, 0, 0.75],
        [86, 180, 233, 0.75],
        [0, 158, 115, 0.75],
        [240, 228, 66, 0.75],
        [0, 114, 178, 0.75],
        [213, 94, 0, 0.75],
        [204, 121, 167, 0.75]
    ],
    "olBubbleColorShift": [0, -60, 60],
    "olZoomOptions": {
        "padding": [20, 20, 20, 400]
    },
    "olAnimationPaces": [5000, 500]
}
```

***



### CommuterAPI
The CommuterAPI realizes the access to the possibly very special calls at the server (WFS, WSDL, etc.). The CommuterAPI generalizes the received data to be able to use the frontend unchanged for any kind of infrastructure. Theoretically, for a different backend architecture, you only need to build a new API that behaves externally as described below.

#### Configuration of the Api
|Name|Mandatory|Typ|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|useProxy|no|Boolean|false|If you use a proxy to bypass the CORS rules, then this can be implemented using the getProxyUrl utils. This is deprecated since the goal must be to adjust the CORS rules on your servers accordingly instead of using a proxy.|true|
|blacklistedDistricts|no|String[]| [] |An array of keywords to be ignored for both counties and municipalities. If you have data for a city that is not connected, you can simply remove it here.|true|
|serviceUrl|no|String|""|The URL to your service. We recommend making this configurable if possible, in case the URL changes but the service remains unchanged.|true|

#### API coupling
The CommuterAPI has four functions that must be implemented. The call and return of the functions are generalized - i.e. independent of the infrastructure. Therefore, the API can be arbitrarily customized to meet other backend requirements.
In order to work with the received OpenLayers features, they have values independent of the received dataset.

Here is the description of an API feature as it is expected by the frontend e.g. as an element of a *featureList*. Use ol/Feature as a basis if possible.

##### API-Feature

|Name|Type|Description|
|----|---|------------|
|caption|String|The feature name to display. `feature.get("caption")`|
|value|Number|The feature value to display. `feature.get("value")`|
|coordinate|Number[]|The coordinate of the feature - please note that the geometry of the feature may be a line from the feature to the center point. The coordinate is the position of the feature, not the center point. `feature.get("coordinate")`|
|getGeometry()|Function|The normal OL function to retrieve the geometry of the feature. This should be a line between the feature and the center point. `feature.getGeometry()`|


##### getListDistricts

This call generates a simple list of all counties or first level cities that is passed to the passed callback function. The list should be sorted within this call. The list is an indexed array of strings.

`void := getListDistricts(Function onsuccess, Function onerror).`

* `onsuccess(dataset)` as function with `String[] dataset` a simple list of names.
* `onerror(error)` a error handler with `Error error` an error to handle.


##### getListCities

This call generates a simple list of all second level municipalities or cities, which is passed to the callback function passed. The list should be sorted within this call. The list is an indexed array of strings.

`void := getListCities(Function onsuccess, Function onerror).`

* `onsuccess(dataset)` as function with `String[] dataset` a simple list of names.
* `onerror(error)` a error handler with `Error error` an error to handle.


##### getFeaturesDistrict

This call creates a generalized object with the received data from the interface. This should cover any functionality that is required in the Vue component.

`void := getFeaturesDistrict(String district, Boolean homeToWork, Number start, Number len, Function onsuccess, Function onerror).`

* Using `String district` as a search word to retrieve the data for this county/city.
* With `Boolean homeToWork` with `true` = out-commuter and `false` = in-commuter.
* With 'Number start' the starting point from which data is to be supplied (Pagination start).
* With 'Number len' the length of the data to be supplied from the starting point (pagination length).
* Using `onsuccess(Object dataset)` as a function with `Object dataset` to an [object with the relevant data](#markdown-header-getfeaturesdistrictonsuccessdataset).
* With `onerror(Error error)` as error handler with `Error error` to process errors.


###### getFeaturesDistrict onsuccess dataset

An object with the following keys is passed to the callback function `onsuccess(Object dataset)` if successful.

|Schlüssel|Typ|Beschreibung|
|---------|---|------------|
|caption|String|Corresponds to the passed value `district`. Used as a label for the center point.|
|coordinate|Number[]|The coordinate of the center point.|
|featureList|ol/Feature[]|A list of [API-Feature](#markdown-header-api-feature) (prepared ol/feature) that describe the counties/county cities.|
|totalMin|Number|The lowest value to be used for calculating animation circle sizes.|
|totalMax|Number|The largest value to be used for calculating animation circle sizes.|
|totalLength|Number|The total number of available features - ignoring pagination.|
|start|Number|The selected starting point of the pagination.|
|len|Number|The number of elements to return from start.|
|source|String|Is fix "getFeaturesDistrict" to better distinguish the data source externally.|


##### getFeaturesCity

This call creates a generalized object with the received data from the interface. This should cover any functionality that is required in the Vue component.

`void := getFeaturesCity(String city, Boolean homeToWork, Number start, Number len, Function onsuccess, Function onerror).`

* Using `String city` as a search word to retrieve the data for that municipality.
* With `Boolean homeToWork` with `true` = out-commuter and `false` = in-commuter.
* With 'Number start' the starting point from which data is to be supplied (Pagination start).
* With 'Number len' the length of the data to be supplied from the starting point (pagination length).
* Using `onsuccess(Object dataset)` as a function with `Object dataset` to an [object with the relevant data](#markdown-header-getfeaturesdistrictonsuccessdataset).
* With `onerror(Error error)` as error handler with `Error error` to process errors.


###### getFeaturesCity onsuccess dataset

An object with the following keys is passed to the callback function `onsuccess(Object dataset)` if successful.

|Schlüssel|Typ|Beschreibung|
|---------|---|------------|
|caption|String|Corresponds to the passed value `city`. Used as a label for the center point.|
|coordinate|Number[]|The coordinate of the center point.|
|featureList|ol/Feature[]|A list of [API-Feature](#markdown-header-api-feature) (prepared ol/feature) that describe the municipalities.|
|totalMin|Number|The lowest value to be used for calculating animation circle sizes.|
|totalMax|Number|The largest value to be used for calculating animation circle sizes.|
|totalLength|Number|The total number of available features - ignoring pagination.|
|start|Number|The selected starting point of the pagination.|
|len|Number|The number of elements to return from start.|
|source|String|Is fix "getFeaturesCity" to better distinguish the data source externally.|



***
> *Partly translated with www.DeepL.com/Translator (free version)*
