#### Portalconfig.menu.tools.children

List of all configurable tools. Each tool inherits from **[tool](#markdown-header-portalconfigmenutool)** and thus can/must also have the attributes specified there configured.

|Name|Required|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|schoolRoutePlanning|no|**[schoolRoutePlanning](#markdown-header-portalconfigmenutoolschulwegrouting)**||schoolRoutePlanning.|true|

***

#### Portalconfig.menu.tool.schoolRoutePlanning

With this Hamburg-specific tool, the route can be calculated from any Hamburg address to any Hamburg school. The official school entrances are also considered.

**ATTENTION: Backend necessary!**

**An FME workbench is addressed via a WPS, which calculates the routing.**

|Name|Required|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|fmwProcess|no|String|"schulwegrouting_wps.fmw"|FME process that calculates a school route.|true|
|layerId|no|String|"8712"|Id of the layer that contains the schools. This layer must also be configured in the **[themeconfig](#markdown-header-themeconfig)**.|true|
|serviceId|no|String|"8"|Id of the gazetteer from the rest-services.json that triggers the address search.|true|
|wpsId|no|String|"1001"|Id of the WPS from the rest-services.json that triggers the configured FME process.|true|
|wpsTimeout|no|Object|{"tm_ttl": {"dataType": "integer", "value": 10}}|Timeout parameters for the wps. If false or empty object then this parameter is not send in the post body.|true|

**Example**
```
#!json
"schoolRoutePlanning": {
    "name": "translate#additional:modules.tools.schoolRoutePlanning.title",
    "icon": "bi-signpost",
    "fmwProcess": "schulwegrouting_wps.fmw",
    "layerId": "8712",
    "serviceId": "8",
    "wpsId: "1001",
    "wpsTimeout": {
        "tm_ttl": {
            "dataType": "integer",
            "value": 50
        }
    }
}
```

***
