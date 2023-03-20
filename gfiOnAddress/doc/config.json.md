#### Portalconfig.searchBar.gazetteer

Extends the gazetter.

|Name|Required|Type|Default|Description|Expert|
|----|--------|----|-------|-----------|------|
|gfiAttributes|no|Object,String|"showAll"|GFI attributes to be shown. If not set the information is taken from the rest-services.json.|false|
|gfiOnClick|no|Boolean|false|The gfi with info to the address will be open after click on search result.|false|
|gfiTheme|no|String|"default"|Display style of GFI information for this layer. If not set the information is taken from the rest-services.json.|false|

**Example**

```json
{
    "gazetteer": {
        "minChars": 3,
        "serviceId": "6",
        "searchStreets": true,
        "searchHouseNumbers": true,
        "searchDistricts": true,
        "searchParcels": true,
        "searchStreetKey": true,
        "showGeographicIdentifier": false,
        "gfiAttributes": "showAll",
        "gfiOnClick": true,
        "gfiTheme": "default"
    }
}
```

***
