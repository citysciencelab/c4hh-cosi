# storyTellingTool Konfiguration

Diese Datei beschreibt alle relevanten Konfigurationen fuer storyManager und storyPlayer in Masterportal.

## 1. Wo wird konfiguriert

### 1.1 Addon registrieren
Datei: addons/addonsConf.json

```json
"storyPlayer": {
  "path": "storyTellingTool/storyPlayer",
  "type": "tool"
},
"storyManager": {
  "path": "storyTellingTool/storyManager",
  "type": "tool"
}
```

### 1.2 Addon im Portal aktivieren
Datei: portal/<portalname>/config.js

```js
Config.addons = [
    "storyManager",
    "storyPlayer"
];
```

### 1.3 Tool-Parameter setzen
Datei: portal/<portalname>/config.json

Die Parameter werden in den Menu-Sektionen am Tool-Eintrag gesetzt, z. B. in secondaryMenu.sections.

## 2. Minimalbeispiel fuer config.json

```json
{
  "menu": {
    "secondaryMenu": {
      "currentComponent": "storyPlayer",
      "sections": [
        [
          {
            "type": "storyManager",
            "fixedStoryFiles": ["Beispiel-Story1"],
            "fixedStoryPath": "./assets"
          },
          {
            "type": "storyPlayer",
            "fixedStoryName": "Beispiel-Story1",
            "fixedStoryPath": "./assets",
            "parameterName": "story",
            "autoplay": true
          }
        ]
      ]
    }
  }
}
```

## 3. storyManager Konfiguration

### 3.1 Relevante Parameter

| Parameter | Typ | Default | Bedeutung |
|---|---|---|---|
| type | String | - | Muss storyManager sein |
| enableCreator | Boolean | true | Story erstellen/bearbeiten/herunterladen erlauben |
| enableImport | Boolean | true | ZIP-Import erlauben |
| enableVideo | Boolean | false | Video-Element im Kapitel-Editor aktivieren |
| fixedStoryPath | String | ./assets | Relativer Pfad zu festen Story-ZIP-Dateien |
| fixedStoryFiles | String[] | [] | Liste fester Story-Dateinamen ohne .zip |
| subjectLayerCategory | Object | siehe Store | Vorgabe fuer Layer-Kategorie im Kapitel-Editor |
| toolStoryWhitelist | String[] | siehe Store | Erlaubte Tool-IDs fuer die Kapitel-Toolauswahl |

### 3.2 Beispiel: Redaktioneller Modus

```json
{
  "type": "storyManager",
  "enableCreator": true,
  "enableImport": true,
  "enableVideo": true,
  "fixedStoryFiles": ["Geobasiszwilling-Story"],
  "fixedStoryPath": "./assets",
  "toolStoryWhitelist": ["measure", "legend", "coordToolkit", "shareView"]
}
```

### 3.3 Beispiel: Nur lesen

```json
{
  "type": "storyManager",
  "enableCreator": false,
  "enableImport": false,
  "fixedStoryFiles": ["Beispiel-Story1", "Beispiel-Story2"],
  "fixedStoryPath": "./assets"
}
```

## 4. storyPlayer Konfiguration

### 4.1 Relevante Parameter

| Parameter | Typ | Default | Bedeutung |
|---|---|---|---|
| type | String | - | Muss storyPlayer sein |
| fixedStoryName | String | null | Zu ladende Story-Datei ohne .zip |
| fixedStoryPath | String | null | Relativer Pfad zu Story-ZIP-Dateien |
| duration | Number | 1000 | Dauer der Kapitel-Animationen in ms |
| parameterName | String | story (ueblich) | URL-Parametername fuer Story-Auswahl |
| autoplay | Boolean | false (portalabhaengig) | Automatischer Start je nach Portal-Logik |

### 4.2 Beispiel

```json
{
  "type": "storyPlayer",
  "fixedStoryName": "Geobasiszwilling-Story",
  "fixedStoryPath": "./assets",
  "parameterName": "story",
  "autoplay": true,
  "duration": 1000
}
```

## 5. Ablage der festen Stories

### 5.1 Dateinamen
- fixedStoryFiles und fixedStoryName werden ohne Dateiendung konfiguriert.
- Intern wird immer .zip erwartet.

Beispiel:
- Konfiguration: Geobasiszwilling-Story
- Datei: Geobasiszwilling-Story.zip

### 5.2 Pfad
- fixedStoryPath ist relativ zum Portalkontext.
- Ueblich ist ./assets.

### 5.3 Inhalt
- ZIP muss ein gueltiges Story-Exportformat enthalten.
- Bei ungueltigem ZIP zeigt der storyManager einen Importfehler.

## 6. Empfohlene Kombinationen

### 6.1 Voller Redaktionsbetrieb
- storyManager: enableCreator true, enableImport true
- storyPlayer: fixedStoryName optional, duration 1000

### 6.2 Publikationsportal (nur Wiedergabe)
- storyManager: enableCreator false, enableImport false
- storyPlayer: fixedStoryName gesetzt

## 7. Typische Fehlerquellen

- storyManager/storyPlayer nicht in Config.addons: Tools erscheinen nicht.
- type falsch geschrieben: Tool wird nicht geladen.
- fixedStoryPath falsch: ZIP-Dateien werden nicht gefunden.
- fixedStoryName/fixedStoryFiles mit .zip angegeben: Datei wird doppelt erweitert und nicht gefunden.
- 3D-Kapitel bei deaktiviertem 3D-Button: Warnhinweis im Player/Import.

## 8. Referenzen im Repository

- addons/addonsConf.json
- portalconfigs/demoStoryCreator/config.js
- portalconfigs/demoStoryCreator/config.json
- portalconfigs/demoStoryPlayer/config.json
- addons/storyTellingTool/storyManager/store/state.js
- addons/storyTellingTool/storyPlayer/store/state.js
