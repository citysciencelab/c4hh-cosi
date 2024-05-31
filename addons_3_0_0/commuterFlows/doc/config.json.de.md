# Portalconfig.menu.tools.children

Liste aller konfigurierbaren Werkzeuge. Jedes Werkzeug erbt von **[tool](#markdown-header-portalconfigmenutool)** und kann/muss somit auch die dort angegebenen attribute konfiguiert bekommen.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|commuterFlows|nein|**[commuterFlows](#markdown-header-portalconfigmenutoolschildrencommuterflows)**||Werkzeug zur Darstellung von Pendlerströmen.|true|



## Portalconfig.menu.tools.children.commuterFlows

**ACHTUNG: Backend notwendig!**

Werkzeug zur Darstellung von Pendlerströmen. Basierend auf einer speziellen WFS-Infrastruktur können hiermit Pendlerströme (Auspendler und Einpendler) grafisch dargestellt werden.

Das Werkzeug umfasst

* die Darstellung der Pendlerströme auf zwei Ebenen: Die Ebene von Landkreisen/kreisfreien Städten und die Ebene von Städten und Gemeinden,
* die Auswahl der Grafischen Darstellung mit Kreis- und Gemeindenamen, Werten, Linien und Kreisen inklusive Animation,
* die Unterscheidung zwischen Auspendler und Einpendler,
* eine beliebig lange Liste aller dargestellten Landkreise bzw. Gemeinden aus denen oder in die gependelt wird,
* Link zum verknüpften Metadaten-Katalog,
* einen Knopf zum Zurücksetzen des Werkzeuges und
* eine **[umfangreiche Konfiguration](#markdown-header-pendlerstrome-konfiguration)**.

Das Werkzeug Pendlerströme ist in drei Module aufgeteilt:

* die **[CommuterAPI](#markdown-header-commuterapi)** die die Daten vom Server abruft und aufbereitet,
* die Klasse CommuterOL mit Schnittpunkten zur einfachen Bedienung der OpenLayers-Funktionen und
* die Vue-Komponente mit der die Oberfläche dargestellt und die Daten aus CommuterAPI mit den Funktionen von CommuterOL kombiniert werden.


***


### Pendlerströme - Konfiguration
Für das Werkzeug Pendlerströme sind viele Kleinigkeiten konfigurierbar gemacht, um das Verhalten und das Aussehen des Werkzeuges nach eigenem Wunsch anzupassen.

|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|name|ja|String|Pendlerströme|Der Titel des Werkzeuges bzw. der Eintrag in der Werkzeugliste|true|
|icon|ja|String|bi-arrow-left-right|Das zu verwendende Icon.|true|
|serviceURL|ja|String|""|Die URL zum zu verwendenden Service.|true|
|metaVerPath|nein|String|""|Ein Link zu den genutzten Metadaten. Wenn angegeben wird er als Link "Weitere Informationen" im Werkzeug angezeigt.|true|
|blacklistedDistricts|nein|String[]| [] |Eine Liste zu ignorierender Landkreise oder Gemeinden.|true|
|listChunk|nein|Number|5|Die Anzahl der Features um die die Liste verlängerbar bzw. verkürzbar sein soll.|true|
|setMarkerOnClickInList|nein|Boolean|true|Bei Klick auf einen Eintrag in der Liste wird der Map-Marker auf die Position des zugehörigen Features in der Map gesetzt.|true|
|onstart|nein|Object|Object|Ein Objekt zur Einstellung der gesetzten Haken beim Start oder Zurücksetzen des Werkzeuges. - Mit den folgenden Punkten im Detail erklärt:|true|
|onstart.captionsChecked|nein|Boolean|true|Setzen des Namen-Hakens beim Start oder Zurücksetzen.|true|
|onstart.numbersChecked|nein|Boolean|true|Setzen des Werte-Hakens beim Start oder Zurücksetzen.|true|
|onstart.beamsChecked|nein|Boolean|true|Setzen des Linien-Hakens beim Start oder Zurücksetzen.|true|
|onstart.animationChecked|nein|Boolean|false|Setzen des Animations-Hakens beim Start oder Zurücksetzen (der Start der Animation kann nicht konfiguriert werden, die Animation startet immer im Stop-Zustand).|true|
|onstart.direction|nein|String|"out"|Für die Auspendler-Radiobox "out", für die Einpendler-Radiobox "in".|true|
|olFont|nein|String|"10pt sans-serif"|Einstellung für die Schriftgröße und Schriftart den Regeln des Canvas-Renderings folgend ( [externer Link Cancas-Rendering](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font) ).|true|
|olFontShadow|nein|Object|Object|Der Hintergrund auf dem die Schrift sitzt - hier sollte ein weißer Schatten mit einer gewissen Dicke eingestellt sein. - Mit den folgenden Punkten im Detail erklärt:|true|
|olFontShadow.color|nein|Number[]|[255, 255, 255, 0.8]|Die Farbe als Array von 4 Zahlen: rot [0..255], grün [0..255], blau [0..255] und der Alpha-Kanal [0..1]. Beispiel für weiß: [255, 255, 255, 1]|true|
|olFontShadow.width|nein|Number|5|Die Dicke des Schrift-Schattens als Wert ab 0 aufwärts (5 sollte gut sein).|true|
|olBeam|nein|Object|Object|Die Darstellungsart der angezeigten Linien in Farbe und Strichstärke - Mit den folgenden Punkten im Detail erklärt:|true|
|olBeam.color|nein|Number[]|[192, 9, 9, 0.8]|Die Farbe als Array von 4 Zahlen: rot [0..255], grün [0..255], blau [0..255] und der Alpha-Kanal [0..1]. Wenn die Farbe nicht angegeben wird (den Key "color" samt Array entfernen), nehmen die Linien die bunten Farben der zugehörigen Animations-Kreise an.|true|
|olBeam.width|nein|Number|3|Die Dicke der Linien als Wert ab 0 aufwärts (3 sollte gut sein).|true|
|olBubbleAlgorithm|nein|String|"linear"|Der für die Berechnung des Kreis-Radius zu verwendenden Algorithmus.|true|
|||String|"linear"|`radius = (maxRadiusPx - minRadiusPx) / maxValue * value + minRadiusPx`|true|
|||String|"log"|`radius = (maxRadiusPx - minRadiusPx) / log10(maxValue) * log10(value) + minRadiusPx`|true|
|||String|"area"|`radius = maxRadiusPx / sqrt(maxValue / PI) * sqrt(value / PI)`|true|
|olBubblePixelMax|nein|Number|50|Die maximale Radius-Größe eines Animations-Kreises in Pixel.|true|
|olBubblePixelMin|nein|Number|5|Die minimale Radius-Größe eines Animations-Kreises in Pixel. Bitte beachten, dass der Algorithmus "area" die hier eingestellte Mindestgröße nicht berücksichtigt.|true|
|olBubbleBorder|nein|Object|Object|Die Darstellung des Randes jedes Animations-Kreises. - Mit den folgenden Punkten im Detail erklärt:|true|
|olBubbleBorder.color|nein|Number[]|[255, 255, 255, 1]|Die Farbe als Array von 4 Zahlen: rot [0..255], grün [0..255], blau [0..255] und der Alpha-Kanal [0..1]. Beispiel für weiß: [255, 255, 255, 1]|true|
|olBubbleBorder.width|nein|Number|1|Die Strichstärke des Randes des Animations-Kreises als Wert ab 0 aufwärts (1 sollte reichen).|true|
|olBubbleColors|nein|Number[]|[siehe "Color Universal Design"](http://people.apache.org/~crossley/cud/cud.html)|Eine Liste von Farben die für die Animations-Kreise verwendet werden sollen. Bitte Barrierefreiheit berücksichtigen.|true|
|olBubbleColorShift|nein|Number[]|[0, -60, 60]|Die Farbverschiebungen als Liste von Werten um die die olBubbleColors ins Dunkle oder Helle verschoben werden sollen, bevor sich die Farben wiederholen. Beispiel: [0, -60, 60]|true|
|olZoomOptions|nein|Object|{padding: [20, 20, 20, 400]}|Die für das Zoomen zu verwendenden Optionen. Wird dieser Eintrag komplett weggelassen, findet kein Zoomen statt.|true|
|olAnimationPaces|nein|Number[]|[5000, 500]|Die Geschwindigkeiten mit denen sich die Animations-Kreise während der Animation bewegen sollen (in Millisekunden). Der erste, dritte, fünfte usw. Wert sind der Hinlauf, der zweite, vierte, sechste usw. Wert sind der Rücklauf. Für ein gleichmäßiges Pendeln reicht die Angabe eines Wertes z.B. [5000] - für ein langsames Hinlaufen und schnelles Zurücklaufen einfach zwei Werte angeben z.B: [5000, 500] - um das Rücklaufen komplett zu unterbinden, einfach eine 0 angeben z.B. [5000, 0] - um was völlig verrücktes zu machen können beliebig viele Werte angegeben werden z.B. [6000, 600, 3000, 300, 1000, 100, 0, 1000, 10000, 0]|true|



**Beispiel**
```
#!json
"CommuterFlows": {
    "name": "translate#additional:modules.tools.CommuterFlows.titleLabel",
    "icon": "bi-arrow-left-right",
    "metaVerPath": "https://metaver.de/trefferanzeige?docuuid=4FC611E9-DDA4-42E5-9EE9-F118BCBB2D89",
    "blacklistedDistricts": ["Bremen", "Berlin", "Kiel", "Hannover"],
    "serviceURL": "https://geodienste.hamburg.de/MRH_WFS_Pendlerstroeme_im_Tool",
    "listChunk": 5,
    "setMarkerOnClickInList": true,
    "onstart": {
        "captionsChecked": true,
        "numbersChecked": true,
        "beamsChecked": true,
        "animationChecked": false,
        "direction": "out"
    },
    "olFont": "10pt sans-serif",
    "olFontShadow": {
        "color": [255, 255, 255, 0.8],
        "width": 5
    },
    "olBeam": {
        "color": [192, 9, 9, 0.8],
        "width": 3
    },
    "olBubbleAlgorithm": "linear",
    "olBubblePixelMax": 50,
    "olBubblePixelMin": 5,
    "olBubbleBorder": {
        "color": [255, 255, 255, 1],
        "width": 1
    },
    "olBubbleColors": [
        [230, 159, 0, 0.75],
        [86, 180, 233, 0.75],
        [0, 158, 115, 0.75],
        [240, 228, 66, 0.75],
        [0, 114, 178, 0.75],
        [213, 94, 0, 0.75],
        [204, 121, 167, 0.75]
    ],
    "olBubbleColorShift": [0, -60, 60],
    "olZoomOptions": {
        "padding": [20, 20, 20, 400]
    },
    "olAnimationPaces": [5000, 500]
}
```

***



### CommuterAPI
Die CommuterAPI realisiert den Zugriff auf die ggf. sehr speziellen Aufrufe am Server (WFS, WSDL, u.m.). Die CommuterAPI generalisiert die erhaltenen Daten, um das Frontend für jede Art von Infrastruktur unverändert nutzen zu können. Theoretisch brauchen Sie für eine andere Backend-Architektur nur eine neue API bauen, die sich nach außen verhält wie im Folgenden beschrieben.

#### Konfiguration der API
|Name|Verpflichtend|Typ|Default|Beschreibung|Expert|
|----|-------------|---|-------|------------|------|
|useProxy|nein|Boolean|false|Benutzen Sie einen Proxy, um die CORS-Regeln zu umgehen, dann kann dies über die Utils getProxyUrl realisiert werden. Dies ist deprecated, da das Ziel sein muss die CORS-Regeln auf Ihren Servern entsprechend anzupassen statt einen Proxy zu verwenden.|true|
|blacklistedDistricts|nein|String[]| [] |Ein Array mit Keywords die sowohl für Kreise als auch für Gemeinden ignoriert werden sollen. Falls Sie Daten einer nicht angebundenen Stadt haben, können Sie diese hier einfach herausnehmen.|true|
|serviceUrl|nein|String|""|Die URL zu Ihrem Service. Wir empfehlen diese wenn möglich konfigurierbar zu machen, falls sich die URL mal ändert, der Service dabei aber unverändert bleibt.|true|

#### Kopplung der API
Die CommuterAPI hat vier Funktionen die implementiert sein müssen. Der Aufruf und die Rückgabe der Funktionen sind generalisiert - d.h. unabhängig von der Infrastruktur. Daher kann die API beliebig angepasst werden um anderen Backend-Anforderungen zu entsprechen.
Um mit den erhaltenen OpenLayers-Features arbeiten zu können, haben diese vom erhaltenen Datensatz unabhängige Werte.

Hier die Beschreibung eines API-Features, wie es z.B. als Element einer *featureList* vom Frontend erwartet wird. Nutzen Sie nach Möglichkeit ol/Feature als Grundlage.

##### API-Feature

|Name|Typ|Beschreibung|
|----|---|------------|
|caption|String|Der anzuzeigende Name des Features. `feature.get("caption")`|
|value|Number|Der anzuzeigende Wert des Features. `feature.get("value")`|
|coordinate|Number[]|Die Koordinate des Features - bitte beachten, dass die Geometrie des Features ggf. eine Linie vom Feature zum Mittelpunkt ist. Die Koordinate ist die Position des Features, nicht die des Mittelpunktes. `feature.get("coordinate")`|
|getGeometry()|Function|Die normale OL-Funktion zum Abruf der Geometrie des Features. Dies sollte eine Linie zwischen dem Feature und dem Mittelpunkt sein. `feature.getGeometry()`|


##### getListDistricts

Dieser Aufruf erzeugt eine simple Liste aller Landkreise oder kreisfreier Städte auf erster Ebene, die an die übergebene Callback-Funktion übergeben wird. Die Liste sollte innerhalb dieses Aufrufes sortiert werden. Die Liste ist ein indiziertes Array aus Strings.

`void := getListDistricts(Function onsuccess, Function onerror).`

* Mit `onsuccess(dataset)` als Funktion mit `String[] dataset` einer einfachen Liste von Namen.
* Mit `onerror(error)` als Error-Handler mit `Error error` zur verarbeitung von Fehlern.


##### getListCities

Dieser Aufruf erzeugt eine simple Liste aller Gemeinden oder Städte auf zweiter Ebene, die an die übergebene Callback-Funktion übergeben wird. Die Liste sollte innerhalb dieses Aufrufes sortiert werden. Die Liste ist ein indiziertes Array aus Strings.

`void := getListCities(Function onsuccess, Function onerror).`

* Mit `onsuccess(String[] dataset)` als Funktion mit `String[] dataset` einer einfachen Liste von Namen.
* Mit `onerror(Error error)` als Error-Handler mit `Error error` zur verarbeitung von Fehlern.


##### getFeaturesDistrict

Dieser Aufruf erzeugt ein generalisiertes Objekt mit den erhaltenen Daten von der Schnittstelle. Hiermit soll jede Funktionalität, die in der Vue-Komponente verlangt wird, abgedeckt sein.

`void := getFeaturesDistrict(String district, Boolean homeToWork, Number start, Number len, Function onsuccess, Function onerror).`

* Mit `String district` als Suchwort zum Abrufen der Daten für diesen Landkreis/kreisfreie Stadt.
* Mit `Boolean homeToWork` mit `true` = Auspendler und `false` = Einpendler.
* Mit `Number start` dem Startpunkt ab dem Daten zugeliefert werden sollen (Pagination Start).
* Mit `Number len` der Länge der zu liefernden Daten ab dem Startpunkt (Pagination Länge).
* Mit `onsuccess(Object dataset)` als Funktion mit `Object dataset` einem [Objekt mit den relevanten Daten](#markdown-header-getfeaturesdistrictonsuccessdataset).
* Mit `onerror(Error error)` als Error-Handler mit `Error error` zur verarbeitung von Fehlern.


###### getFeaturesDistrict onsuccess dataset

An die Callback-Funktion `onsuccess(Object dataset)` wird bei Erfolg ein Objekt mit folgenden Schlüsseln übergeben.

|Schlüssel|Typ|Beschreibung|
|---------|---|------------|
|caption|String|Entspricht dem übergebenen Wert `district`. Wird als Label für den Mittelpunkt verwendet.|
|coordinate|Number[]|Die Koordinate des Mittelpunktes.|
|featureList|ol/Feature[]|Eine Liste von [API-Feature](#markdown-header-api-feature) (aufbereitete ol/Feature) die die Landkreise/kreisfreien Städte beschreiben.|
|totalMin|Number|Der niedrigste Wert der zur Berechnung von Animations-Kreisgrößen verwendet werden soll.|
|totalMax|Number|Der größte Wert der zur Berechnung von Animations-Kreisgrößen verwendet werden soll.|
|totalLength|Number|Die Gesamtzahl verfügbarer Features - die Pagination ignorierend.|
|start|Number|Der gewählte Startpunkt der Pagination.|
|len|Number|Die Anzahl zurückzugebener Elemente ab start.|
|source|String|Ist fix "getFeaturesDistrict" zur besseren Unterscheidung der Datenquelle nach außen.|


##### getFeaturesCity

Dieser Aufruf erzeugt ein generalisiertes Objekt mit den erhaltenen Daten von der Schnittstelle. Hiermit soll jede Funktionalität, die in der Vue-Komponente verlangt wird, abgedeckt sein.

`void := getFeaturesCity(String city, Boolean homeToWork, Number start, Number len, Function onsuccess, Function onerror).`

* Mit `String city` als Suchwort zum Abrufen der Daten für diese Gemeinde.
* Mit `Boolean homeToWork` mit `true` = Auspendler und `false` = Einpendler.
* Mit `Number start` dem Startpunkt ab dem Daten zugeliefert werden sollen (Pagination Start).
* Mit `Number len` der Länge der zu liefernden Daten ab dem Startpunkt (Pagination Länge).
* Mit `onsuccess(Object dataset)` als Funktion mit `Object dataset` einem [Objekt mit den relevanten Daten](#markdown-header-getfeaturescityonsuccessdataset).
* Mit `onerror(Error error)` als Error-Handler mit `Error error` zur verarbeitung von Fehlern.


###### getFeaturesCity onsuccess dataset

An die Callback-Funktion `onsuccess(Object dataset)` wird bei Erfolg ein Objekt mit folgenden Schlüsseln übergeben.

|Schlüssel|Typ|Beschreibung|
|---------|---|------------|
|caption|String|Entspricht dem übergebenen Wert `city`. Wird als Label für den Mittelpunkt verwendet.|
|coordinate|Number[]|Die Koordinate des Mittelpunktes.|
|featureList|ol/Feature[]|Eine Liste von [API-Feature](#markdown-header-api-feature) (aufbereitete ol/Feature) die die Gemeinden beschreiben.|
|totalMin|Number|Der niedrigste Wert der zur Berechnung von Animations-Kreisgrößen verwendet werden soll.|
|totalMax|Number|Der größte Wert der zur Berechnung von Animations-Kreisgrößen verwendet werden soll.|
|totalLength|Number|Die Gesamtzahl verfügbarer Features - die Pagination ignorierend.|
|start|Number|Der gewählte Startpunkt der Pagination.|
|len|Number|Die Anzahl zurückzugebener Elemente ab start.|
|source|String|Ist fix "getFeaturesCity" zur besseren Unterscheidung der Datenquelle nach außen.|





