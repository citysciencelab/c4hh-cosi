**DistrictFinder**

Mit dem Werkzeug Gebiete Screening können verschiedene Bedingungen definiert und erstellt werden, um darauf basierend statistische Gebiete oder Stadtteile zu screenen und für die weitere Arbeit auszuwählen.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Gebiete Screening|Name des Werkzeuges im Menu.|
|selectedLevelId|ja|String|28201|id der initial ausgewählten Bezugsebene|
|chartColors[i].conditionFalse|nein|String|rgb(220, 226, 243, 1)|RGBA-Farbe für die Gebiete im Diagramm, auf die die erstellte Bedingung nicht zutrifft.|
|chartColors[i].conditionTrue|nein|String|rgb(0, 67, 122, 1)|RGBA-Farbe für die Gebiete im Diagramm, auf die die erstellte Bedingung zutrifft.|
|choroplethDebounceDelay|nein|Number|300|Verzögerung in ms, mit der das Rendering der Choroplethen-Karte nach Tastatureingaben gestartet wird.|
|mapColors[i].conditionFalse|nein|String|rgba(220, 226, 243, 0.8)|RGBA-Farbe für die Gebiete auf der Karte, auf die die erstellte Bedingung nicht zutrifft.|
|mapColors[i].conditionTrue|nein|String|rgba(0, 67, 122, 0.8)|RGBA-Farbe für die Gebiete auf der Karte, auf die die erstellte Bedingung zutrifft.|
|groupBlacklist|nein|String[]|[]|Kategorie-Gruppen, die beim ersten district request nicht berücksichtigt werden|
|referenceLineColor|nein|String|rgba(255, 0, 0, 0.5)|RGBA-Farbe der Referenzwert-Linie im Diagramm|
|readmeUrl[i].de-DE|nein|String|"https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/025_GebieteScreening.md"|URL, die zur Tool-Anleitung führt|


**Beispiel**
```
"districtFinder": {
    "name": "Gebiete Screening",
    "selectedLevelId": "28201",
    "groupBlacklist": ["Bevölkerung Prognose"],
    "chartColors": {
        "conditionFalse": "rgb(220, 226, 243, 1)",
        "conditionTrue": "rgb(0, 67, 122, 1)"
    },
    "mapColors": {
        "conditionFalse": "rgba(220, 226, 243, 0.8)",
        "conditionTrue": "rgba(0, 67, 122, 0.8)"
    },
    referenceLineColor: "rgba(255, 0, 0, 0.5)",
    readmeUrl: {
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/025_GebieteScreening.md"
    },
},
```

***
