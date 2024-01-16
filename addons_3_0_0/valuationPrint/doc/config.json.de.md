#### Portalconfig.menu.tools.children.valuationPrint

Werkzeug zur Unterstützung der Wertermittlung von Grundstücken auf Basis von Flurstücken.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|name|ja|String|Wertermittlung|Der Titel des Werkzeuges bzw. der Eintrag in der Werkzeugliste|false|
|icon|ja|String|bi-bar-chart-line-fill|Das zu verwendende Icon.|false|
|parcelLayerId|ja|String|""|Layer-Id der Flurstücke, deren Daten erforderlich für dieses Tool sind.|false|
|showStatusProgress|nein|Boolean|true|Ob der Statusverlauf angezeigt werden soll.|false|
|multiSelectParcels|nein|Boolean|false|Ob der User mehrere Flurstücke gleichzeitig ausgewählt haben kann.|false|


**Beispiel**
```
#!json
"valuationPrint": {
        "name": "Wertermittlung",
        "icon": "bi-bar-chart-line-fill",
        "parcelLayerId": "6076",
        "showStatusProgress": false,
        "multiSelectParcels": true
    },
```

***




