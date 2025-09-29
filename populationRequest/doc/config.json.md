#### Portalconfig.menu.tools.children

Liste aller konfigurierbaren Werkzeuge. Jedes Werkzeug erbt von **[tool](#markdown-header-portalconfigmenutool)** und kann/muss somit auch die dort angegebenen attribute konfiguriert bekommen.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|populationRequest|nein|**[populationRequest](#markdown-header-portalconfigmenutoolpopulationrequest)**||Hamburg spezifisches Werkzeug um die Einwohner in der FHH (Freie und Hansestadt Hamburg) und der MRH (Metropol Region Hamburg) über eine zu zeichnende Geometrie abfragen zu können.|true|

***

#### Portalconfig.menu.tool.populationRequest

[inherits]: # (Portalconfig.menu.tool)

Einwohnerabfrage für Hamburg und die MRH (Metropolregion Hamburg).

**ACHTUNG: Backend notwendig!**

**Es wird über einen WPS eine FME-Workbench angesprochen, welche die Anzahl der Einwohner berechnet, unter Beachtung des Datenschutzes.**

Weitere WPS sowie OGC API Processes können mittlerweile ebenfalls verwendet werden.

**Verwendung weiterer WPS Dienste**

Weitere WPS Dienste können verwendet werden, sofern sich diese hinsichtlich der
Prozesssignatur identisch zum Default-Dienst verhalten. WPS Dienste können über
die Optionen `serviceId`, `mrhId` und `fhhId` konfiguriert werden.

**Verwendung OGC API Processes Dienste**

OGC API Processes Dienste können über die Optionen `serviceId` und `processName`
Konfiguriert werden. Es werden alle Werte aus der Antwort des Dienstes in der
Tabelle dargestellt. Übersetzungen der Attributnamen können in den Masterportal
Übersetzungsdateien unter "modules.PopulationRequest.result.ATTRIBUTNAME" hinzugefügt werden.

Siehe Details zur Konfiguration mit OGC API Processes Dienst im Beispiel unten.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|name|ja|String||Name des Werkzeuges im Menu.|false|
|icon|nein|String||CSS Klasse des Bootstrap Icon, das vor dem Toolnamen im Menu angezeigt wird. |false|
|type|ja|String||ID des Addons: populationRequest|false|
|populationReqServiceId|nein|String|"2"|In rest-services.[...].json konfigurierte Service-ID|false|
|wpsId|nein|String|"1001"|In rest-services.[...].json konfigurierte Service-ID. Für Rückwärtskompatibilität beibehalten. Wird von `serviceId` überschrieben. |false|
|serviceId|nein|String|null|In rest-services.[...].json konfigurierte Service-ID. Überschreibt `wpsId`. |false|
|fmwProcess|nein|String|"einwohner_ermitteln.fmw"|Name des zu verwendenden Processes. Für Rückwärtskompatibilität beibehalten. Wird von `processName` überschrieben. |false|
|processName|nein|String|null|Name des zu verwendenden Processes. Überschreibt `fmwProcess`. |false|
|mrhId|nein|String|"46969C7D-FAA8-420A-81A0-8352ECCFF526"|Id des mrh Prozesses. Ausschließlich für Dienste vom Typ "wfs". Für Rückwärtskompatibilität beibehalten. |false|
|fhhId|nein|String|"B3FD9BD5-F614-433F-A762-E14003C300BF"|Id des fhh Prozesses. Ausschließlich für Dienste vom Typ "wfs". Für Rückwärtskompatibilität beibehalten. |false|
|rasterLayerId|nein|String|"13023"|Id des Rasterlayers für Einwohnerzahlen, der bei Bedarf über die UI eingeblendet werden kann. |false|
|alkisAdressLayerId|nein|String|"9726"|Id des Alkis Adresslayers, der bei Bedarf über die UI eingeblendet werden kann. |false|

**Beispiel Einwohnerabfrage**
```
#!json
{
    "type": "populationRequest"
}
```

**Beispiel Einwohnerabfrage OGC API Processes**

_config.json_
```json
{
    "type": "populationRequest",
    "serviceId": "1234",
    "processName": "einwohner_polygon"

}
```

_rest-services.internet.json_
```json
{
    "id": "1234",
    "name": "Einwohner OAP",
    "url": "https://gisdemo2.dp.dsecurecloud.de/pygeo",
    "typ": "oap"
},
```

***
