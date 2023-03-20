# Portalconfig.menu.tools.children

Liste aller konfigurierbaren Werkzeuge. Jedes Werkzeug erbt von **[tool](#markdown-header-portalconfigmenutool)** und kann/muss somit auch die dort angegebenen attribute konfiguiert bekommen.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|streetSmart|nein|**[streetSmart](#markdown-header-portalconfigmenutoolschildrenstreetSmart)**||Werkzeug zur Darstellung einer 360° Panorama Ansicht.|false|



## Portalconfig.menu.tools.children.streetSmart

Werkzeug zur Darstellung einer 360° Panorama Ansicht von [cyclomedia streetsmart](https://www.cyclomedia.com/de/street-smart) in der sidebar.

Das Werkzeug umfasst

* eine Panorama Ansicht die Luftbilder und Punktwolken anzeigt
* das Panorama lässt sich auch im Vollbildmodus anzeigen
* bietet eigene Werkzeuge, wie das Messen an


***


### StreetSmart - Konfiguration

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|name|ja|String|360° Panorama|Der Titel des Werkzeuges bzw. der Eintrag in der Werkzeugliste|false|
|glyphicon|ja|String|glyphicon glyphicon-picture|Das zu verwendende Icon.|false|
|streetsmartAPIVersion|nein|String|22.2|Die Version der streetsmartApi.|true|
|reactVersion|nein|String|16.13.0|Die Version von React, kompatibel zur Version der streetsmartAPI.|true|
|styleId|nein|String|"defaultMapMarkerPoint"|StyleId, um den Mapmarker in der Karte zu stylen, wenn streetsmart geöffnet ist.|true|
|timeTravelVisible|nein|Boolean|false|Schaltet Zeitauswahl in der Panoramaansicht ein.|false|
|toggle3DCursor|nein|Boolean|false|Schaltet die Sichtbarkeit des 3D-Cursors in der Panoramaansicht ein.|false|
|toggleAddressesVisible|nein|Boolean|false|Schaltet die Sichtbarkeit von Adressen ein.|false|

**Beispiel**
```
#!json
"streetSmart": {
    "name": "translate#additional:menu.tools.streetsmart",
    "glyphicon": "glyphicon-picture",
    "streetsmartAPIVersion": "22.2",
    "reactVersion": "16.13.0"
    },
```

***




