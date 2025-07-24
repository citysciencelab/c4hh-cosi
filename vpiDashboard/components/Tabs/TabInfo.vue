<script>
export default {
    name: "TabInfo"
};
</script>

<template>
    <div id="vpiDashboardTabInfo">
        <div class="section">
            <h1>{{ $t("additional:modules.tools.vpidashboard.tabitems.info") }}</h1>

            <div>
                <div>
                    <p>
                        Auf dieser Seite haben wir Informationen zusammengefasst, die Ihnen bei der Bedienung der
                        Anwendung helfen sollen.
                    </p>
                </div>
            </div>
        </div>


        <div class="section">
            <h2>Das Fachportal Innenstadt</h2>

            <div>
                <p>
                    Das Fachportal Innenstadt wurde im Rahmen des Förderprojektes „Verborgene Potenziale – Für ein lebendiges und resilientes Hamburger Zentrum“ für die Innenstadtkoordination (IK) umgesetzt (<a href="https://www.hamburg.de/verborgene-potenziale/">Verborgene Potenziale</a>). Mit ihm lassen sich spezifische, für die Innenstadtentwicklung relevante Fachdaten darstellen und analysieren.
                </p>
                <p>
                    Die Webanwendung dient der Innenstadtkoordination als Informationsplattform und Analyseinstrument, sowohl für den fachlichen Austausch mit zentralen Innenstadtakteuren als auch mit Bürgerinnen und Bürgern.
                </p>
                <p>
                    Darüber hinaus stellt das Fachportal im Projekt „<a href="https://www.connectedurbantwins.de/">Connected Urban Twins</a>“ ein Anwendungsfall dar, weshalb die Weiterentwicklung und Bereitstellung als Open Source Anwendung durch das CUT-Projekt gefördert wurde.
                </p>
            </div>
        </div>

        <div class="section">
            <h2>VPI Dashboard</h2>

            <div>
                <p>
                    Das Frequenzdaten-Dashboard dient zur Analyse der Besucherfrequenzen in der Hamburger Innenstadt. Das Dashboard ist über das Werkzeug Icon auf der rechten Seite und dem Menüeintrag VPI Dashboard aufrufbar.
                </p>
                <p>
                    Mit dem VPI Dashboard können Aufenthalts-Frequenzdaten aus 124 Gitterzellen
                    <sup id="fnref:1">
                        <a
                            href="#fn:1"
                            rel="footnote"
                        >
                            1
                        </a>
                    </sup>
                    in den Stadtteilen Hamburg-Neustadt, Hamburg-Altstadt und HafenCity analysiert werden.
                </p>
                <p>
                    Über das Dashboard sind Besucherzahlen sowie Altersklassen, Geschlecht und Herkunft der Besucher für die Flächen in den Gitterzellen analysierbar. Auch der Vergleich von Gitterzellen ist über Standorte vergleichen oder die Heatmap möglich. Die Bezeichnungen der Gitterzellen (Straßennamen) beschreibt nicht den Standort der angezeigten Werte, sondern dient im Wesentlichen der besseren Orientierung in der Kartenansicht.
                </p>
                <p>
                    Die für jede Gitterzelle errechneten Daten ermöglichen eine flächendeckende Betrachtung des Besucheraufkommens in der Innenstadt. Die Größe der Gitterzellen beträgt 250m x 250m und Bereich des Hafens 500m x 500m. Alle Daten werden in der Regel mit einer Latenz von 48 Stunden ab dem aktuellen Datum bereitgestellt.
                </p>
            </div>
        </div>

        <div class="section">
            <h2>Bedienung des VPI-Dashboards</h2>

            <div class="listBlock">
                <p>
                    Beim Öffnen des VPI-Dashboards werden zunächst die Besucher für den Standort Rathausmarkt / Kleine Alster sowie die Werte für den aktuellen Monat im aktuellen Jahr vorausgewählt angezeigt. Die Werte in den drei Kacheln für Jahr, Monat und Wochentag sind über Pfeiltasten änderbar.
                </p>
                <p>
                    Der Standort lässt sich sowohl durch Auswahl einer Gitterzelle in der Karte als auch dem Dropdown-Menü im Dashboard ändern.
                </p>
                <strong class="listHeader">Reiter: Besucher</strong>

                <p>
                    Die Analysekategorie „Besucher“ ermöglicht die Aufschlüsselung von Signalisierungsdaten eines Mobilfunkgerätes in einer Gitterzelle. Ein Mobilfunkgerät wird dabei mit einer Person gleichgesetzt. Wie oben dargestellt sind die abgeleiteten Besucherzahlen Näherungswerte, u.a. da nicht alle Personen Mobilfunkgeräte mit sich führen.
                </p>
                <p class="paragraph_underline">
                    Datenkacheln:
                </p>
                <p>
                    Die drei Datenkacheln zeigen die Besucherzahlen für einen Standort pro Jahr, pro Monat sowie pro durchschnittlichen Wochentag im ausgewählten Monat.
                </p>
                <ul>
                    <li>
                        Auswählbar sind Daten für die Jahre 2024 und 2025.
                    </li>
                    <li>
                        Die Werte ändern sich entsprechend der Änderung des Datums.
                    </li>
                    <li>
                        Änderungen des Jahres wirken sich auf die Kacheln Monat und Wochentag sowie das untenstehende Datendiagramm aus.
                    </li>
                    <li>
                        Änderungen des Monats wirken sich nur auf den Wochentag aus.
                    </li>
                    <li>
                        Daten für Wochentage zeigen die Durchschnittswerte für den ausgewählten Wochentag im ausgewählten Monat.
                    </li>
                </ul>

                <p class="paragraph_underline">
                    Datendiagramm:
                </p>
                <p>
                    Im Diagramm unter den Datenkacheln werden die Daten zum jeweils ausgewählten Merkmal grafisch dargestellt. Über die Schaltflächen unterhalb des Diagramms ist ein Wechsel zwischen Balken- und Liniendiagramm möglich. Mit dem Schieberegler unter dem Diagramm (x-Achse) lassen sich Zeiträume in der Monats-, Tages- und Stundenansicht anpassen.
                </p>
                <p>
                    Über das Dropdown-Menü „Datengrundlage für Grafik auswählen“ können weitere Daten geladen werden, die dann in der Grafik visualisiert werden:
                </p>
                <p>
                    Die Auswahlmöglichkeiten sind:
                </p>
                <ul>
                    <li>
                        Anzahl der monatlichen Besucher im Jahr X (2024-2025):
                        <ul>
                            <li>
                                Zeigt die Anzahl an Besuchern je Monat für das ausgewählte Jahr an.
                            </li>
                            <li>
                                Die Auswahl des Jahres erfolgt über die Kachel
                            </li>
                        </ul>
                    </li>
                    <li>
                        Durchschnittliche tägliche Besucher pro Monat:
                        <ul>
                            <li>
                                Zeigt die durchschnittlichen Besucher für jeden Wochentag im ausgewählten Monat und Jahr an.
                            </li>
                        </ul>
                    </li>
                    <li>
                        Besucher einer bestimmten Zeitspanne (stündlich):
                        <ul>
                            <li>
                                Zeigt die Besucher einer bestimmten Zeitspanne in stundenweiser Auflösung an.
                            </li>
                            <li>
                                Der Zeitraum (maximal 2 Monate) ist über die Kalenderfunktion frei auswählbar.
                            </li>
                        </ul>
                    </li>
                    <li>
                        Besucher einer bestimmten Zeitspanne (täglich):
                        <ul>
                            <li>
                                Zeigt die täglichen Besucher eines bestimmten Zeitraums an.
                            </li>
                            <li>
                                Der Zeitraum kann über die Kalenderfunktion ausgewählt werden.
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>

            <div class="listBlock">
                <strong class="listHeader">Reiter: Herkunft</strong>
                <p>
                    Die Kategorie „Herkunft“ ermöglicht die Analyse des Besucheraufkommens nach Besuchertypen, Postleitzahlen (Hamburger Stadtteilen), Übernachtungsort (Landkreis/Stadt) und Internationalen Besuchern. Die Auswahl lässt sich über das Dropdown-Menü ändern.
                </p>
                <p>
                    Beim Öffnen des Tabs Herkunft wird initial das Diagramm für Besuchertypen angezeigt. Zur Ermittlung der Herkunft eines Besuchers werden sowohl die in den Signalisierungsdaten enthaltenen Standortinformationen genutzt (z.B. für PLZ, Stadt-Landkreis) als auch die Länder- und Regionsinformationen der Sim-Karte (bei Internationalen Besuchern) in der diese ausgestellt wurden.
                </p>
                <p class="paragraph_underline">
                    Besuchertypen:
                </p>
                <ul>
                    <li>
                        Hamburger = Besucher aus einem Hamburger Stadtteil (Postleitzahl)
                    </li>
                    <li>
                        Pendler = Besucher aus der Metropolregion Hamburg
                    </li>
                    <li>
                        Touristen = Besucher kommt nicht aus Hamburg oder der Metropolregion, sondern lässt sich einem Landkreis oder einer Stadt in Deutschland zuordnen
                    </li>
                </ul>
                <p>
                    Die Analysekategorie besteht aus drei Datenkacheln und einem Stapeldiagramm.
                </p>
                <p>
                    In den drei Datenkacheln wird für die jeweils ausgewählte Gitterzelle die Hamburger:innen im wöchentlichen Durchschnitt, die Pendler:innen im wöchentlichen Durchschnitt und die Touristen im wöchentlichen Durchschnitt angezeigt. Mit den Pfeiltasten über der mittleren Kachel lässt sich die Ansicht jahresweise verändern.
                </p>
                <p>
                    Das Stapeldiagramm zeigt für das oben ausgewählte Jahr die monatliche Verteilung der Besuchertypen für eine durchschnittliche Woche im jeweiligen Monat.
                </p>
                <p class="paragraph_underline">
                    Besucher nach Postleitzahlen:
                </p>
                <p>
                    Das Diagramm zeigt die Top 20 Besucher nach Hamburger Stadtteilen. Grundlage bildet die aus den Signalisierungsdaten abgeleitete Position des Mobilfunkgerätes am Ende eines Tages die nach Anonymisierung und Datenaufbereitung einem Postleitzahlengebiet zugordnet wird.
                </p>
                <ul>
                    <li>
                        Gezeigt werden die täglichen Besucher eines definierten Zeitraums aus einem Postleitzahlengebiet. Auf der Y-Achse lässt sich der Name des Stadtteils ablesen, auf der X-Achse die Besucherzahl.
                    </li>
                    <li>
                        Der Zeitraum kann über die Kalenderfunktion ausgewählt werden.
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Besucher nach Übernachtungsort:
                </p>
                <p>
                    Das Diagramm zeigt die Top 10 Besucher nach Landkreisen/Städten. Grundlage für den Übernachtungsort bildet die aus den Signalisierungsdaten abgeleitete Position des Mobilfunkgerätes zum Ende eines Tages die nach der Anonymisierung und Datenaufbereitung einem Gemeindeschlüssel (Landkreis/ Stadt) zugeordnet wird.
                </p>
                <ul>
                    <li>
                        Das Diagramm zeigt die täglichen Besucher eines definierten Zeitraums aus einem bestimmten Landkreis/ Stadt. Auf der Y-Achse lässt sich der Name (Landkreis/ Stadt) ablesen, auf der x-Achse die Besucherzahl.
                    </li>
                    <li>
                        Der Zeitraum kann über die Kalenderfunktion ausgewählt werden.
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Internationale Besucher:
                </p>
                <p>
                    Als Internationale Besucher werden alle Besucher erfasst deren Sim-Karte nicht in Deutschland ausgestellt wurde. Die Länderzuordnung entspricht der Region, in der die Sim-Karte ausgestellt wurde.
                </p>
                <ul>
                    <li>
                        Das Diagramm zeigt die Top 10 Besucherzahlen nach Nationen.
                    </li>
                    <li>
                        Auf der Y-Achse lässt sich der Landesname ablesen, auf der X-Achse die Besucherzahl.
                    </li>
                    <li>
                        Der Zeitraum kann über die Kalenderfunktion ausgewählt werden.
                    </li>
                </ul>
            </div>
            <div class="listBlock">
                <strong class="listHeader">Reiter: Altersklassen</strong>

                <p>
                    In der Analysekategorie „Altersklassen“ werden Besucher, die sich in einer Gitterzelle aufgehalten haben nach Altersklassen aufgeschlüsselt. Die Informationen zum Alter stammen aus den Mobilfunkverträgen. Diese werden anonymisiert zu Altersklassen aggregiert. Die Daten werden tagesweise erhoben; jedes Mobilfunkgerät und somit jeder Besucher, der sich in einer Mobilfunkzelle aufhält, wird einmal täglich erfasst. Die Altersklassen werden in sechs Kohorten unterschieden.
                </p>
                <p>
                    Altersklassen:
                </p>
                <ul>
                    <li>
                        20-29 Jahre
                    </li>
                    <li>
                        30-39 Jahre
                    </li>
                    <li>
                        40-49 Jahre
                    </li>
                    <li>
                        50-59 Jahre
                    </li>
                    <li>
                        60-69 Jahre
                    </li>
                    <li>
                        >70 Jahre
                    </li>
                </ul>
                <p>
                    Die Datenseite der Analysekategorie besteht aus einem Kreis- und einem Stapeldiagramm.
                </p>
                <p>
                    Das Kreisdiagramm zeigt für die jeweils ausgewählte Gitterzelle die Verteilung der Altersklassen pro Jahr als Prozentwert. Über die Pfeiltasten oberhalb des Kreisdiagramms lassen sich die angezeigten Daten jahresweise verändern.
                </p>
                <p>
                    Das Stapeldiagramm zeigt für das oben ausgewählte Jahr die monatliche Verteilung der Altersklassen. Über das Dropdown-Menü und die Kalenderfunktion können auch tägliche Besucherzahlen für individuelle Zeiträume angezeigt werden.
                </p>
                <p>
                    Unter 18-Jährige werden aus rechtlichen Gründen nicht erfasst.
                </p>
            </div>

            <div class="listBlock">
                <strong class="listHeader">Reiter: Geschlecht</strong>

                <p>
                    Die Analysekategorie „Geschlecht“ gibt die Verteilung nach weiblichen und männlichen Besuchern in einer Gitterzelle an.
                </p>
                <p>
                    Die Datenseite der Analysekategorie besteht aus einem Kreis- und einem Stapeldiagramm.
                </p>
                <p>
                    Das Kreisdiagramm zeigt die Verteilung männlicher und weiblicher Besucher über ein Jahr als Prozentwert.
                </p>
                <p>
                    Über die Pfeiltasten oberhalb des Kreisdiagramms lassen sich die angezeigten Daten jahresweise ändern.
                </p>
                <p>
                    Das Stapeldiagramm zeigt für das oben ausgewählte Jahr die monatliche Verteilung. Über das Dropdown-Menü und die Kalenderfunktion können auch tägliche Besucherzahlen für individuelle Zeiträume angezeigt werden.
                </p>
            </div>
            <div class="listBlock">
                <strong class="listHeader">Reiter: Standorte Vergleichen</strong>

                <p>
                    Die Funktion ermöglicht den Vergleich bestimmter Merkmale für zwei Standorte.
                </p>
                <ul>
                    <li>
                        Standort (A) ist der jeweils aktive Standort.
                    </li>
                    <li>
                        Standort (B) muss vom Benutzer über die Karte oder die Standortauswahl (Dropdown-Menü) hinzugefügt werden.
                    </li>
                </ul>
                <p>
                    Die Auswahl von Standort A lässt sich über das Dropdown-Menü verändern. Standort B kann entweder über die Karte oder das Dropdown-Menü hinzugefügt/ändern.
                </p>
                <p>
                    Über das Dropdown Menü ist das Laden folgender Merkmale möglich:
                </p>
                <p class="paragraph_underline">
                    Besucher einer bestimmten Zeitspanne (täglich):
                </p>
                <p>
                    Dargestellt wird ein Vergleich des täglichen Besucheraufkommens von zwei Standorten über einen bestimmten Zeitraum.
                </p>
                <ul>
                    <li>
                        Der Zeitraum ist über die Kalenderfunktion auswählbar.
                    </li>
                    <li>
                        Die X-Achse zeigt die Tage (Datum), die Y-Achse zeigt die Anzahl an Besuchern für Standort A und B
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Besucher einer bestimmten Zeitspanne (stündlich):
                </p>
                <p>
                    Dargestellt wird ein Vergleich des stündlichen Besucheraufkommens von zwei Standorten für eine bestimmte Zeitspanne.
                </p>
                <ul>
                    <li>
                        Der Zeitraum ist über die Kalenderfunktion auswählbar.
                    </li>
                    <li>
                        Die X-Achse zeigt die Stunden für den ausgewählten Zeitraum, die y-Achse zeigt die Anzahl an Besuchern für Standort A und B
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Altersklassen:
                </p>
                <p>
                    Dargestellt wird ein Vergleich der Besucherzahlen nach Altersklassen für zwei Standorte im wöchentlichen Durchschnitt eines ausgewählten Monats.
                </p>
                <ul>
                    <li>
                        Die Auswahl des Monats erfolgt über die Kalenderfunktion.
                    </li>
                    <li>
                        Die Zahlenwerte auf der Y-Achse geben den Besucherdurchschnitt pro Woche an.
                    </li>
                    <li>
                        Die Merkmale der Altersklassen sind identisch mit denen der Analysekategorie „Altersklasse“.
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Geschlecht:
                </p>
                <p>
                    Dargestellt wird ein Vergleich der Besucher (männlich/ weiblich) von zwei Standorten im wöchentlichen Durchschnitt eines ausgewählten Monats.
                </p>
                <ul>
                    <li>
                        Die Auswahl des Monats erfolgt über die Kalenderfunktion.
                    </li>
                    <li>
                        Die Zahlenwerte auf der Y-Achse geben den Besucherdurchschnitt pro Woche an.
                    </li>
                    <li>
                        Die Merkmale der Intervalle sind identisch mit denen der Analysekategorie „Geschlecht“.
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Besuchertypen:
                </p>
                <p>
                    Dargestellt wird ein Vergleich der Besuchertypen von zwei Standorten im wöchentlichen Durchschnitt eines ausgewählten Monats.
                </p>
                <ul>
                    <li>
                        Die Auswahl des Monats erfolgt über die Kalenderfunktion.
                    </li>
                    <li>
                        Die Zahlenwerte auf der Y-Achse geben den Besucherdurchschnitt pro Woche an.
                    </li>
                    <li>
                        Die Merkmale der Besuchertypen sind identisch mit denen der Analysekategorie „Besuchertypen“.
                    </li>
                </ul>
            </div>
            <div class="listBlock">
                <strong class="listHeader">Reiter: Heatmap</strong>
                <p>
                    Die Heatmap-Funktion ermöglicht die Darstellung der Besucherzahlen täglich und stündlich als Zeitreihe auf Gitterzellenebene für die gesamte Innenstadt. Über die Bedienkonsole auf der Karte lassen sich mit dem Schieberegler, dem Start/Play-Button oder den Pfeiltasten unterschiedliche Tage auswählen. Die Gitterzellen nehmen je nach zugrundeliegendem Wert für Besucher täglich/stündlich eine andere Färbung an. Über die Legende im linken Menü lassen sich die Farbwerte unterschiedlichen Klassen zuordnen.
                </p>
                <p>
                    Durch Auswahl einer Gitterzelle öffnet sich auf der rechten Seite ein Informationsfenster in dem die jeweils aktuellen Werte im Zeitverlauf angezeigt werden.
                </p>
            </div>
        </div>

        <div class="section">
            <h2>
                Datenquellen
            </h2>

            <div>
                <p>
                    Für die Frequenzdaten werden Signalisierungsdaten aus dem Netz der Telekom Deutschland GmbH genutzt, die durch die T-Systems Tochter Motion Data bereitgestellt und über die Urbandata Platform (Landesbetrieb Geoinformation und Vermessung, LGV) aufbereitet in das Fachportal eingebunden werden. Der LGV stellt die Daten über einen FHH internen OAF-Dienst im VPI-Dashboard bereit.
                </p>
                <p>
                    Motion Data anonymisiert und aggregiert die Daten in einem mit dem Bundesbeauftragten für Datenschutz und Informationsfreiheit abgestimmten Verfahren und rechnet sie auf die Gesamtbevölkerung hoch.
                </p>
                <p>
                    Motion Data ist ein in Deutschland ansässiges Unternehmen, welches die Massenbewegungsdaten für eine Web-Applikation nutzt. Diese beinhaltet ein Dashboard mit der sich Analysen durchführen lassen.
                </p>
                <p>
                    <a href="https://dih.telekom.com/de/motion-data">Motion Data | Telekom Data Intelligence Hub</a>
                </p>
            </div>
        </div>
        <div class="footnotes">
            <hr>
            <ol>
                <li id="fn:1">
                    <p>
                        INSPIRE definiert europaweit einheitliche
                        <a
                            href="https://www.bkg.bund.de/SharedDocs/Produktinformationen/BKG/DE/P-2021/210111_GeoGitter.html"
                            target="_blank"
                        >
                            Geographische Gitter
                        </a>
                        . Das im VPI Dashboard genutzte Gitter hat, in Abhängigkeit von der Netzverfügbarkeit der jeweiligen Betreiber quadratische Zellgrößen von 250 m bis 500 m.
                        <a
                            href="#fnref:1"
                            rev="footnote"
                        >
                            ↩
                        </a>
                    </p>
                </li>
            </ol>
        </div>
    </div>
</template>

<style lang="scss" scoped>
#vpiDashboardTabInfo {

    padding: 0.25rem 0 1.5rem 0;

    H2,
    H3,
    H4 {
        font-size: 1rem;
        margin: 0;
        padding: 0;
        border: none;
        text-transform: none;
        font-weight: normal;
        line-height: normal;
    }

    H1,
    h2 {
        margin: 0 0 1.5rem 0;
        padding: 0 1rem 1rem 1rem;
        border-bottom: solid 1px var(--bs-gray-300);
    }

    h2 {
        font-weight: bold;
    }

    h3,
    h4 {
        margin: 0 0 1rem 0;
    }

    h4 {
        font-size: 0.85rem;
    }

    p {
        margin: 0 0 1rem 0;
        color: var(--bs-black);
    }
    .paragraph_underline {
        text-decoration: underline;
    }

    ul {
        padding: 0 0 0 1rem;

        li {
            margin: 0 0 1rem 0;
        }
    }

    .section {
        margin: 0 0 2rem 0;

        > div {
            margin: 0 0 2rem 0;
            padding: 0 1rem;

            .listHeader {
                display: inline-block;
                margin: 0 0 1rem 0;
                padding: 0 0 0.25rem 0;
                border-bottom: solid 1px var(--bs-gray-300);
            }

            .listBlock {
                margin: 0 0 2rem 0;
            }
        }
    }

}
</style>
