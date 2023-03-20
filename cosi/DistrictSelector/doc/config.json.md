**DistrictSelector**

Mit dem DistrictSelector (Gebietsauswahl) wird ein Gebiet auf Basis einer Verwaltungsebene (z.B.: Statistisches Gebiet) ausgewÃ¤hlt. FÃ¼r das gewÃ¤hlte Gebiet werden die entsprechenden regionalstatistischen Daten geladen.

|Name|Verpflichtend| Typ|Default|Beschreibung|
|----|-------------|----|-------|------------|
|name|nein|String|Gebiet auswÃ¤hlen|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-image|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|districtLevels|ja|Object[]| |Beinhaltet die nÃ¶tigen Informationen der einzelnen Verwaltungsebenen (siehe Beispiel).|
|districtLevels[i].layerId|ja|String| |Die Layer id zum jeweiligen Verwaltungslayer.|
|districtLevels[i].label|ja|String| |Die/der Bezeichnung/ Name fÃ¼r die Verwaltungsebene.|
|districtLevels[i].keyOfAttrName|ja|String| |Der Key fÃ¼r das Attribut in dem der Name der Verwaltungeinheit steht.|
|districtLevels[i].duplicateDistrictNames|nein|String[]| |Namen von Gebieten, die Konflikte auslÃ¶sen. EimsbÃ¼ttel zum Beispiel gibt es als Stadtteil und als Bezirk. Die Namen sind bei der hÃ¶heren Verwaltungsebene anzugeben.|
|districtLevels[i].stats|ja|Object| |Definiert die Layer-Id fÃ¼r die regionalstatistischen Daten, die jeweiligen Metadaten URLs und den Key des Attributes "Name" fÃ¼r die statistischen Daten.|
|districtLevels[i].stats.keyOfAttrName|ja|String| |Key des Attributes "Name" fÃ¼r die statistischen Daten.|
|districtLevels[i].stats.metadataUrls|nein|String[]| |Die URLs der Metadaten der statistischen Daten.|
|districtLevels[i].activeStyle|nein|Object| |Benutzerdefinierte Styles fÃ¼r die jeweils ausgewÃ¤hlte Verwaltungsebene. Entspricht der Hierarchie des OpenLayers Style Definition|
|districtLevels[i].districtNamesMap|nein|Object| |Benutzerdefiniertes dictionary zum bereitstellen von synonymen Gebietsnamen|
|additionalInfoLayers|nein|Object| |ZusÃ¤tzliche Info Layer die beim Nutzen des Tools angezeigt werden kÃ¶nnen. Der Key ist der angezeigte Bezeichner, der Value die Liste an Layer IDs|
|toolToOpen|nein|String| |Das Werkzeug, das nach dem SchlieÃŸen des DistrictSelector geÃ¶ffnet wird.|
|enableBuffer|nein|Boolean|true|Legt fest, ob der Puffer als InputFeld angezeigt wird.|

**Beispiel**
```
"districtSelector": {
  "active": true,
  "name": "Gebietsauswahl",
  "toolToOpen": "templateManager",
  "enableBuffer": true,
  "districtLevels": [
    {
      "layerId": "6071",
      "label": "Statistische Gebiete",
      "keyOfAttrName": "statgebiet",
      "stats": {
        "keyOfAttrName": "stat_gebiet",
        "layerIds": ["112233"],
        "metadataUrls": ["http://hmdk.metaver.de/trefferanzeige?docuuid=99687398-CFFE-413E-B966-6B8629D335F5"]
      },
      "activeStyle": {
        "fillColor": [
          255,
          255,
          255,
          0
        ],
        "stroke": {
          "color": "#3399CC",
          "width": 2
        }
      }
    },
    {
      "layerId": "1694",
      "label": "Stadtteile",
      "keyOfAttrName": "stadtteil_name",
      "stats": {
        "keyOfAttrName": "stadtteil",
        "layerIds": ["22121"],
        "metadataUrls": ["http://hmdk.metaver.de/trefferanzeige?docuuid=F4062BD8-43C4-4C4F-AA45-253D84A3685E"]
      },
      "districtNamesMap": {
            "Steinwerder": "Steinwerder/Kl. Grasbrook",
            "Kleiner Grasbrook": "Steinwerder/Kl. Grasbrook",
            "Waltershof": "Waltershof/Finkenwerder",
            "Finkenwerder": "Waltershof/Finkenwerder"
        }
    }
  ],
  "additionalInfoLayers": {
    "SozialrÃ¤ume": ["20179"],
    "RISE": ["4411", "13895", "17040", "18712", "4413", "4409", "18713", "4412", "4410", "18714", "10767"]
}
```

***
