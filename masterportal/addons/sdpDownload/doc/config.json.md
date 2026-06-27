#### Portalconfig.menu.modules.children

Liste aller konfigurierbaren Werkzeuge.
(#markdown-header-portalconfigmenutool)** und kann/muss somit auch die dort angegebenen attribute konfiguiert bekommen.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|sdpDownload|nein|**[sdpDownload](#markdown-header-portalconfigmenutoolsdpdownload)**||Intern in Hamburg genutztes Werkzeug um Standard-Datenpakete herunterzuladen. Die Fläche wird bestimmt durch eine geometrische Auswahl auf der Karte.|true|

***

#### Portalconfig.menu.tool.sdpDownload

[inherits]: # (Portalconfig.menu.tool)

Download von Standard-Datenpaketen für Hamburg. Dieses Werkzeug öffnet sich in der Sidebar, rechts von der Karte.

**ACHTUNG: Es ist ein Backend notwendig, das die Datenpakete liefert!**
```
#!json
{
    "id": "compressData_nodejs",
    "name": "compress data",
     "url": "https://test-geofos.fhhnet.stadt.hamburg.de/sdp_download/backend/downloadsdp",
     "typ": "Node"
}
```


|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|name|ja|String||Name des Werkzeuges im Menu.|false|
|icon|nein|String||CSS Klasse des Icons, das vor dem Toolnamen im Menu angezeigt wird.|false|


**Beispiel SDP Download**
```
#!json
"sdpDownload": {
                        "name": "SDP Download",
                        "icon": "bi-download"
                },
```

***
