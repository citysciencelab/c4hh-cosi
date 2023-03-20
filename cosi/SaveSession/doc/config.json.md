**SaveSession**

<<<<<<< HEAD
Mit dem Dienst Sitzung speichern/laden können aktuelle diverse Informationen der aktuellen Arbeitssitzung abgespeichert werden um diese zu einem späteren Zeitpunkt wieder öffnen und weiterbearbeiten zu können. Dies umfasst:

* Die ausgewählte Verwaltungsebene und ausgewählte Gebiete
* Aktive Fachdatenthemen
* Mit den Simulationswerkzeugen erstellte Szenarien
* Ergebnisse und Konfigurationen der Werkzeuge Erreichbarkeitsanalyse und Versorgungsanalyse

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Sitzung speichern|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-save|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|

**Beispiel**
```
"SaveSession": {
  "name": "Sitzung speichern",
  "icon": "bi-save"
}
```
=======
Mit dem DistrictSelector kann ein Gebiet auf Basis einer Verwaltungsebene (z.B.: Statistisches Gebiet) ausgewählt werden. Für das gewählte Gebiet werden die entsprechenden regionalstatistischen Daten geladen.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Gebiet auswählen|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-save|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|districtLevels|ja|Object[]||Beinhaltet die nötigen Informationen der einzelnen Verwaltungsebenen (siehe Beispiel).|
|districtLevels[i].layerId|ja|String||Die Layer id zum jeweiligen Verwaltungslayer.|
|districtLevels[i].label|ja|String||Die/der Bezeichnung/ Name für die Verwaltungsebene.|
|districtLevels[i].keyOfAttrName|ja|String||Der Key für das Attribut in dem der Name der Verwaltungeinheit steht.|
|districtLevels[i].keyOfAttrNameStats|ja|String||Der Key für das Attribut in dem der Name steht, für die statistischen Daten.|
|additionalInfoLayerIds|nein|String[]|[]|Zusätzliche Info Layer die beim Nutzen des Tools angezeigt werden können.|

**Beispiel**
```
"DistrictSelector": {
  "name": "Gebiet auswählen",
  "icon": "bi-save",
  "districtLevels": [
    {
      "layerId": "6071",
      "label": "Statistische Gebiete",
      "keyOfAttrName": "statgebiet",
      "keyOfAttrNameStats": "statgebiet"
    },
    {
      "layerId": "1694",
      "label": "Stadtteile",
      "keyOfAttrName": "stadtteil_name",
      "keyOfAttrNameStats": "stadtteil"
    },
    {
      "layerId": "1692",
      "label":"Bezirke",
      "keyOfAttrName": "bezirk_name",
      "keyOfAttrNameStats": "bezirk"
    }
  ],
  "additionalInfoLayerIds": ["20179"]
}
```

***
>>>>>>> 108ebd74 (add new addons_3_0_0 structure-add missing addons)
