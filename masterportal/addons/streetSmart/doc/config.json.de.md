## Portalconfig.menu.sections.streetSmart

Modul zur Darstellung einer 360° Panorama Ansicht von [cyclomedia streetsmart](https://www.cyclomedia.com/de/street-smart) in der sidebar.

Das Modul umfasst

* eine Panorama Ansicht die Luftbilder und Punktwolken anzeigt
* das Panorama lässt sich auch im Vollbildmodus anzeigen
* bietet eigene Werkzeuge, wie das Messen an


***


### StreetSmart - Konfiguration

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|type|ja|String|"streetSmart"|Der Typ zur Identifizierung des Modules.|false|
|icon|nein|String|"bi-camera"|Das zu verwendende Icon.|false|
|name|nein|String|"360° Panorama"|Der Titel des Moduls bzw. der Eintrag im Menü|false|
|reactVersion|nein|String|18.3.1|Die Version von React, kompatibel zur Version der streetsmartAPI.|true|
|streetsmartAPIVersion|nein|String|24.14|Die Version der streetsmartApi.|true|
|styleId|nein|String|"defaultMapMarkerPoint"|StyleId, um den Mapmarker in der Karte zu stylen, wenn streetsmart geöffnet ist.|false|
|timeTravelVisible|nein|Boolean|false|Schaltet Zeitauswahl in der Panoramaansicht ein.|false|
|toggle3DCursor|nein|Boolean|false|Schaltet die Sichtbarkeit des 3D-Cursors in der Panoramaansicht ein.|false|
|toggleAddressesVisible|nein|Boolean|false|Schaltet die Sichtbarkeit von Adressen ein.|false|

**Beispiel**
```
#!json
{
    "type": "streetSmart",
    "icon": "bi-camera",
    "name": "additional:menu.tools.streetsmart",
    "reactVersion": "18.3.1",
    "streetsmartAPIVersion": "24.14"
},
```

***
