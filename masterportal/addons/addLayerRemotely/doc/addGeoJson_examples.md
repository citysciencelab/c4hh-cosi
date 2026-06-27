# Test via remoteInterface
AddGeojson can be called via the remoteInterface

## addGeojson via remoteInterface
The geojson must be constructed according to the geojson standard.
If a style needs to be added a styles parameter containing an array of styles can be added.
The id inside the styleId needs to be the same as the one used in the trigger function.

Example:
```js
parent.postMessage({
    namespace: "Modules/AddLayerRemotely",
    action: "addGeoJson",
    args: {
        name: "Test2",
        id: "xyx",
        geoJSON: {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: [
                            [
                                [
                                    [
                                        9.782150902821929,
                                        53.561242336815674
                                    ],
                                    [
                                        9.80788047980621,
                                        53.553080243468536
                                    ],
                                    [
                                        9.790722523756013,
                                        53.54534652511445
                                    ],
                                    [
                                        9.782150902821929,
                                        53.561242336815674
                                    ]
                                ]
                            ],
                            [
                                [
                                    [
                                        9.80239064469148,
                                        53.541558657277925
                                    ],
                                    [
                                        9.825538611089947,
                                        53.549249511417685
                                    ],
                                    [
                                        9.826720264650026,
                                        53.53611309493565
                                    ],
                                    [
                                        9.80239064469148,
                                        53.541558657277925
                                    ]
                                ]
                            ]
                        ]
                    },
                    properties: {
                        test1: "WGS84",
                        id: "1",
                        test: "abc"
                    }
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [
                            10.023374939929553,
                            53.5356067536243
                        ]
                    },
                    properties: {
                        id: "12"
                    }
                }
            ],
            styles: [
                {
                    styleId: "customLayer",
                    rules: [
                        {
                            style: {
                                polygonStrokeColor: [
                                    255,
                                    0,
                                    0,
                                    0.8
                                ],
                                polygonStrokeWidth: 3,
                                polygonStrokeDash: [
                                    5,
                                    5
                                ],
                                polygonFillColor: [
                                    255,
                                    255,
                                    255,
                                    0
                                ],
                                lineStrokeColor: [
                                    255,
                                    0,
                                    0,
                                    0.8
                                ],
                                lineStrokeWidth: 3,
                                lineStrokeDash: [
                                    5,
                                    5
                                ],
                                circleStrokeColor: [
                                    255,
                                    0,
                                    0,
                                    1
                                ],
                                circleFillColor: [
                                    255,
                                    0,
                                    0,
                                    0.5
                                ]
                            }
                        }
                    ]
                }
            ]
        },
        styleId: "customLayer",
        folderName: "tree",
        gfiAttributes: {
            test1: "WGS84",
            test: "abc"
        }
    }
});
```

## Toggle visibility
Toggle the visibility of the geoJson layer

Example:
```js
parent.postMessage({
    namespace: "Modules/AddLayerRemotely",
    action: "toggleLayerVisibility",
    args: {
        layerId: "xyx"
    }
});
```

# Test from the Browser console:
Following are examples of how the addLayerRemotely Addon can be used from the browser console:

## addGeoJsonRemotely:
The geojson must be constructed according to the geojson standard.
If a style needs to be added a styles parameter containing an array of styles can be added.
The id inside the styleId needs to be the same as the one used in the trigger function.

```js
var geojson = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: {
                type: "MultiPolygon",
                coordinates: [
                    [
                        [
                            [
                                9.782150902821929,
                                53.561242336815674
                            ],
                            [
                                9.80788047980621,
                                53.553080243468536
                            ],
                            [
                                9.790722523756013,
                                53.54534652511445
                            ],
                            [
                                9.782150902821929,
                                53.561242336815674
                            ]
                        ]
                    ],
                    [
                        [
                            [
                                9.80239064469148,
                                53.541558657277925
                            ],
                            [
                                9.825538611089947,
                                53.549249511417685
                            ],
                            [
                                9.826720264650026,
                                53.53611309493565
                            ],
                            [
                                9.80239064469148,
                                53.541558657277925
                            ]
                        ]
                    ]
                ]
            },
            properties: {
                test1: "WGS84",
                id: "1",
                test: "abc"
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [
                    10.023374939929553,
                    53.5356067536243
                ]
            },
            properties: {
                id: "11"
            }
        }
    ],
    styles: [
        {
            styleId: "customLayer",
            rules: [
                {
                    style: {
                        polygonStrokeColor: [
                            255,
                            0,
                            0,
                            0.8
                        ],
                        polygonStrokeWidth: 3,
                        polygonStrokeDash: [
                            5,
                            5
                        ],
                        polygonFillColor: [
                            255,
                            255,
                            255,
                            0
                        ],
                        lineStrokeColor: [
                            255,
                            0,
                            0,
                            0.8
                        ],
                        lineStrokeWidth: 3,
                        lineStrokeDash: [
                            5,
                            5
                        ],
                        circleStrokeColor: [
                            255,
                            0,
                            0,
                            1
                        ],
                        circleFillColor: [
                            255,
                            0,
                            0,
                            0.5
                        ]
                    }
                }
            ]
        }
    ]
}
```

You can add
```js
verbose: true
```
to the args object to get an alerting after adding the GeoJSON.

## add geojson to map:

```js
window.postMessage({
    namespace: "Modules/AddLayerRemotely",
    action: "addGeoJson",
    args: {
        name: "Test21",
        id: "xyz",
        geoJSON: geojson,
        styleId: "customLayer",
        folderName: "tree",
        gfiAttributes: {
            test1: "WGS84",
            test: "abc"
        }
    }
});
```

## Toggle layer visibility

```js
window.postMessage({
    namespace: "Modules/AddLayerRemotely",
    action: "toggleLayerVisibility",
    args: {
        layerId: "xyz"
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
```
