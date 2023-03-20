**Selection Manager**

<<<<<<< HEAD
Die Auswahlverwaltung tracked alle möglichen Polygon-Features von unterschiedlichen VectorLayern und ermöglichst das Darstellen dieser Auswahlen auf der Karte per Klick. Des Weiteren stellt sie Funktionen bereit, um die Auswahlen zu bearbeiten (z.B. zu vergrößern oder zu verkleinern) und sie miteinander zu verbinden.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Auswahlverwaltung|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-textarea|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|isVisibleInMenu|ja|Boolean|true|Das Tool wird nicht im Menü geladen.|

**Beispiel**
```
"selectionManager": {
  "name": "Auswahlverwaltung",
  "icon": "bi-textarea",
  "isVisibleInMenu": true
}
=======
Die SelectionManager Component ...

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Gebiet auswählen|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-map|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|isVisibleInMenu|ja|Boolean|false|Das Tool wird nicht im Menü geladen.|

**Beispiel**
```
"colorCodeMap": {
  "name": "SelectionManager",
  "icon": "bi-textarea",
  "isVisibleInMenu": false
>>>>>>> cbf2be88 (add new addons_3_0_0 structure-add missing addons)
***
