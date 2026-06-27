#### Portalconfig.menu.tools.children

Liste aller konfigurierbaren Werkzeuge. Jedes Werkzeug erbt von **[tool](#markdown-header-portalconfigmenutool)** und kann/muss somit auch die dort angegebenen attribute konfiguriert bekommen.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|planParken|nein|**[planParken](#markdown-header-portalconfigmenusectionsmodulesplanparken)**||Hamburg spezifisches Werkzeug um die Parkplätze und Stellplätze in Hamburg über eine zu zeichnende Geometrie abfragen zu können.|true|

***

#### Portalconfig.menu.tool.planParken

[inherits]: # (Portalconfig.menu.tool)

Abfrage der Informationen zum öffentlichen und privaten Parken in einem auszuwählenden Gebiet.

**ACHTUNG: Backend notwendig!**

**Es wird über einen WPS eine FME-Workbench angesprochen, welche die Anzahl der Einwohner berechnet, unter Beachtung des Datenschutzes.**

**Verwendung OGC API Processes Dienste**

OGC API Processes Dienste können über die Optionen `serviceId` und `processName`
Konfiguriert werden. Es werden alle Werte aus der Antwort des Dienstes in der
Tabelle dargestellt. Übersetzungen der Attributnamen können in den Masterportal
Übersetzungsdateien unter "modules.PlanParken.result.ATTRIBUTNAME" hinzugefügt werden.

Siehe Details zur Konfiguration mit OGC API Processes Dienst im Beispiel unten.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|name|ja|String||Name des Werkzeuges im Menu.|false|
|icon|nein|String||CSS Klasse des Bootstrap Icon, das vor dem Toolnamen im Menu angezeigt wird. |false|
|type|ja|String||ID des Addons: planParken|false|
|wpsId|nein|String|"1001"|In rest-services.[...].json konfigurierte Service-ID. Für Rückwärtskompatibilität beibehalten. Wird von `serviceId` überschrieben. |false|
|serviceId|nein|String|null|In rest-services.[...].json konfigurierte Service-ID. Überschreibt `wpsId`. |false|
|fmwProcess|nein|String|"einwohner_ermitteln.fmw"|Name des zu verwendenden Processes. Für Rückwärtskompatibilität beibehalten. Wird von `processName` überschrieben. |false|
|processName|nein|String|null|Name des zu verwendenden Processes. Überschreibt `fmwProcess`. |false|
|secret|nein|String|null|Secret String für den FME Prozess.|false|
|baseUrl|nein|String|`"https://geodienste.hamburg.de/HH_WPS?tm_ttl=50"`|Die Base url für den FME Prozess.|false|
|formatValueOfKeys|nein|Array|`[]`|Liste der Schlüssel, deren Werte vor der Anzeige formatiert werden sollen.|false|

**Beispiel Parkplatzabfrage**
```
#!json
{
    "type": "planParken"
}
```

**Beispiel Parkplatzabfrage OGC API Processes**

_config.json_
```json
{
    "type": "planParken",
    "serviceId": "1234",
    "processName": "einwohner_polygon"
}
```
***
