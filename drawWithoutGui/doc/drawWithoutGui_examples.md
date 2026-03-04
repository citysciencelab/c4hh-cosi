# drawWithoutGui
The drawWithoutGui addon enables the functionality to start a draw interaction on the map without a GUI.
The draw interaction must be initialized with one of the geometries **"Point"**, **"Polygon"** and **"LineString"** using the **drawType** parameter in the action call.
The draw interaction can also be started with an existing feature in a GeoJSON using the **initialJSON** parameter in the action call. If the features' coordinates in the GeoJSON are not in the same projection as the map the **transfromWGS** parameter can be set to true to convert the features' coordinates before the feature is added to the map.
The parameter **zoomToExtent**: true allows for the automatic zoom to the features extent.
With the parameters **color** and **opacity** the styling of the drawn features can be defined.
Default color is red and the opacity for the fill is 0.5.

## Settings in the config.js
The remote interface needs to be configured in the config.js as follows:

```
remoteInterface: {
        postMessageUrl: "https://localhost:9001"
}
```

The transformation of features to different projection from the maps' projection the following settings need to be in the config.js.
Those settings are also important if the center point shall be defined, added to the resulting GeoJSON and then send through the remote interface.

```
inputMap: {
       targetProjection: "EPSG:4326"
}
```


## Test via remoteInterface
DrawWithoutGui can be called via the remoteInterface
Assuming iframe is the dom element in which the masterportal is running within an iframe in the application.

```
iframe.postMessage({
    namespace: "DrawWithoutGui",
    action: "initDrawWithoutGUI",
    args: {
        drawType: "Point"
    }
});
```


## drawWithoutGui Testing in the browser console
Following are some examples on how the draw interaction can be tested initialized from the browser console for testing purposes:

You can add an event listener which logs the resulting drawn feature:


```
window.addEventListener("message", function (message) { console.log(message.data);})
```


1. Call to initialze a drawing session for Points:


```
window.postMessage({
    namespace: "DrawWithoutGui",
    action: "initDrawWithoutGUI",
    args: {
        drawType: "Point"
    }
});
```



2. Call to initialize a drawing session with an existing GeoJSON containing a polygon:
In this call the coordinates are also transformed from EPSG:4326 to the map's projection using the **transformWGS** parameter and the map is zoomed to the Extent of the polygon using the **zoomToExtent** parameter. The styling is defined by the parameters **color** and **opacity**.


```
window.postMessage({
    namespace: "DrawWithoutGui",
    action: "initDrawWithoutGUI",
    args: {
        drawType: "Polygon",
        initialJSON: "{\"type\":\"FeatureCollection\",\"features\":[{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[10.087721486253347,53.53866406931454],[10.028923562800957,53.517779284247986],[10.064747233632946,53.498200818002495],[10.112039643345131,53.52202963352182],[10.087721486253347,53.53866406931454]]]},\"properties\":{\"centerPoint\":{\"type\":\"Point\",\"coordinates\":[10.068124301788878,53.51850573992465]}}}]}",
        transformWGS: true,
        zoomToExtent: true,
        color: [120, 200,50],
        opacity: 0.7
    }
});
```
