# Cesium 3D Tiles Inspector Addon for Hamburg Masterportal

This addon integrates the Cesium 3D Tiles Inspector into the  Masterportal. It enables analysis and debugging of 3D Tiles data directly within the geoportal. For example, the maximumScreenSpaceError can be changed using the Tiles Inspector. An example of this can be found in [Cesium Sandcastle](https://sandcastle.cesium.com/?src=3D%20Tiles%20Inspector.html).

## Features

- **Overlay:** The inspector appears as an overlay in the map area when 3D mode is activated.
- **Drag & Drop:** The Cesium 3d tiles inspector popup can be moved freely by holding the middle mouse button.
- **Dynamic Positioning:** The inspector’s position automatically adapts to the width of the secondary menu.
- **Automatic Initialization:** The addon waits for Cesium to become available and initializes the inspector when 3D mode is active.

## Known Issues

There are situations where errors may be thrown in the browser console when using the inspector together with custom highlighting in the portal. As far as is known, these errors only affect the highlighting functionality (yellow hover highlight from the inspector) and do not cause further functional limitations.

**Background:**  
The portal implements its own custom highlighting for 3D models. When the Cesium3DTilesInspector is loaded, its default yellow hover highlight can conflict with the portal’s custom highlighting. After clicking on a building (which applies the portal’s highlight), the inspector’s yellow hover highlight may stop working, and errors may appear in the Chrome console.

Disabling the inspector’s picking (to avoid the highlight conflict) also disables other important features, such as the Maximum Screen Space Error slider. There is currently no solution to avoid this conflict and error without losing inspector functionality.

A corresponding [issue was reported to Cesium](https://github.com/CesiumGS/cesium/issues/12763#issuecomment-3133179130) but was closed without a solution.