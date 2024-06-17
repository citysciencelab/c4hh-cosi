# Changelog Addons for Masterportal
 All important changes in this project are stored in this file.

[Semantic versioning](https://semver.org/spec/v2.0.0.html) is used.

## Unreleased - in development
### __Breaking Changes__

### Added
- A mechanism was added to define searchInterfaces for the searchBar as an addon for Masterportal 3.0.

### Changed
- CommuterFlows, sdpDownload, populationRequest, streetsmart, vcOblique and different gfiThemes: Now available for Masterportal 3.0.

### Deprecated
- The deprecated Backbone add-ons, defined by a string in addonsConf.json are no longer supported for Masterportal 3.0.

### Removed

### Fixed


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
