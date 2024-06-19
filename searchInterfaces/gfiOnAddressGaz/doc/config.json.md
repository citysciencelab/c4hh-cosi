###### portalConfig.menu.searchBar.searchInterfaces.gfiOnAddressGaz
Configuration of the Gazetteer search service as an addon for displaying results in the GFI tool.

**ATTENTION: Backend required!**
**A stored query of a WFS with predefined parameters is queried.**

|Name|Required|Type|Default|Description|Expert|
|----|--------|----|-------|-----------|------|
|searchAddress|no|Boolean||Specifies if addresses should be searched for.|false|
|searchDistricts|no|Boolean||Specifies if districts should be searched for.|false|
|searchHouseNumbers|no|Boolean||Specifies if streets and house numbers should be searched for.|false|
|searchParcels|no|Boolean||Specifies if parcels should be searched for.|false|
|searchStreetKey|no|Boolean||Specifies if street keys should be searched for.|false|
|searchStreets|no|Boolean||Specifies if streets should be searched for. Prerequisite for **searchHouseNumbers**.|false|
|serviceId|yes|String||ID of the search service. Resolved in the **[rest-services.json](rest-services.json.en.md)**.|false|
|showGeographicIdentifier|no|Boolean|false|Specifies if the attribute `geographicIdentifier` should be used to display the search result.|false|
|type|yes|String|"gfiOnAddressGaz"|Type of search interface. Defines which search interface is configured.|
|title|no|String||Determines the title of the GFI window.|false|
|attributesToShow|no|Object||Retrieves attributes from a feature and displays them with their respective values. For this example the attributes include: "kreis", "gemeinde", "ortsteil", "strasse", "hausnummer", "strassenname", "postleitzahl".|false|

**Example**

```json
{
    "type": "gfiOnAddressGaz",
    "serviceId": "6",
    "searchAddress": true,
    "searchStreets": true,
    "searchHouseNumbers": true,
    "searchDistricts": true,
    "searchParcels": true,
    "searchStreetKey": true,
    "title": "gfiOnAddress-Addon",
    "attributesToShow": {
        "kreis": "District",
        "gemeinde": "Municipality",
        "ortsteil": "Locality",
        "strasse": "Street",
        "hausnummer": "House number",
        "strassenname": "Street name",
        "postleitzahl": "Postal code"
    }
}
```
