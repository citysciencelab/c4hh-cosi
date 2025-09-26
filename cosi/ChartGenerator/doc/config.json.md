**ChartGenerator**

Der ChartGenerator erstellt aus entsprechend formatierten Daten Visualisierungen mit Hilfe von vue-chart.js und verwalted alle in der Session erstellten Graphen in einem Toolfenster.
Das Tool kann angesprochen werden, indem der State newDataset im Store (stateChartGenerator.js) mit setNewDataset überschrieben wird. Dazu beispielsweise wie folgt in die eigene Component mit einbinden:

...mapMutations("Tools/ChartGenerator", {setNewChartDataset: "setNewDataset"});

Übergeben werden muss eine Instanz der Klasse ChartDataset (ChartGenerator/classes/ChartDataset.js).

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Gebiet auswählen|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-bar-chart|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|isVisibleInMenu|nein|Boolean|false|Das Tool wird nicht im Menü geladen.|

**Beispiel**
```
"chartGenerator": {
  "name": "Graphenvisualisierung",
  "icon": "bi-bar-chart",
  "isVisibleInMenu", false
***
