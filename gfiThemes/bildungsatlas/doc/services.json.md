## gfi_theme_params ##
Hier werden die speziellen Parameter vom Bildungsatlas für die GFI-Templates definiert.

|Name|params|
|----|------|
|bildungsatlas|**[params](#markdown-header-gfi_theme_bildungsatlas_params)**|

***

## gfi_theme_bildungsatlas_params ##
Hier werden die Parameter für das GFI-Template "bildungsatlas" definiert.

|Name|Verpflichtend|Typ|default|Beschreibung|
|----|-------------|---|-------|------------|
|subTheme|nein|String|undefined|Durch Verwendung von Sub-Themes können komplexe Gfi-Themes entlang der Vererbungshierarchie in Unterbereiche aufgeteilt und besser handhabbar gemacht werden.|
|chartOptions|nein|Object|false|Durch die Angabe von Optionen für ChartJS können die Diagramme individuell angepasst werden. Jedese Diagramm basiert auf einem bestimmten Merkmal, das als Schlüssel mit angegeben werden muss (siehe Beispiel). Sollten keine Werte angegeben werden, so greift der Default bzw. greifen die Automatismen von ChartJS.|

**Beispiel gfiTheme für das template "Default":**

```
#!json
"gfiTheme": {
   "name": "bildungsatlas",
   "params": {
      "subTheme":  "BildungsatlasBalkendiagramm",
      "chartOptions": {
         "anzahl_sus_primarstufe": {
            "suggestedMin": 0,
            "suggestedMax": 6000,
            "stepSize": 1000
         }
      }
   }
}
```

***
