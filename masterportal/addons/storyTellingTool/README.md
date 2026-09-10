# storyTellingTool

Technisches Addon-Set fuer Masterportal, bestehend aus:
- storyManager: Erstellen, Bearbeiten, Import/Export von Stories
- storyPlayer: Wiedergabe von Stories inklusive kapitelweiser Kartensteuerung

## Inhaltsverzeichnis
- [Features](#features)
- [Repository Layout](#repository-layout)
- [Architektur](#architektur)
- [Integration in Masterportal](#integration-in-masterportal)
- [Wichtige Konfigurationsparameter](#wichtige-konfigurationsparameter)
- [Story-Datenmodell (vereinfacht)](#story-datenmodell-vereinfacht)
- [Quickstart (Endnutzer)](#quickstart-endnutzer)
- [Quickstart: 1) Story erstellen](#1-story-erstellen)
- [Quickstart: 2) Erstes Kapitel anlegen](#2-erstes-kapitel-anlegen)
- [Quickstart: 3) Inhalte einfuegen](#3-inhalte-einfuegen)
- [Quickstart: 4) Elemente und Kapitel sortieren](#4-elemente-und-kapitel-sortieren)
- [Quickstart: 5) Kapitel und Story speichern](#5-kapitel-und-story-speichern)
- [Quickstart: 6) Story abspielen](#6-story-abspielen)
- [Quickstart: 7) Story exportieren und importieren](#7-story-exportieren-und-importieren)
- [Quickstart: 8) Haeufige Stolpersteine](#8-haeufige-stolpersteine)
- [Quickstart: 9) Empfohlener Minimal-Workflow](#9-empfohlener-minimal-workflow)
- [Manual (Endnutzer)](#manual-endnutzer)
- [Manual: 1. Einstieg in den Story Manager](#1-einstieg-in-den-story-manager)
- [Manual: 2. Neue Story anlegen](#2-neue-story-anlegen)
- [Manual: 3. Titelbild hinzufuegen/entfernen](#3-titelbild-zur-story-hinzufuegen-oder-entfernen)
- [Manual: 4. Kapitel anlegen](#4-kapitel-anlegen)
- [Manual: 5. Kartenposition festlegen](#5-kartenposition-fuer-ein-kapitel-festlegen)
- [Manual: 6. Layer hinzufuegen/entfernen](#6-layer-pro-kapitel-hinzufuegen-oder-entfernen)
- [Manual: 7. Werkzeug setzen](#7-werkzeug-pro-kapitel-setzen-optional)
- [Manual: 8. Inhaltselemente einfuegen](#8-inhaltselemente-in-ein-kapitel-einfuegen)
- [Manual: 9. Inhaltselemente bearbeiten](#9-inhaltselemente-bearbeiten-loeschen-sortieren)
- [Manual: 10. Kapitel bearbeiten](#10-kapitel-bearbeiten-loeschen-sortieren)
- [Manual: 11. Story speichern und Vorschau](#11-story-speichern-vorschau-abbrechen)
- [Manual: 12. Story abspielen](#12-story-abspielen)
- [Manual: 13. Vollbild und Story-Link](#13-vollbild-und-story-link)
- [Manual: 14. Story exportieren/importieren](#14-story-exportieren-und-importieren)
- [Manual: 15. Typische Fehler und Loesungen](#15-typische-fehler-und-loesungen)
- [Manual: 16. Empfehlung fuer gute Stories](#16-empfehlung-fuer-gute-stories)
- [Entwicklung und Qualitaet](#entwicklung-und-qualitaet)
- [Konfigurationsreferenz](#konfigurationsreferenz)
- [Lizenz](#lizenz)

## Features
- Story-Metadaten: Titel, Beschreibung, Autor, Coverbild
- Kapitelverwaltung: Anlegen, Bearbeiten, Sortieren, Loeschen
- Kartenkontext pro Kapitel: Center, Zoom, Layer, optional Tool-Referenz
- Inhaltselemente pro Kapitel: Text, Bild, Feature, optional Video
- ZIP-basierter Story-Import und -Export (inkl. Medien)
- 2D/3D-Unterstuetzung mit 3D-Warnung bei nicht verfuegbarem 3D-Button

## Repository Layout
```text
storyTellingTool/
	docs/
		manual.md
		quickstart.md
	shared/
	storyCreator/
	storyManager/
		components/StoryManager.vue
		store/
		shared/js/storyZipCreator.js
		index.js
	storyPlayer/
		components/StoryPlayer.vue
		components/StoryPlayerToolbar.vue
		store/
		index.js
```

## Architektur
- storyManager exportiert ein Tool-Bundle mit Vue-Komponente, Vuex-Store und kombinierten storyManager/storyCreator-Locales.
- storyPlayer exportiert ein Tool-Bundle mit Vue-Komponente, Vuex-Store und eigenen Locales.
- Medien werden als Image-Assets verwaltet und zusammen mit der Story als ZIP serialisiert.

## Integration in Masterportal

### 1) Addons registrieren
In addons/addonsConf.json:

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

### 2) In Portal aktivieren
In portal/<portalname>/config.js unter Config.addons beide Keys eintragen:

```js
Config.addons = [
		"storyManager",
		"storyPlayer"
];
```

Empfehlung: storyManager und storyPlayer gemeinsam aktivieren, damit Erstellung und Wiedergabe im selben Portal verfuegbar sind.

## Wichtige Konfigurationsparameter

### storyManager state
Typische Schluessel aus storyManager/store/state.js:
- enableCreator (default true): Erstellung/Bearbeitung/Download erlauben
- enableImport (default true): ZIP-Import erlauben
- enableVideo (default false): Video-Element im Kapitel-Editor erlauben
- fixedStoryPath (default ./assets): Pfad fuer feste Story-ZIPs
- fixedStoryFiles (default []): Liste fester Story-Dateinamen ohne .zip
- subjectLayerCategory: Layerbaum-Fokus fuer Fachlayer
- toolStoryWhitelist: erlaubte Tool-IDs fuer Kapitel-Toolauswahl

### storyPlayer state
Typische Schluessel aus storyPlayer/store/state.js:
- fixedStoryName: Story-Dateiname (ohne Endung), die direkt geladen wird
- fixedStoryPath: Pfad zur Story-ZIP
- duration (default 1000): Animationsdauer fuer Kapitelwechsel

## Story-Datenmodell (vereinfacht)
```json
{
	"title": "Story title",
	"description": "...",
	"author": "...",
	"created": "DD.MM.YYYY",
	"imageSrc": "asset-id",
	"imageAlt": "...",
	"imageCopyright": "...",
	"chapters": [
		{
			"title": "Kapitel 1",
			"map": {
				"center": [x, y],
				"zoomLevel": 7,
				"layers": ["baselayerId", "subjectLayerId"],
				"tool": "measure"
			},
			"navigation3D": {
				"cameraPosition": [lon, lat, height],
				"heading": 0,
				"pitch": 0,
				"roll": 0
			},
			"is3D": false,
			"content": [
				{"type": "doc", "content": []},
				{"type": "image", "id": "asset-id", "attrs": {"alt": "...", "copyright": "..."}},
				{"type": "feature", "attrs": {}},
				{"type": "video", "attrs": {"link": "...", "title": "..."}}
			]
		}
	]
}
```

## Quickstart (Endnutzer)
Diese Kurzanleitung fuehrt in wenigen Schritten von der ersten Story bis zur Wiedergabe.

### 1) Story erstellen
1. Story Manager oeffnen.
2. Auf Neue Story erstellen klicken.
3. Titel, Beschreibung und Autor eintragen.
4. Optional ein Titelbild mit Alt-Text und Copyright hinzufuegen.

### 2) Erstes Kapitel anlegen
1. Auf Kapitel hinzufuegen klicken.
2. Kapiteltitel vergeben.
3. Karte auf die gewuenschte Ansicht bewegen.
4. Position uebernehmen klicken (Koordinate + Zoom werden gespeichert).
5. Basislayer waehlen und benoetigte Fachlayer aktivieren.
6. Optional ein Werkzeug auswaehlen.

### 3) Inhalte einfuegen
Im Bereich Inhalte hinzufuegen je nach Bedarf:
- Text
- Bild
- Feature (Objekt in der Karte anklicken)
- Video (falls im Portal aktiviert)

Danach jedes Element speichern.

### 4) Elemente und Kapitel sortieren
- Reihenfolge per Ziehen am Griffsymbol anpassen.
- Loeschen ueber das Schliessen-/Muelleimer-Symbol am Element oder Kapitel.

### 5) Kapitel und Story speichern
1. Kapitel speichern.
2. Zurueck in der Story-Ansicht Story speichern.

### 6) Story abspielen
1. Im Story Manager bei der Story auf Abspielen klicken.
2. Kapitel per Pfeil hoch/runter oder Scrollen durchlaufen.
3. Feature-Buttons im Kapitel oeffnen Karteninfos.

### 7) Story exportieren und importieren
#### Export
- Im Story Manager auf Download klicken.
- Ergebnis ist eine ZIP-Datei.

#### Import
1. Im Story Manager auf Importieren klicken.
2. ZIP-Datei auswaehlen.
3. Story erscheint in der Liste.

### 8) Haeufige Stolpersteine
- Karte geaendert, aber falscher Ausschnitt beim Abspielen: Position im Kapitel erneut uebernehmen.
- Feature kann nicht ausgewaehlt werden: passenden Layer im Kapitel aktivieren.
- 3D-Warnung beim Import/Abspielen: Story enthaelt 3D-Kapitel, aber 3D ist im Portal ggf. deaktiviert.

### 9) Empfohlener Minimal-Workflow
1. Story-Metadaten pflegen.
2. Pro Kapitel zuerst Karte/Layers, dann Inhalte.
3. Kapitelreihenfolge pruefen.
4. Vorschau/Abspielen testen.
5. ZIP exportieren.

## Manual (Endnutzer)
### Ziel dieses Handbuchs
Dieses Handbuch erklaert fuer Endnutzer, wie Sie im storyTellingTool:
- eine neue Story anlegen
- Kapitel hinzufuegen, bearbeiten, sortieren und loeschen
- Kartenpositionen festlegen
- Layer und optional ein Werkzeug pro Kapitel setzen
- Inhalte in Kapitel einfuegen (Text, Bild, Karten-Feature, optional Video)
- Stories speichern, exportieren, importieren und abspielen

Hinweis: Je nach Portal-Konfiguration koennen einzelne Funktionen ausgeblendet sein (zum Beispiel Import, Video oder 3D).

### 1. Einstieg in den Story Manager
Im Story Manager sehen Sie die Uebersicht aller verfuegbaren Stories.

Typische Bedienelemente:
- Neue Story erstellen
- Story importieren (ZIP)
- Story-Karte abspielen
- Story-Karte bearbeiten
- Story-Karte herunterladen (ZIP)

Wenn eine Story als schreibgeschuetzt markiert ist, kann sie meist abgespielt, aber nicht bearbeitet werden.

### 2. Neue Story anlegen
1. Oeffnen Sie den Story Manager.
2. Klicken Sie auf Neue Story erstellen.
3. Tragen Sie die Grunddaten ein:
- Story-Titel
- Beschreibung
- Autor
4. Optional: Fuegen Sie ein Titelbild ein.
5. Fuegen Sie mindestens ein Kapitel hinzu.
6. Speichern Sie die Story.

Ohne Titel und ohne Kapitel ist eine sinnvolle Vorschau/Wiedergabe nicht moeglich.

### 3. Titelbild zur Story hinzufuegen oder entfernen
1. Klicken Sie im Story-Editor auf den Bildbereich der Story.
2. Waehlen Sie eine Bilddatei aus.
3. Hinterlegen Sie Alternativtext und Copyright-Hinweis.
4. Speichern Sie das Bild.

Bild entfernen:
- Klicken Sie auf das Schliessen-Symbol am Bild, um das Story-Titelbild zu entfernen.

### 4. Kapitel anlegen
1. Klicken Sie auf Kapitel hinzufuegen.
2. Sie wechseln in den Kapitel-Editor.
3. Vergeben Sie einen Kapiteltitel.
4. Legen Sie Karteneinstellungen fest (Position, Layer, Werkzeug).
5. Fuegen Sie Kapitelinhalte hinzu.
6. Speichern Sie das Kapitel.

Nach dem Speichern landen Sie wieder in der Kapiteluebersicht der Story.

### 5. Kartenposition fuer ein Kapitel festlegen
1. Navigieren Sie die Karte auf die gewuenschte Position und Zoomstufe.
2. Klicken Sie im Kapitel-Editor auf Position uebernehmen (Kartensymbol/Positions-Button).
3. Pruefen Sie die angezeigten Koordinaten und Zoomstufe.

Wichtig:
- Wenn Sie die Karte danach erneut verschieben, zeigt das Tool einen Hinweis, dass sich die Position geaendert hat.
- Uebernehmen Sie die Position dann erneut, damit das Kapitel mit der richtigen Ansicht startet.

### 6. Layer pro Kapitel hinzufuegen oder entfernen
#### 6.1 Basislayer waehlen
1. Oeffnen Sie die Basislayer-Auswahl im Kapitel-Editor.
2. Waehlen Sie genau einen Basislayer.

#### 6.2 Fachdaten-Layer hinzufuegen
1. Oeffnen Sie die Layer-Auswahl.
2. Aktivieren Sie die benoetigten Layer (Mehrfachauswahl moeglich).

#### 6.3 Layer entfernen
- Entfernen Sie Layer ueber das Entfernen-Symbol am Layer-Tag in der Auswahl.

Hinweis zu 3D:
- Wenn ein gewaehlter Layer ein 3D-Layer ist, wechselt das Kapitel in den 3D-Kontext.
- Ist 3D im Portal nicht aktiv, koennen 3D-Kapitel beim Import oder Abspielen nur eingeschraenkt nutzbar sein.

### 7. Werkzeug pro Kapitel setzen (optional)
1. Oeffnen Sie die Werkzeug-Auswahl im Kapitel-Editor.
2. Waehlen Sie ein Werkzeug, das beim Kapitel mitgedacht werden soll.

Werkzeug entfernen:
- Klicken Sie auf das Entfernen-Symbol am ausgewaehlten Werkzeug.

### 8. Inhaltselemente in ein Kapitel einfuegen
Im Bereich Inhalte hinzufuegen koennen Sie Elemente erstellen. Je nach Konfiguration sind folgende Typen verfuegbar:
- Text
- Bild
- Karten-Feature
- Video (optional)

#### 8.1 Text einfuegen
1. Waehlen Sie Inhalt hinzufuegen > Text.
2. Erfassen oder formatieren Sie den Text.
3. Speichern Sie den Textelement-Block.

#### 8.2 Bild einfuegen
1. Waehlen Sie Inhalt hinzufuegen > Bild.
2. Laden Sie ein Bild hoch.
3. Pflegen Sie Alternativtext und Copyright.
4. Speichern Sie das Bildelement.

#### 8.3 Karten-Feature einfuegen
1. Waehlen Sie Inhalt hinzufuegen > Feature.
2. Stellen Sie sicher, dass mindestens ein passender Layer im Kapitel aktiv ist.
3. Klicken Sie in der Karte auf das gewuenschte Objekt.
4. Bearbeiten Sie Titel, Beschreibung und bei Bedarf Attribute.
5. Speichern Sie das Feature-Element.

#### 8.4 Video einfuegen (optional)
1. Waehlen Sie Inhalt hinzufuegen > Video.
2. Tragen Sie den Video-Link ein.
3. Ergaenzen Sie Titel und optional zugaengliche Beschreibung.
4. Speichern Sie das Video-Element.

### 9. Inhaltselemente bearbeiten, loeschen, sortieren
#### 9.1 Bearbeiten
- Klicken Sie ein vorhandenes Element an, um es erneut zu oeffnen und zu bearbeiten.

#### 9.2 Loeschen
- Nutzen Sie das Schliessen- bzw. Loeschen-Symbol direkt am jeweiligen Inhaltselement.

#### 9.3 Reihenfolge aendern
- Ziehen Sie Elemente am Griffsymbol (Drag-Handle) an die gewuenschte Position.

### 10. Kapitel bearbeiten, loeschen, sortieren
#### 10.1 Kapitel bearbeiten
- Klicken Sie in der Story-Uebersicht auf eine Kapitel-Karte oder auf Bearbeiten.

#### 10.2 Kapitel loeschen
- Klicken Sie auf das Loeschen-Symbol an der Kapitel-Karte.

#### 10.3 Kapitel sortieren
- Ziehen Sie Kapitel in der Liste am Griffsymbol in die gewuenschte Reihenfolge.

### 11. Story speichern, Vorschau, Abbrechen
#### 11.1 Speichern
- Klicken Sie auf Story speichern.
- Die Story erscheint danach im Story Manager.

#### 11.2 Vorschau
- Klicken Sie auf Vorschau, um die Story direkt im Story Player zu pruefen.

#### 11.3 Bearbeitung abbrechen
- Mit Verwerfen/Zurueck verlassen Sie den Editor ohne finale Speicherung.

Hinweis:
- Beim Navigieren zwischen Story- und Kapitelansicht kann das Tool Zwischenstaende automatisch sichern.

### 12. Story abspielen
1. Oeffnen Sie den Story Manager.
2. Klicken Sie auf Abspielen auf der gewuenschten Story.
3. Im Story Player bewegen Sie sich durch die Kapitel:
- ueber Pfeil-Schaltflaechen (hoch/runter)
- oder durch Scrollen
4. Kartenposition, Layer und Inhalte werden kapitelweise geladen.

Bei Feature-Elementen:
- Klicken Sie auf das Feature im Kapitelinhalt, um die Karteninformation zu oeffnen.

### 13. Vollbild und Story-Link
Im Story Player stehen in der Kopfleiste in der Regel folgende Optionen zur Verfuegung:
- Vollbild ein/aus
- Story-Link kopieren (wenn fuer feste Story-Pfade konfiguriert)

### 14. Story exportieren und importieren
#### 14.1 Export (Download)
1. Oeffnen Sie den Story Manager.
2. Klicken Sie bei einer Story auf Download.
3. Die Story wird als ZIP-Datei gespeichert.

#### 14.2 Import
1. Klicken Sie im Story Manager auf Importieren.
2. Waehlen Sie eine gueltige ZIP-Datei.
3. Die Story wird in die Liste uebernommen.

Moegliche Hinweise beim Import:
- Ungueltige ZIP-Datei: Importfehler.
- 3D-Kapitel vorhanden, aber 3D im Portal deaktiviert: Warnhinweis.

### 15. Typische Fehler und Loesungen
- Position passt nicht: Position im Kapitel erneut uebernehmen.
- Feature nicht waehlbar: Pruefen, ob der passende Layer im Kapitel aktiv ist.
- Vorschau startet nicht sinnvoll: Mindestens ein Kapitel anlegen und Story-Titel setzen.
- Import klappt nicht: ZIP-Datei pruefen und sicherstellen, dass sie aus dem Story-Export stammt.

### 16. Empfehlung fuer gute Stories
- Pro Kapitel nur eine Kernaussage.
- Karte zuerst ausrichten, dann Inhalte einfuegen.
- Aussagekraeftige Titel fuer Story, Kapitel und Features nutzen.
- Bei Bildern immer Alt-Text und Copyright pflegen.
- Kapitelreihenfolge am Ende pruefen und als Nutzer durchscrollen.

## Entwicklung und Qualitaet
- Addon liegt im separaten addons-Repository (eigene Commits/Pushes im addons-Kontext).
- Vor finalen Aenderungen im Gesamtprojekt den Standard-Gate ausfuehren:
```bash
npm run prePushHook
```
- Relevante Unit-Tests liegen unter:
	- storyManager/tests/unit
	- storyCreator/tests/unit
	- storyPlayer/tests/unit

## Konfigurationsreferenz
- Vollstaendige Konfigurationsuebersicht: [config.json.md](config.json.md)

## Lizenz
Siehe zentrale Lizenzdatei im addons-Repository.
