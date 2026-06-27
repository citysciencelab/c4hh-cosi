**ColorCodeMap**

Die ColorCodeMap Component färbt die Karte basierend auf ausgewählten Gebieten und deren verfügbaren regionalstatistischen Datensätzen ein. Des Weiteren kann die Einfärbung der Karte über alle verfügbaren Jahre dynamisch animiniert werden.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Gebiet auswählen|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-map|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|isVisibleInMenu|ja|Boolean|false|Das Tool wird nicht im Menü geladen.|

**Beispiel**
```
"colorCodeMap": {
  "name": "ColorCodeMap",
  "icon": "bi-map",
  "isVisibleInMenu": false
***
