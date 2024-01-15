#### Portalconfig.menu.tools.children.valuationPrint

Werkzeug zur Unterstützung der Wertermittlung von Grundstücken auf Basis von Flurstücken.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|name|ja|String|Wertermittlung|Der Titel des Werkzeuges bzw. der Eintrag in der Werkzeugliste|false|
|icon|ja|String|bi-bar-chart-line-fill|Das zu verwendende Icon.|false|
|parcelLayerId|ja|String|""|Layer-Id der Flurstücke, deren Daten erforderlich für dieses Tool sind.|false|
|showStatusProgress|nein|Boolean|true|Ob der Statusverlauf angezeigt werden soll.|false|
|multiSelectParcels|nein|Boolean|false|Ob der User mehrere Flurstücke gleichzeitig ausgewählt haben kann.|false|
|showParcelSearch|nein|Boolean|false|Wenn true, wird die Flurstückssuche angezeigt, ansonsten die Wertermittlung.|false|
|isModalRequired|nein|Boolean|true|Ob vor dem Starten der Berichtserzeugung durch ein Modal Angaben zu Geschäftszeichen, Adresse etc. abgefragt werden sollen.|false|
|reportPath|nein|String|"config.valuation.json"|Dateiname/Pfad zur Konfiguration des Berichts.|false|
|oafCRSURI|no|Boolean|false|Die CRS-URL Definition für die OAF Serviceanfragen. Dieser Parameter muss mit einer validen CRS-URL gefüllt werden, sobald ein OAF Service konfiguriert ist.|false|


**Beispiel**
```
#!json
"valuationPrint": {
        "name": "Wertermittlung",
        "icon": "bi-bar-chart-line-fill",
        "parcelLayerId": "6076",
        "showStatusProgress": false,
        "multiSelectParcels": true,
        "showParcelSearch": true,
        "isModalRequired": false,
        "reportPath": "config.valuation.json",
        "oafCRSURI": "http://www.opengis.net/def/crs/EPSG/0/25832"
    },
```

***




