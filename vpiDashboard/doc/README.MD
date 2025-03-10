## How to install
Steps
1. Add the VpiDashboard to your addons in your masterportal config.js file
2. Add a wms layer to your masterportal which shows a grid
3. Add a wms time layer to your masterportal which shows the heatmap
4. Add the VpiDashboard addon to your menu sections in your masterportal config.json file
```json
{
    "icon": "bi-graph-up",
    "type": "vpiDashboard",
    "active": false,
    "gridLayerId": "34187",
    "initialSelectedGeoId": 318,
    "heatmapLayers": [
        {
            "name": "additional:modules.tools.vpidashboard.tab.heatmap.hourly",
            "id": "34182"
        },
        {
            "name": "additional:modules.tools.vpidashboard.tab.heatmap.daily",
            "id": "34183"
        }
    ]
}
```
5. You need to add the configuration for the OGC-API and the path of two mapping files to the config.js file located in the root folder of this addon.

```javascript
export const Config = Object.assign({
    OGCAPI: {
        host: "https://ogc_api_host.de",
        basepath: "/base/path/to/collections"
    },
    geoIdToNamePath: "./geoId_to_name.json",
    roamerFormatted: "./roamerFormatted.json"
});
```
- geoIdToNamePath:
 - This json file contains the mapping of the geoId to the name of the grid.
 - Example:
   ```json
   {
    "41": "Am Strandkai",
    "42": "Überseeplatz",
    "78": "Zirkusweg / Bernhard-Nocht-Str.",
    "79": "Landungsbrücken"
   }
   ```
- roamerFormatted:
  - This json file contains the mapping of the country code to the name of the country.
  - Example:
  ```json
  {
   "DE": "Deutschland",
   "AT": "Österreich",
   "CH": "Schweiz"
  }
  ```
6. Run your masterportal with
```
npm run start
```

