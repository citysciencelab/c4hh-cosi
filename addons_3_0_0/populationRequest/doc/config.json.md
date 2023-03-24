#### Portalconfig.menu.tools.children

Liste aller konfigurierbaren Werkzeuge. Jedes Werkzeug erbt von **[tool](#markdown-header-portalconfigmenutool)** und kann/muss somit auch die dort angegebenen attribute konfiguriert bekommen.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|populationRequest|nein|**[populationRequest](#markdown-header-portalconfigmenutoolpopulationrequest)**||Hamburg spezifisches Werkzeug um die Einwohner in der FHH (Freie und Hansestadt Hamburg) und der MRH (Metropol Region Hamburg) über eine zu zeichnende Geometrie abfragen zu können.|true|

***

#### Portalconfig.menu.tool.populationRequest

[inherits]: # (Portalconfig.menu.tool)

Einwohnerabfrage für Hamburg und die MRH (Metropolregion Hamburg).

**ACHTUNG: Backend notwendig!**

**Es wird über einen WPS eine FME-Workbench angesprochen, welche die Anzahl der Einwohner berechnet, unter Beachtung des Datenschutzes.**

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|name|ja|String||Name des Werkzeuges im Menu.|false|
|icon|nein|String||CSS Klasse des Bootstrap Icon, das vor dem Toolnamen im Menu angezeigt wird. |false|
|onlyDesktop|nein|Boolean|false|Flag ob das Werkzeug nur im Desktop Modus sichtbar sein soll.|false|
|populationReqServiceId|ja|String|"2"|In rest-services.[...].js konfigurierte Service-ID|false|

**Beispiel Einwohnerabfrage**
```
#!json
"populationRequest": {
    "name": "Einwohneranzahl abfragen",
    "icon": "bi-wrench",
    "onlyDesktop": false
}
```

***
