## gfi_theme_params ##
Hier werden die speziellen Parameter von Dipas für die GFI-Templates definiert.

|Name|params|
|----|------|
|dipas|**[params](#markdown-header-gfi_theme_dipas_params)**|

***

## gfi_theme_dipas_params ##
Hier werden die Parameter für das GFI-Template "dipas" definiert.

|Name|Verpflichtend|Typ|default|Beschreibung|
|----|-------------|---|-------|------------|
|gfiIconPath|nein|String|undefined|Pfad für das Icon das als Fallback genutzt wird, falls kein Icon definiert ist. z.B. https://geoportal-hamburg.de/lgv-beteiligung/icons/einzelmarker_dunkel.png|

**Beispiel gfiTheme für das template "Default":**

```
#!json
"gfiTheme": {
   "name": "dipas",
   "params": {
        "gfiIconPath":  "https://geoportal-hamburg.de/lgv-beteiligung/icons/einzelmarker_dunkel.png",
   }
}
```

***
