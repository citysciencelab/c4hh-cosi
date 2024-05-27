# Portalconfig.menu.tools.children

Liste aller konfigurierbaren Werkzeuge. Jedes Werkzeug erbt von **[tool](#markdown-header-portalconfigmenutool)** und kann/muss somit auch die dort angegebenen attribute konfiguiert bekommen.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|vcOblique|nein|**[obliqueViewer](#markdown-header-portalconfigmenutoolschildrenvcOblique)**||Werkzeug zum einbinden der SchrÃ¤gluftbildanwendung von vcs.|false|



## Portalconfig.menu.tools.children.vcOblique

Werkzeug zum einbinden der SchrÃ¤gluftbildanwendung von vcs in der Sidebar.
Die SchrÃ¤gluftbildanwendung muss auf dem gleichen Server liegen, damit sie im iFrame eingebunden werden kann.
Der Pfad zur SchrÃ¤gluftbildanwendung wird in der rest-services.json angegeben.
**Beispiel**
```
#!json
    {
    "id": "oblique",
    "name": "vcsOblique",
    "url": "https://localhost:9001/Schraegluftbilder/",
    "typ": "url"
  }
```
Der mapMarker kann Ã¼ber die styleId in der config.json konfiguriert werden und muss dafÃ¼r in der style.json definiert sein.
**Beispiel**
```
#!json
{
    "styleId": "obliqueViewer",
    "rules":
    [
      {
        "style":
          {
          "type": "icon",
          "imageName": "wifi.svg",
          "imageScale": 5,
          "imageWidth": 32,
          "imageHeight": 32,
          "imageOffsetX": 8,
          "imageOffsetY": 13,
          "imageOffsetXUnit": "pixels",
          "imageOffsetYUnit": "pixels"
          }
      }
    ]
  }
```

Mobil wird das iFrame im window angezeigt.

***


### VcOblique - Konfiguration

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|name|ja|String|SchrÃ¤gluftbilder|Der Titel des Werkzeuges bzw. der Eintrag in der Werkzeugliste|false|
|icon|ja|String|bi-camera-fill|Das zu verwendende Icon.|false|
|styleId|nein|String|"obliqueViewer"|StyleId aus der style.json, um den Mapmarker in der Karte zu stylen, wenn SchrÃ¤gluftbilder geÃ¶ffnet ist.|true|
|dataYear|nein|String|""|Das Jahr der zugrundeliegenden Daten.|false|




**Beispiel**
```
#!json
    "vcOblique": {
    "name": "translate#additional:modules.tools.vcOblique.title",
    "icon": "bi-image",
    "dataYear":"2020"
    }
```

***



