###### portalConfig.menu.searchBar.searchInterfaces.gfiOnAddressGaz
Konfiguration des Gazetteer Suchdienstes als Addon zur Darstellung der Ergebnisse im GFI-Tool.

**ACHTUNG: Backend notwendig!**
**Es wird eine Stored Query eines WFS mit vorgegebenen Parametern abgefragt.**

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|searchAddress|nein|Boolean||Gibt an, ob nach Adressen gesucht werden soll.|false|
|searchDistricts|nein|Boolean||Gibt an, ob nach Bezirken gesucht werden soll.|false|
|searchHouseNumbers|nein|Boolean||Gibt an, ob nach Straßen und Hausnummern gesucht werden soll. |false|
|searchParcels|nein|Boolean||Gibt an, ob nach Flurstücken gesucht werden soll.|false|
|searchStreetKey|nein|Boolean||Gibt an, ob nach Straßenschlüsseln gesucht werden soll.|false|
|searchStreets|nein|Boolean||Gibt an, ob nach Straßen gesucht werden soll. Vorraussetzung für **searchHouseNumbers**.|false|
|serviceId|ja|String||Id des Suchdienstes. Wird aufgelöst in der **[rest-services.json](rest-services.json.de.md)**.|false|
|showGeographicIdentifier|nein|Boolean|false|Gibt an, ob das Attribut `geographicIdentifier` zur Anzeige des Suchergebnisses verwendet werden soll.|false|
|type|ja|String|"gfiOnAddressGaz"|Type der Such-Schnittstelle. Definiert welche Such-Schnittstelle konfiguriert ist.|
|title|nein|String||Bestimmt den Titel des GFI-Fensters.|false|
|attributesToShow|nein|Object||Bezieht Attribute aus einem Feature und zeigt diese mit den entsprechenden Werten an. Hier als Beispiel mit den folgenden Attributen: "kreis", "gemeinde", "ortsteil", "strasse", "hausnummer", "strassenname", "postleitzahl".|false|

**Beispiel**

```json
{
    "type": "gfiOnAddressGaz",
    "serviceId": "6",
    "searchAddress": true,
    "searchStreets": true,
    "searchHouseNumbers": true,
    "searchDistricts": true,
    "searchParcels": true,
    "searchStreetKey": true,
    "title": "gfiOnAddress-Addon",
    "attributesToShow": {
        "kreis": "Kreis",
        "gemeinde": "Gemeinde",
        "ortsteil": "Ortsteil",
        "strasse": "Straße",
        "hausnummer": "Hausnummer",
        "strassenname": "Straßenname",
        "postleitzahl": "Postleitzahl"
    }
}
```
