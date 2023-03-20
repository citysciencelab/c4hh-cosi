# Test via remoteInterface
AddWMS can be called via the remoteInterface

## addGeojson via remoteInterface
Creates a wms layer with the layerid "krankenhaeuser"

Example:
```js
parent.postMessage({
    namespace: "AddLayerRemotely",
    action: "addWMS",
    args: {
        url: "https://geodienste.hamburg.de/HH_WMS_Krankenhaeuser",
        layersToLoad: [{
            name: "krankenhaeuser",
            title: "krankenhaeuser",
            layerOn: true,
            style: ""
        }],
        folderName: "externe Daten",
        zoomTo :true
    }
});
```

## Toggle visibility
Toggle the visibility of the wms layer

Example:
```js
parent.postMessage({
    namespace: "AddLayerRemotely",
    action: "toggleLayerVisibility",
    args: {
        layerId: "krankenhaeuser"
    }
});
```

## Example - iframe
The example can be called directly here with a running server:  **[iframe Example](https://localhost:9001/addons/addLayerRemotely/doc/iframeExample.html)**.
To do this, the following must be added to `portal/master/config.js`

```js
addons: ["addLayerRemotely"],
remoteInterface: {
    postMessageUrl: "https://localhost:9001"
},
```


# Test from the Browser console:
Creates a wms layer with the layerid "krankenhaeuser":

```js
Backbone.Radio.trigger("addLayerRemotely", "addWMS", {"url":"https://geodienste.hamburg.de/HH_WMS_Krankenhaeuser", "layersToLoad":[{name: "krankenhaeuser", title: "krankenhaeuser", layerOn: true, style: ""}], "folderName":"externe Daten", "zoomTo":true})
```

## Set subsequent attributes for the created layer
Note: the layerId is the same as the layer name but space, slash and colon are replaced by hyphen.

For example set layer visible
```js
Backbone.Radio.trigger("ModelList", "setModelAttributesById", "krankenhaeuser", {isSelected: true})
```

or set layer invisible
```js
Backbone.Radio.trigger("ModelList", "setModelAttributesById", "krankenhaeuser", {isSelected: false})
```
