# config.json 3.0
## Datatypes
### Datatypes Snippets [componentName: `snippetFeatureInfo`]

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|type|ja|String||Der Typ des Snippets. Diese Dokumentation bezieht sich auf den type `customComponent`.|true|
|componentName|ja|String||Der Name der Komponente. Diese Dokumentation bezieht sich auf den componentName `snippetFeatureInfo`.|true|
|||||||
|beautifiedAttrName|nein|**[BeautifiedAttrName](#datatypessnippetsbeautifiedattrname)**||Zum Überschreiben der Attributnamen, die im Steckbrief angezeigt werden.|false|
|universalSearch|nein|**[UniversalSearch](#datatypessnippetsuniversalsearch)**||Der gefilterte Wert kann im Web gesucht werden.|false|

**Beispiel**

Beispiel für ein Feature-Info-Snippet. Zeigt alle Werte der konfigurierten Attributnamen `attrName` aller gefilterten Objekte im Filter an.

```json
{
    "type": "customComponent",
    "componentName": "snippetFeatureInfo",
    "title": "Steckbrief",
    "attrName": ["tierartengruppe", "deutscher_artname", "artname", "rote_liste_d", "rote_liste_hh"],
    "universalSearch": {
      "attrName": "Wissenschaftlicher Name",
      "prefix": "https://www.google.com/search?q="
    },
    "beautifiedAttrName": {
      "tierartengruppe": "Tierartengruppe",
      "familie": "Familie"
    }
}
```

#### Datatypes.Snippets.UniversalSearch {data-toc-label='UniversalSearch'}

Ein Objekt zur Suche der Werte im Web

**Object**

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|attrName|ja|String||Der Attribute Name|false|
|prefix|ja|String||Die Website als Prefix für die Suche|false|

**Beispiel**

```json
{
    "attrName": "Wissenschaftlicher Name",
    "prefix": "https://www.ecosia.org/search?q="
}
```

***

#### Datatypes.Snippets.BeautifiedAttrName {data-toc-label='BeautifiedAttrName'}

Ein object zur Konfiguration des Attribute-Name

**Object**

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|attrName|ja|String||Der Attribute-Name|false|

**Beispiel**

```json
{
    "attrName": "beautified Name"
}
```
