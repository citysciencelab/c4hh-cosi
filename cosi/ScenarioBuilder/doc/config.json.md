**ScenarioBuilder**

<<<<<<< HEAD
Mit dem ScenarioBuiler können Szenarien angelegt und verwaltet werden. In einem Szenario können Einrichtungen und Wohnquartiere simuliert, sowie bestehende Einrichtungen verändert werden.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|ScenarioBuilder|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-box|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|

**ScenarioBuilder**
```
"ScenarioBuilder": {
  "name": "Szenario Manager",
  "icon": "bi-box",
}
```
=======
Mit dem ScenarioBuiler kann todo todo todo.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Gebiet auswählen|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-box|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|districtLevels|ja|Object[]||Beinhaltet die nötigen Informationen der einzelnen Verwaltungsebenen (siehe Beispiel).|
|additionalInfoLayerIds|nein|String[]|[]|Zusätzliche Info Layer die beim Nutzen des Tools angezeigt werden können.|

**ScenarioBuilder**
```
"DistrictSelector": {
  "name": "ScenarioBuilder",
  "icon": "bi-box",
}
```

***
>>>>>>> 108ebd74 (add new addons_3_0_0 structure-add missing addons)
