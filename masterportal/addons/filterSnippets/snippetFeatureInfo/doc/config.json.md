# config.json 3.0
## Datatypes
### Datatypes Snippets [componentName: `snippetFeatureInfo`]

|Name|Required|Type|Default|Description|Expert|
|----|--------|----|-------|-----------|------|
|type|yes|String||The type of the snippet. This documentation refers to the type `customComponent`.|true|
|componentName|yes|String||The name of the component. This documentation refers to the componentName `snippetFeatureInfo`.|true|
|||||||
|beautifiedAttrName|no|**[BeautifiedAttrName](#datatypessnippetsbeautifiedattrname)**||To override the attribute names displayed in the profile.|false|
|universalSearch|no|**[UniversalSearch](#datatypessnippetsuniversalsearch)**||The filtered value can be searched on the web.|false|

**Example**

Example of a feature info snippet. Displays all values of the configured attribute names `attrName` of all filtered objects in the filter.

```json
{
    "type": "customComponent",
    "componentName": "snippetFeatureInfo",
    "title": "Profile",
    "attrName": ["tierartengruppe", "deutscher_artname", "artname", "rote_liste_d", "rote_liste_hh"],
    "universalSearch": {
      "attrName": "Scientific Name",
      "prefix": "https://www.google.com/search?q="
    },
    "beautifiedAttrName": {
      "tierartengruppe": "Animal Group",
      "familie": "Family"
    }
}
```

#### Datatypes.Snippets.UniversalSearch {data-toc-label='UniversalSearch'}

An object for searching values on the web

**Object**

|Name|Required|Type|Default|Description|Expert|
|----|--------|----|-------|-----------|------|
|attrName|yes|String||The attribute name|false|
|prefix|yes|String||The website prefix for the search|false|

**Example**

```json
{
    "attrName": "Scientific Name",
    "prefix": "https://www.ecosia.org/search?q="
}
```

***

#### Datatypes.Snippets.BeautifiedAttrName {data-toc-label='BeautifiedAttrName'}

An object for configuring the attribute name

**Object**

|Name|Required|Type|Default|Description|Expert|
|----|--------|----|-------|-----------|------|
|attrName|yes|String||The attribute name|false|

**Example**

```json
{
    "attrName": "beautified Name"
}
```

