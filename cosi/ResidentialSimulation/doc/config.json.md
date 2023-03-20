<<<<<<< HEAD
**ResidentialSimulation**

Mit diesem Werkzeug können für neue fiktive Wohnquartiere angelegt werden.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Wohnungsbauquartiere anlegen|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-house|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|


**Beispiel**
```
"residentialSimulation": {
    "name": "Wohnungsbauquartiere anlegen"
    "icon": "bi-house
}
```
=======
**DistrictSelector**

Mit dem DistrictSelector kann ein Gebiet auf Basis einer Verwaltungsebene (z.B.: Statistisches Gebiet) ausgewählt werden. Für das gewählte Gebiet werden die entsprechenden regionalstatistischen Daten geladen.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Gebiet auswählen|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-building|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|districtLevels|ja|Object[]||Beinhaltet die nötigen Informationen der einzelnen Verwaltungsebenen (siehe Beispiel).|
|districtLevels[i].layerId|ja|String||Die Layer id zum jeweiligen Verwaltungslayer.|
|districtLevels[i].label|ja|String||Die/der Bezeichnung/ Name für die Verwaltungsebene.|
|districtLevels[i].keyOfAttrName|ja|String||Der Key für das Attribut in dem der Name der Verwaltungeinheit steht.|
|districtLevels[i].keyOfAttrNameStats|ja|String||Der Key für das Attribut in dem der Name steht, für die statistischen Daten.|
|districtLevels[i].stats|ja|Object||Definiert URL und den Key des Attributes "Name" für die statistischen Daten.|
|districtLevels[i].stats.keyOfAttrName|ja|String||Key des Attributes "Name" für die statistischen Daten.|
|districtLevels[i].stats.baseUrl|ja|String||Die URL des WFS Dienstes für die statistischen Daten.|
|districtLevels[i].activeStyle|nein|Object||Benutzerdefinierte Styles für die jeweils ausgewählte Verwaltungsebene. Entspricht der Hierarchie des OpenLayers Style Definition|
|additionalInfoLayers|nein|{[key: String]: String[]}|Zusätzliche Info Layer die beim Nutzen des Tools angezeigt werden können. Der Key ist der angezeigte Bezeichner, der Value die Liste an Layer IDs|

**Beispiel**
```
"districtSelector": {
  "icon": "bi-building",
  "districtLevels": [
    {
      "layerId": "6071",
      "label": "Statistische Gebiete",
      "keyOfAttrName": "statgebiet",
      "keyOfAttrNameStats": "statgebiet",
      "stats": {
        "keyOfAttrName": "statgebiet",
        "baseUrl": "https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Statistische_Gebiete"
      },
      "activeStyle": {
        "fill": {"color": [255, 255, 255, 0]},
        "stroke": {"color": "#3399CC", "width": 2}
      }
    },
    {
      "layerId": "1694",
      "label": "Stadtteile",
      "keyOfAttrName": "stadtteil_name",
      "keyOfAttrNameStats": "stadtteil",
      "stats": {
        "keyOfAttrName": "stadtteil",
        "baseUrl": "https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Stadtteile"
      }
    },
    {
      "layerId": "1692",
      "label":"Bezirke",
      "keyOfAttrName": "bezirk_name",
      "keyOfAttrNameStats": "bezirk",
      "stats": {
        "keyOfAttrName": "stadtteil",
        "baseUrl": "https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Bezirke"
      }
    }
  ],
  "active": true,
  "additionalInfoLayers": {
    "Sozialräume": ["20179"],
    "RISE": ["4411", "13895", "17040", "18712", "4413", "4409", "18713", "4412", "4410", "18714", "10767"]
}
```

***
>>>>>>> 108ebd74 (add new addons_3_0_0 structure-add missing addons)
