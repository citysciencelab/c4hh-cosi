# Changelog Addons for Masterportal
 All important changes in this project are stored in this file.

[Semantic versioning](https://semver.org/spec/v2.0.0.html) is used.

## Unreleased - in development
### __Breaking Changes__

### Added
- PlanParken: Added a new addon `planParken` to analyze parking spaces in an area.
- GFI - `parking`: Added a new gfi to match the visual style of the `planParken` addon.

### Changed

### Deprecated

### Removed

### Fixed

---

## 2026-06-03 v3.23.0

### Changed
- Changed Node.js and npm support: Versions from Node.js **22.19.0** up to smaller than **25** (LTS 24.15.0) besides Version **23** and npm fom **10.9.3** up to smaller than **12** are now supported.

### Fixed
- Boris: Set state in urlParams to provide open boris by shareView without selection.

---

## 2026-05-06 v3.22.0

### Fixed
- vcOblique: Fixed an issue with VC Map 6 where markers and images appeared at the initial map position instead of the current view when opening vcOblique after panning.

---

## 2026-04-01 v3.21.0

### Changed
- gfiThemes: The GFI theme `combinedGfi` no longer displays the select element when exactly one option exists. In such cases, the singular option is automatically selected.

### Fixed
- vcOblique: Fixed Bugs of Marker setting and styling when using VCMap 6.
- gfiThemes: The GFI theme `combinedGfi` threw errors for the buffer size 0. 0 now works as an option.
- gfiThemes: The GFI theme `combinedGfi` received `414 URI Too Long` from some services. This issue has been resolved by sending data via POST body rather than GET parameters for the failing scenario.
- gfiThemes: The GFI theme `combinedGfi` handled polygons with holes in an erroneous fashion, and used the last present hole as the polygon. This has been resolved.

---

## 2026-03-04 v3.20.0

### Added
- GeoMarker: Added new addon to show and edit GeoMarkers. For internal usage only.

---

## 2026-02-06 v3.15.2 (LTS)

### Fixed
- Boris:
    - Fixed incorrect Vuex dispatches caused by renamed actions and active buttons are now highlighted correctly on initial load.
    - Fixed console error.

---

## 2026-02-04 v3.19.0

### Fixed
- TrafficCount: Fixed bug that displayed the wrong calendarweek for the first calendarweek of each year and fixed tooltip label.
- Boris: Fixed incorrect Vuex dispatches caused by renamed actions and active buttons are now highlighted correctly on initial load.
- Boris: Fixed console error.
- WaterRiskCheck: Fixed a bug where secondary menu is unusable on mobile.
- gfiThemes: The GFI theme `combinedGfi` erroneously showed features that intersect the BBOX of the selected geometry rather than only the features that actually intersect the selected geometry. This has been resolved.

---

## 2026-01-07 v3.18.0

### Added
- PopulationRequest: Added support for OGC API Processes.
- gfiThemes: The GFI theme `combinedGfi` has been extended with more powerful configuration values to use OGC API processes with dynamic data. Please refer to the provided `README.md` file.

### Changed
- Changed Node.js support: Versions from Node.js **22.19.0** up to Node.js **22.21.0** (LTS) are now supported

### Fixed
- SimulationTool: Corrected path to logo.

---

## 2025-12-03 v3.17.0

### Added
- PopulationRequest: Added support for OGC API Processes.

---

## 2025-11-05 v3.16.0

### Fixed
- Compatibility fixes after the Masterportal core upgrade to **Vue 3.5** (esm-bundler / stricter template checks). No functional changes intended.
    - trafficCount: `TrafficCountDatePickerCalendar.vue`
    - fileImport : `FileImport.vue`
    - valuationPrint: `ValuationPrint.vue`
- gfiTheme/Verkehrsstärken: Fixed download link.
---

## 2025-10-01 v3.15.0 (LTS)

### __Breaking Changes__
- Dropped support for **Node.js 18.x**, **20.x** and **npm 9**. Minimum required is now **Node.js 22.19.0 (LTS)** with **npm 10.x**.

### Added
- Added an example for an addon of type `control`: addons\controls\exampleControl.
- Added README.md for the Addon Cesium 3D Tiles Inspector.
- Verkehrsstärken gfiTheme: Added Fullscreenview-button.
- Added 'oktagon' to version 3.x

### Changed
- Verkehrsstärken gfiTheme: only shows data for the last 10 years.

### Fixed
- Verkehrsstärken gfiTheme: Fixed Anmerkung und Erhebungsmethode in tableview, fixed Baustelleneinfluss visibility in diagram, fixed layout.

---

## 2025-09-03 v3.14.0

### Added
- Added an example for an addon of type `control`: addons\controls\exampleControl.

### Changed
- Modifying the InputText component to work according to the changes in Masterportal.

---

## 2025-08-06 v3.13.0

### Added
- Cesium 3D Tiles Inspector: The Popup Cesium 3D Tiles Inspector, which allows controlling the maximumScreenSpaceError and other parameters in 3D-Mode, has been added as an javascript addon.
- gfiThemes: new Fullscreen Button for dataTables can be configured in now, default is disabled.

---

## 2025-07-02 v3.12.0

### Added
- Added 'BIMFabrikHH' to version 3.x
- Added 'vpiDashboard' to version 3.x
- Added The new tool [simulationTool](https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/simulationTool/) enables wind and noise simulations. Further details: [simulationTool documentation](https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/simulationTool/doc/config.json.md)

### Changed
- Refactored Icon Buttons after structure change.

---

## 2025-06-04 v3.11.0

### Removed
- Removed since version 3 not used state property `deactivateGFI` and `translate#` in language-keys.

### Fixed
- Boris: Fixed that all Layers are shown in DropDown Menu, even if gfiAttributes are set to ignore.

---

## 2025-05-15 v3.10.1

### Fixed
- CommuterFlows: Ensures the layer always renders on top, preventing commuter flow visualization from disappearing behind the baselayer.

---

## 2025-05-07 v3.10.0

### Changed
- Charts: Brought code up to date — same refactor as in v2 with the Chart.js update.
- StreetSmart: Changed EPSG to resolve false heigth in viewer.

### Fixed
- Fixed VerkehrsstärkenThemeLineChart tests, so that it does not need to be skipped anymore.
- StreetSmart: Remove array property filterByList which was set in the streetSmart api.

---

## 2025-04-02 v3.9.0

### Added
- Added 'addLayerRemotely' to version 3.x
- Added SessionTool to version 3.x

### Changed
- The following package has been updated:
    - devDependencies:
        - husky: 9.0.11 to 9.1.7
    - sdpDownload:
        - dependencies:
            - @turf/helpers: 6.5.0 to 7.2.0
            - @turf/intersect: 6.5.0 to 7.2.0
    - valuationPrint:
        - dependencies:
            - @turf/buffer: 6.5.0 to 7.2.0
            - @turf/helpers: 6.5.0 to 7.2.0
            - @turf/union: 6.5.0 to 7.2.0
    - waterRiskCheck:
        - dependencies:
            - @turf/area: 7.1.0 to 7.2.0
            - @turf/buffer: 7.1.0 to 7.2.0
            - @turf/difference: 7.1.0 to 7.2.0
            - @turf/helpers: 7.1.0 to 7.2.0
            - @turf/intersect: 7.1.0 to 7.2.0
            - @turf/points-within-polygon: 7.1.0 to 7.2.0

### Fixed
- Boris: Change of the Bodenrichtwert layer was not written back to the layer config.

---

## 2025-03-05 v3.8.0
### Changed
- Boris: Design adjustments for the component buttons, including colors and hover effect.

### Fixed
- StreetSmart: Fixed language switch, now supporting english, german and portuguese.

---

## 2025-02-05 v3.7.0
### Changed
- Added Boris to version 3.x

### Fixed
- Boris: Resolved issue with the parameterised URL call.

---

## 2025-01-02 v3.6.0

### Added
- Re-enabled setting the latest tag.

---

## 2024-12-05 v3.5.1

---

## 2024-12-04 v3.5.0
### __Breaking Changes__

### Added

### Changed
- Street Smart API: changed version of Street Smart API to 24.14 and reactVersion to 18.3.1.
- vcOblique: the year is now also displayed in the name  of the module

### Deprecated

### Removed

### Fixed
- gfiTeme dipas: pipe symbols, \n and \r in attribute description are respected as line break.

---

## 2024-11-06 v3.4.0

### Removed
- Deleted the `namespaces` option, as it is not a valid configuration for `createStore`

---

## 2024-10-02 v3.3.0

---

## 2024-09-04 v3.2.0
### __Breaking Changes__

### Added
- New tool WaterRiskCheck:
    - Implemented form ui.

### Changed

### Deprecated

### Removed

### Fixed

---

## 2024-08-07 v3.1.0
### Changed
- Eslint: no-undef eslint rule is switched on and changes to not return warnings/errors are applied.

---

## 2024-06-27 v3.0.0
### __Breaking Changes__
Under the headline `deprecated` you can find several changes of removed deprecated properties and tools.
In certain circumstances this means that you have to update your portal files (index.html, config.js and config.json) according to the new changes in order to use your portal furthermore.
For further information about the changes for version 3.0.0 visit the [Masterportal Docs and Changelog](https://bitbucket.org/geowerkstatt-hamburg/masterportal/src/dev/).

### Added
- A mechanism was added to define searchInterfaces for the searchBar as an addon for version 3.0.
- gfiOnAdress was migrated to version 3.0.0 within searchInterfaces addon.
- New gfi theme `flaecheninfo` in version 3.0.0.

### Changed
- CommuterFlows, sdpDownload, populationRequest, streetsmart, vcOblique, valuationPrint, searchInterfaces and different gfiThemes: Now available for version 3.0.0.
- Adapt tests for version 3.0.0 structure.

### Deprecated
- The deprecated Backbone add-ons, defined by a string in addonsConf.json, are no longer supported in version 3.0.0.

### Fixed
- The prePushHook works again


## v2.46.0 - 2024-06-05

### Added
- SessionTool: Adds the observer of Modeler3D to enable its states can be saved in sessions.

### Changed
- The following package has been updated:
    - devDependencies:
        - husky: 8.0.3 to 9.0.11

---
## v2.45.0 - 2024-04-30
### Changed
- The version of node was updated to `^16.13.2 || ^18.16.0 || ^20.12.2`.
- The version of npm was updated to `^8.1.2 || ^9.5.1 || ^10.5.0`

---
## v2.43.0 - 2024-03-06

### Changed
- StreetSmart: if started as control, it is not available in 3D mode.

---
## v2.42.0 - 2024-02-07

### Fixed
- SchoolRoutePlanning: Fixed showing the route with OL 8.2.0.

---
## v2.41.2 - 2024-01-18
### Fixed
- Boris: In the Calculation tab, the building position is only displayed for EFH

---
## v2.39.0 - 2023-11-01
### Added
- The new addon [statisticDashboard](https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/statisticDashboard/) A tool to display statistical data. Further details: [statisticDashboard documentation](https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/statisticDashboard/doc/config.json.md)

---
## v2.34.0 - 2023-06-07
### Changed
- The version of node was updated, must be `>= 16.13.2 <= 16.20.0`
- The version of npm was updated, must be `>= 8.1.2 <= 8.19.4`

---
## v2.32.0 - 2023-04-05
### Changed
- In schoolRoutePlanning all streets and house numbers are now listed as results with an overflow.
- The version of node was updated, must be `>= 16.13.2 <= 16.18.1`
- The version of npm was updated, must be `>= 8.1.2 <= 8.19.3`

---
## v2.31.0 - 2023-03-01
### __Breaking Changes__
Time library `moment.js` was replaced with [day.js](https://day.js.org/). Please consider to use `day.js` in your future pull requests.

### Added
- In refugeeHomes a new layer with ukrainian refugee homes was added.

### Changed
- In schoolRoutePlanning, streets without the prefix `*` in the gazetteer are now searched for.
- Time handling: moment.js was replaced with day.js.
- addLayerRemotely:
    - addLayerRemotely can now be addressed via the remote interface using actions.
    - In addition, the possibility to switch layers visible or invisible has been added.
    - The documentation and the example have been extended.

## v2.29.0 - 2023-01-04
### __Breaking Changes__
Addon `obliqueViewer` was renamed to `vcOblique`.

---

## v2.26.0 - 2022-10-05
### Added
- The new addon [obliqueViewer](https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/obliqueViewer/) allows to configure oblique viewer in the Masterportal. Further details: [obliqueViewer documentation](https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/obliqueViewer/doc/config.json.md)
### Fixed
