#### Portalconfig.menu.tools.children

List of all configurable tools. Each tool inherits from **[tool](#markdown-header-portalconfigmenutool)** and thus can/must also have the attributes specified there configured.

|Name|Required|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|quickResponseCode|no|**[quickResponseCode](#markdown-header-portalconfigmenutoolquickresponsecode)**||quickResponseCode.|true|

***

#### Portalconfig.menu.tool.quickResponseCode

|Name|Required|Type|Default|Description|Expert|
|----|--------|----|-------|-----------|------|
|projection|no|String|"25832"|Gibt die Projektion an, in der die Koordinaten in die URL eingesetzt werden. (*EPSG:25832* ist der Standard des Masterportal)|true|
|text|no|String|"additional:modules.tools.quickResponseCode.text"|Gibt den Text an der im Toolwindow angezeigt wird.|true|
|urlSchema|no|String|"https://www.google.de/maps/@{{LAT}},{{LON}}"|Für urlSchema gibt es 2 Platzhalter:
- `{{LAT}}`
- `{{LON}}`aa
die mit den Koordinaten des Klickevent beim Platzieren ersetzt werden.|true|


**Beispiel**

```json
"quickResponseCode": {
    "name": "QR-Code",
    "icon": "bi-qr-code",
    "urlSchema": "https://www.google.de/maps/@{{LAT}},{{LON}}",
    "text": "Lorem ipsum",
    "projection": "EPSG:25832"
}
```
