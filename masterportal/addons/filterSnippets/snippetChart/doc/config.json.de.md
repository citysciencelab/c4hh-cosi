# config.json 3.0
## Datatypes
### Datatypes Snippets [componentName: `snippetChart`]

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|type|ja|String||Der Typ des Snippets. Diese Dokumentation bezieht sich auf den type `customComponent`.|true|
|componentName|ja|String||Der Name der Komponente. Diese Dokumentation bezieht sich auf den componentName `snippetChart`.|true|
|||||||
|alternativeTextForEmptyChart|nein|String||Alternativtext, der anstelle des Diagramms angezeigt wird, sofern es keine Werte enthält.|false|
|chartConfig|ja|**[chartConfig](#datatypessnippetschartconfig)**||Im Zusammenspiel mit 'service' (siehe Beispiel): Die Konfiguration für das Diagramm. Es werden alle Konfigurationsmöglichkeiten (bisher nur "type: bar") von Chart.js unterstützt (siehe: https://www.chartjs.org/docs/latest/configuration/). Zusätzlich ist die Angabe des Parameters 'featureAttributes' erforderlich. Der Parameter gibt an, hinter welchen Attributen sich die anzuzeigenden Daten befinden (siehe Beispiel).|false|
|infoText|nein|String|false|Info-Text zu diesem Snippet. |false|
|subtitle|nein|String[]/String[][]||Erlaubt die Anzeige einer beliebigen Kombination aus Text und Daten als Untertitel zum Diagramm.|false|
|tooltipUnit|nein|String||Fügt an den Zahlenwert im Tooltip ein Einheitenzeichen an.|false|

**Beispiel**

Beispiel für ein Chart Snippet. Fragt die Features aus dem konfigurierten "service" ab und zeigt die Daten der konfigurierten "featureAttributes" in einem Balkendiagramm an.

```json
{
    "type": "customComponent",
    "componentName": "snippetChart",
    "title": "Phänogramm",
    "subtitle": ["Anzahl Beobachtungen = ", ["anzahl_beobachtungen"]],
    "tooltipUnit": "%",
    "chartConfig": {
        "type": "bar",
        "data": {
            "datasets": [{
                "label": "Label",
                "backgroundColor": "rgba(214, 227, 255, 0.8)",
                "featureAttributes": ["januar_1", "februar_1", "maerz_1", "april_1", "mai_1", "juni_1", "juli_1", "august_1", "september_1", "oktober_1", "november_1", "dezember_1"]
            },
            {
                "label": "Label 2",
                "backgroundColor": "rgba(214, 227, 255, 0.8)",
                "featureAttributes": ["januar_2", "februar_2", "maerz_2", "april_2", "mai_2", "juni_2", "juli_2", "august_2", "september_2", "oktober_2", "november_2", "dezember_2"]
            }
        ],
        "labels": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
        },
        "options": {
            "plugins": {
                "legend": {
                    "display": false
                },
                "subtitle": {
                  "display": true,
                  "position": "bottom",
                  }
                }
            }
        }
    },
    "service": {
        "extern": true,
        "type": "WFS",
        "url": "https://qs-geodienste.hamburg.de/HH_WFS_verbreitung_tiere",
        "typename": "verbreitung_tiere_eindeutige_liste",
        "featureNS": "https://registry.gdi-de.org/id/de.hh.up",
        "featureTypes": ["verbreitung_tiere_eindeutige_liste"],
        "filter": {
            "attrName": "artname",
            "operator": "EQ"
        }
    }
}
```

***
#### Datatypes.Snippets.ChartConfig {data-toc-label='ChartConfig'}

[type:object]: # (Datatypes.Snippets.ChartConfig.Object)

Ein Objekt, das ein Diagramm beschreibt. Für weitere informationen **[hier](https://www.chartjs.org/docs/latest/configuration/)** klicken.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|data|ja|**[object](#datatypessnippetschartconfigobject)**||Die Daten. Für weitere Informationen klicken Sie **[hier](https://www.chartjs.org/docs/latest/general/data-structures.html)**|false|
|options|ja|**[object](#datatypessnippetschartconfigobject)**||Optionen für die Erstellung des Diagramms.|false|
|plugins|ja|enum[]||Inline-Plugins können in dieses Array aufgenommen werden. Dies ist ein alternativer Weg, um Plugins für einzelne Diagramme hinzuzufügen (im Gegensatz zur globalen Registrierung des Plugins). Mehr über Plugins in der **[developers section](https://www.chartjs.org/docs/latest/developers/plugins.html)**.|false|
|type|ja|String||Der Diagrammtyp bestimmt den Haupttyp des Diagramms.|false|

**Beispiel**

Die Top-Level-Struktur der Chart.js-Konfiguration:

```json
{
    "chartConfig": {
        "type": 'bar',
        "data": {},
        "options": {},
        "plugins": []
    }
}
```

***

##### Datatypes.Snippets.ChartConfig.Object {data-toc-label='ChartConfig Object'}

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|foo|nein|String||bar|false|

***
