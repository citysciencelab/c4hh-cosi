# Test via remoteInterface
AddWMS can be called via the remoteInterface

## addWMS via remoteInterface
Creates a wms layer with the layerid "krankenhaeuser"

Example:
```js
parent.postMessage({
    namespace: "Modules/AddLayerRemotely",
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
        zoomTo: true
    }
});
```

You can add
```js
verbose: true
```
to the args object to get an alerting after adding the GeoJSON.

## Toggle visibility
Toggle the visibility of the wms layer

Example:
```js
parent.postMessage({
    namespace: "Modules/AddLayerRemotely",
    action: "toggleLayerVisibility",
    args: {
        layerId: "krankenhaeuser"
    }
});
```

# Test from the Browser console:
Creates a wms layer with the layerid "krankenhaeuser":

```js
window.postMessage({
    namespace: "Modules/AddLayerRemotely",
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
        zoomTo: true
    }
});
```

You can add
```js
verbose: true
```
to the args object to get an alerting after adding the GeoJSON.

## Toggle visibility
Toggle the visibility of the wms layer

Example:
```js
window.postMessage({
    namespace: "Modules/AddLayerRemotely",
    action: "toggleLayerVisibility",
    args: {
        layerId: "krankenhaeuser"
    }
});
```


# Example - iframe
The example can be called directly here with a running server:  **[iframe Example](https://localhost:9001/addons/addLayerRemotely/doc/iframeExample.html)**.
To do this, the following must be added to `portal/master/config.js`

```js
addons: ["addLayerRemotely"],
remoteInterface: {
    postMessageUrl: "https://localhost:9001"
},
```
You can push some "postMessages" to the iframe-Example via Browser console, as in the example above.
Then you need to push to:

```js
window.document.getElementById("iframe").contentWindow.postMessage({...});
