**DashboardManager**

<<<<<<< HEAD
Statistische Datenübersicht.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Dashboard|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-speedometer|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|columnHeader|nein|Object|{}|Label von Spalten in Tabelle und exportirter Excel Datei.|
|prefixExportFilename|nein|String|Cosi|Der Prefix der für den Export der Excel Tabelle benutzt wird.|
|exportGrouped|nein|Boolean|false|Wenn der Parameter auf `true` gesetzt ist, wird beim Export für jede Gruppe im Dashboard ein Excel-Sheet erstellt und die Gruppe verschwindet beim Export aus den Spalten.|

**Beispiel**
```
"dashboard": {
    "name": "Dashboard",
    "icon": "bi-table",
    "columnHeader": {
        "orientationValue": "Orientierungswert"
    }
    "prefixExportFilename": "Cosi",
    "exportGrouped": true
}
```
=======
TODO.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Gebiet auswählen|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-list|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|districtLevels|ja|Object[]||Beinhaltet die nötigen Informationen der einzelnen Verwaltungsebenen (siehe Beispiel).|
|districtLevels[i].layerId|ja|String||Die Layer id zum jeweiligen Verwaltungslayer.|
|districtLevels[i].label|ja|String||Die/der Bezeichnung/ Name für die Verwaltungsebene.|
|districtLevels[i].keyOfAttrName|ja|String||Der Key für das Attribut in dem der Name der Verwaltungeinheit steht.|
|districtLevels[i].keyOfAttrNameStats|ja|String||Der Key für das Attribut in dem der Name steht, für die statistischen Daten.|
>>>>>>> 108ebd74 (add new addons_3_0_0 structure-add missing addons)
