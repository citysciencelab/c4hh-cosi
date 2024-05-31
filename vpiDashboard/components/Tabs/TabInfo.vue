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
            <h2>Das Fachportal – Verborgene Potenziale Innenstadt</h2>

            <div>
                <p>
                    Das Fachportal Verborgene Potenziale Innenstadt wurde im Rahmen des Förderprojektes „Verborgene Potenziale – Für ein lebendiges und resilientes Hamburger Zentrum“ für die Geschäftsstelle zur Innenstadtkoordination umgesetzt. Der Innenstadtkoordination dient das Fachportal als Informationsplattform, Analyseinstrument und zum Austausch mit zentralen Innenstadtakteuren sowie Bürgerinnen und Bürgern. Weitere Informationen zum Projekt selbst können Sie unter folgendem Link aufrufen: <a href="https://www.hamburg.de/verborgene-potenziale/">https://www.hamburg.de/verborgene-potenziale/</a>
                </p>
                <p>
                    Technisch baut das Fachportal auf dem Masterportal des LGV auf. Werkzeuge des Masterportals und Fachdaten der Urban Data Platform werden für den fundierten Austausch in Workshops und öffentlichen Beteiligungsgelegenheiten bereitgestellt. Interessierte, die sich aktiv an der Entwicklung der Innenstadt beteiligen wollen, finden weitere Informationen unter <a href="https:\\verborgene-potenziale.beteiligung.hamburg">https:\\verborgene-potenziale.beteiligung.hamburg</a>.
                </p>
            </div>
        </div>

        <div class="section">
            <h2>VPI Dashboard</h2>

            <div>
                <p>
                    Ein zentraler Funktionsbereich des Fachportals Innenstadt ist ein Daten-Dashboard zur Analyse der Besucherfrequenzen in der Hamburger Innenstadt. Das Dashboard wird im Hauptmenü des Fachportals über den Reiter VPI aufgerufen.
                </p>
                <p>
                    Mit dem VPI-Dashboard können Aufenthalts-Frequenzdaten aus 20 Gitterzellen
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
                    Über das Dashboard sind Besucherzahlen, Besuchertypen, Altersgruppen und die Verweildauer für die Flächen in den Gitterzellen analysierbar. Auch der Vergleich mehrerer Standorte und Zeiträume ist möglich. Jeder rote Punkt auf der Karte repräsentiert Daten aus einer Gitterzelle. Die Daten sind also nicht adressscharf, sondern auf die Zelle bezogen. Das Gitter wird in der Karte mit den Standorten angezeigt.
                </p>
                <p>
                    Für die Frequenzdaten werden Telekommunikationsdaten (Signaldaten) der Telefónica Deutschland GmbH & Co. OHG genutzt die durch den Datendienstleister WHATALOCATION bereitgestellt und über eine Datenschnittstelle in das Fachportal eingebunden sind. Telefónica anonymisiert und aggregiert die Daten in einem mit dem Bundesbeauftragten für Datenschutz und Informationsfreiheit abgestimmten Verfahren und rechnet sie auf die Gesamtbevölkerung hoch.
                </p>
                <p>
                    Die so für jede Gitterzelle errechneten Daten ermöglichen eine flächendeckende Betrachtung des Personenaufkommens in der gesamten Innenstadt. Die Daten zu Besucherzahlen werden mit einem Zeitverzug von ca. 5 Tagen ab dem aktuellen Datum bereitgestellt, die Daten zu Besuchertypen, Altersgruppen und Verweildauer mit einem Zeitverzug von max. 2 Monaten.
                </p>
                <p>
                    Aufgrund technischer Störungen beim Netzbetreiber, z.B. temporäre Ausfälle im Mobilfunknetz etwa durch Bauarbeiten oder Defekt von Sendemasten kann es bei der Datenbereitstellung zu zeitlichen Verzögerungen kommen. In seltenen Fällen können Datenlücken nicht nachträglich geschlossen werden, so dass für einzelne Tage keine Frequenzdaten angezeigt werden.
                </p>
            </div>
        </div>

        <div class="section">
            <h2>Bedienung des VPI-Dashboards</h2>

            <div class="listBlock">
                <p>
                    Beim Öffnen des VPI-Dashboards werden zunächst die Aktivitäten für den Standort Alstertor sowie die Werte für den 01. Januar des jeweiligen Jahres vorausgewählt angezeigt.
                </p>
                <p>
                    Der Standort kann sowohl durch Klick auf einen anderen Standort (roter Punkt) in der Karte als auch durch Dropdown oder Eingabe eines anderen Standorts im Adressfeld des Dashboards geändert werden.
                </p>
                <p>
                    Das Datum ist in den Kacheln für Jahr, Monat und Wochentag über Pfeiltasten änderbar.
                </p>
                <strong class="listHeader">Reiter: Aktivitäten</strong>

                <p>
                    Die Analysekategorie „Aktivitäten“ ermöglicht die Aufschlüsselung von Signalisierungsdaten von Mobilfunkgeräten in Mobilfunkzellen. Ein Mobilfunkgerät wird dabei mit einer Person gleichgesetzt. Wie oben dargestellt sind die abgeleiteten Besucherzahlen Näherungswerte, u.a. da nicht alle Personen Mobilfunkgeräte mit sich führen.
                </p>
                <p class="paragraph_underline">
                    Datenkacheln:
                </p>
                <p>
                    Die drei Datenkacheln zeigen die Aktivitäten für einen Standort pro Jahr, pro Monat sowie pro durchschnittlichen Wochentag im ausgewählten Monat.
                </p>
                <ul>
                    <li>
                        Auswählbar sind Daten für die Jahre 2019 bis 2024.
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
                        Bei den Daten für Wochentage handelt es sich um Durchschnittswerte für diesen Wochentag im ausgewählten Monat.
                    </li>
                </ul>

                <p class="paragraph_underline">
                    Datendiagramm:
                </p>
                <p>
                    Im Diagramm unter den Datenkacheln werden die Daten zum jeweils ausgewählten Merkmal grafisch dargestellt. Über die Schaltflächen unterhalb des Diagramms ist ein Wechsel zwischen Balken- und Liniendiagramm möglich.
                </p>
                <p>
                    Über das Dropdown-Menü „Datengrundlage für Grafik auswählen“ können weitere Daten geladen werden, die dann in der Grafik visualisiert werden:
                </p>
                <p>
                    Die Auswahlmöglichkeiten sind:
                </p>
                <ul>
                    <li>
                        Anzahl der monatlichen Besucher im Jahr X (2019 bis 2024):
                        <ul>
                            <li>
                                zeigt die Anzahl an Aktivitäten je Monat für das ausgewählte Jahr an.
                            </li>
                            <li>
                                Die Auswahl des Jahres erfolgt über die Kachel
                            </li>
                        </ul>
                    </li>
                    <li>
                        Besucher insgesamt seit 2019:
                        <ul>
                            <li>
                                zeigt die Anzahl an Aktivitäten/Events über den Gesamtzeitraum seit Januar 2019 an.
                            </li>
                        </ul>
                    </li>
                    <li>
                        Durchschnittliche tägliche Aktivitäten pro Monat:
                        <ul>
                            <li>
                                zeigt die Aktivitäten für die Wochentage im Durchschnitt des ausgewählten Monats im ausgewählten Jahr an.
                            </li>
                        </ul>
                    </li>
                    <li>
                        Besucher eines bestimmten Tages (stündlich):
                        <ul>
                            <li>
                                zeigt die Aktivitäten an einem bestimmten Tag in stundenweiser Auflösung an.
                            </li>
                            <li>
                                Der Tag ist über die Kalenderfunktion frei auswählbar.
                            </li>
                        </ul>
                    </li>
                    <li>
                        Besucher einer bestimmten Zeitspanne (täglich):
                        <ul>
                            <li>
                                zeigt die Aktivitäten an einem Standort über einen bestimmten Zeitraum an.
                            </li>
                            <li>
                                Der Zeitraum kann über die Kalenderfunktion ausgewählt werden.
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>

            <div class="listBlock">
                <strong class="listHeader">Reiter: Besuchertypen</strong>

                <p>
                    Die Analysekategorie „Besuchertypen“ zeigt die Mengenverhältnisse unterschiedlicher Besuchertypen an einem ausgewählten Standort. Die Besuchertypen werden von Telefónica durch eine anonymisierte Analyse der Mobilitätsmuster der in der Funkzelle im ausgewählten Zeitraum registrierten Besucher ermittelt. Aus den Mobilitätsmustern werden Besuchertypen abgeleitet.
                </p>
                <p>
                    Besuchertypen:
                </p>
                <ul>
                    <li>
                        Hamburger = Person lebt in Hamburg
                    </li>
                    <li>
                        Pendler = Person lebt nicht in Hamburg, kommt aber regelmäßig von außerhalb in die Mobilfunkzelle
                    </li>
                    <li>
                        Tagestourist = Person hält sich nicht regelmäßig und sonst nur kurzfristig und ohne Übernachtung in der Mobilfunkzelle auf
                    </li>
                    <li>
                        Übernachtungstourist = Person hält sich mit Übernachtung für einen oder mehrere Tage in der Mobilfunkzelle auf
                    </li>
                </ul>
                <p>
                    Die Analysekategorie besteht aus drei Datenkacheln und einem Stapeldiagramm.
                </p>
                <p>
                    In den drei Datenkacheln wird für die jeweils ausgewählte Funkzelle die Hamburger:innen im wöchentlichen Durchschnitt, die Pendler:innen im wöchentlichen Durchschnitt und die Tages und Übernachtungstouristen im wöchentlichen Durchschnitt angezeigt.
                </p>
                <p>
                    Mit den Pfeiltasten über der mittleren Kachel lässt sich die Ansicht jahresweise verändern.
                </p>
                <p>
                    Das Stapeldiagramm zeigt für das oben ausgewählte Jahr die monatliche Verteilung der Besuchertypen für eine durchschnittliche Woche im jeweiligen Monat.
                </p>
            </div>

            <div class="listBlock">
                <strong class="listHeader">Reiter: Altersgruppe</strong>

                <p>
                    In der Analysekategorie „Altersgruppen“ werden Personen, die sich in einer Funkzelle aufgehalten haben nach Altersgruppen aufgeschlüsselt. Die Informationen zum Alter stammen aus den Mobilfunkverträgen der Personen. Diese werden anonymisiert zu Altersklassen aggregiert. Die Daten werden tagesweise erhoben; jedes Mobilfunkgerät und somit jede Person, die sich in einer Mobilfunkzelle aufhält, wird einmal täglich erfasst. Aus Datenschutzgründen werden die tageweise erhobenen Daten von Telefónica als wöchentlicher Durchschnitt pro Monat ausgegeben. Die Altersgruppen werden in sechs Kohorten unterschieden.
                </p>
                <p>
                    Altersgruppen:
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
                        >69 Jahre
                    </li>
                </ul>
                <p>
                    Die Datenseite der Analysekategorie besteht aus einem Kreis- und einem Stapeldiagramm.
                </p>
                <p>
                    Das Kreisdiagramm zeigt für die jeweils ausgewählte Funkzelle die Verteilung der Altersgruppen pro Jahr als Prozentwert.
                </p>
                <p>
                    Über die Pfeiltasten oberhalb des Kreisdiagramms lassen sich die angezeigten Daten jahresweise verändern.
                </p>
                <p>
                    Das Stapeldiagramm zeigt für das oben ausgewählte Jahr die monatliche Verteilung der Altersgruppen für eine durchschnittliche Woche im jeweiligen Monat.
                </p>
                <p>
                    Unter 18-Jährige werden aus rechtlichen Gründen nicht erfasst. In der Altersgruppe der 18-19Jährigen bestehen Datenlücken, weshalb der Datensatz nicht berücksichtigt wurde.
                </p>
            </div>

            <div class="listBlock">
                <strong class="listHeader">Reiter: Verweildauer</strong>

                <p>
                    Die Analysekategorie „Verweildauer“ gibt an, wie lange sich Personen (Geräte) in einer Mobilfunkzelle aufgehalten haben. Die Verweildauer wird aus dem Zeitpunkt des Eintreffens eines Geräts in einer Mobilfunkzelle und dem Zeitpunkt des Verlassens der Mobilfunkzelle errechnet. Jedes Mobilfunkgerät, dass sich in einer Mobilfunkzelle anmeldet, wird einmal täglich erfasst. Die Verweildauer wird in vier Intervallen unterschieden.
                </p>
                <p>
                    Verweildauern:
                </p>
                <ul>
                    <li>
                        30-60 Minuten
                    </li>
                    <li>
                        60-120 Minuten
                    </li>
                    <li>
                        120-240 Minuten
                    </li>
                    <li>
                        240+ Minuten
                    </li>
                </ul>
                <p>
                    Die Datenseite der Analysekategorie besteht aus einem Kreis- und einem Stapeldiagramm.
                </p>
                <p>
                    Das Kreisdiagramm zeigt die Verweildauer der Personen, die sich in dieser Funkzelle aufgehalten haben über ein Jahr als Prozentwert.
                </p>
                <p>
                    Über die Pfeiltasten oberhalb des Kreisdiagramms lassen sich die angezeigten Daten jahresweise ändern.
                </p>
                <p>
                    Das Stapeldiagramm zeigt für das oben ausgewählte Jahr die monatlichen Verweildauern für eine durchschnittliche Woche im jeweiligen Monat.
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
                        Standort (B) muss vom Benutzer über die Karte oder die Adressauswahl hinzugefügt werden.
                    </li>
                </ul>
                <p>
                    Um den Standort (A) zu ändern, muss der Haken im Kästchen „Deaktivieren …“ entfernt werden, sonst kann nur Standort B über die Karte hinzugefügt werden. Ist der Haken nicht gesetzt, lassen sich auch Standorte für A über die Karte auswählen.
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
                        X-Achse zeigt die Tage (Datum), y-Achse zeigt die Anzahl an Besuchern für Standort A und B
                    </li>
                    <li>
                        Analysierbare Daten sind ab ca. 5 Tagen vor dem jeweils aktuellen Daten verfügbar.
                    </li>
                    <li>
                        Unterhalb des Diagramms werden die Werte für Standort A und B tabellarisch angezeigt.
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Besucher eines bestimmten Tages (stündlich):
                </p>
                <p>
                    Dargestellt wird ein Vergleich des stündlichen Besucheraufkommens von zwei Standorten für einen bestimmten Tag.
                </p>
                <ul>
                    <li>
                        Das Datum ist über die Kalenderfunktion frei auswählbar.
                    </li>
                    <li>
                        X-Achse zeigt die Stunden für ausgewähltes Datum, y-Achse zeigt die Anzahl an Besuchern für Standort A und B
                    </li>
                    <li>
                        Analysierbare Daten sind ab ca. 5 Tagen vor dem jeweils aktuellen Daten verfügbar.
                    </li>
                    <li>
                        Unterhalb des Diagramms werden die Werte für Standort A und B stundengenau tabellarisch angezeigt.
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Altersgruppe:
                </p>
                <p>
                    Dargestellt wird ein Vergleich der Altersgruppen der Besucher von zwei Standorten im wöchentlichen Durchschnitt eines ausgewählten Monats.
                </p>
                <ul>
                    <li>
                        Die Auswahl des Monats erfolgt über die Kalenderfunktion. Der erste des jeweiligen Monats ist auswählbar.
                    </li>
                    <li>
                        Die Zahlenwerte auf der Y-Achse geben den Besucherdurchschnitt pro Woche an.
                    </li>
                    <li>
                        Analysierbare Daten sind ab ca. 5 Monaten vor dem jeweils aktuellen Datum verfügbar.
                    </li>
                    <li>
                        Die Merkmale der Altersgruppen sind identisch mit denen der Analysekategorie „Altersgruppe“.
                    </li>
                    <li>
                        Unterhalb des Diagramms werden die Werte nach Altersgruppen für Standort A und B tabellarisch angezeigt.
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Verweildauer:
                </p>
                <p>
                    Dargestellt wird ein Vergleich der Verweildauer der Besucher von zwei Standorten im wöchentlichen Durchschnitt eines ausgewählten Monats.
                </p>
                <ul>
                    <li>
                        Die Auswahl des Monats erfolgt über die Kalenderfunktion. Der erste des jeweiligen Monats ist auswählbar.
                    </li>
                    <li>
                        Die Zahlenwerte auf der Y-Achse geben den Besucherdurchschnitt pro Woche an.
                    </li>
                    <li>
                        Analysierbare Daten sind ab ca. 5 Monaten vor dem jeweils aktuellen Datum verfügbar.
                    </li>
                    <li>
                        Die Merkmale der Intervalle sind identisch mit denen der Analysekategorie „Verweildauer“.
                    </li>
                    <li>
                        Unterhalb des Diagramms werden die Werte nach Zeitintervallen für Standort A und B tabellarisch angezeigt.
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
                        Die Auswahl des Monats erfolgt über die Kalenderfunktion. Der erste des jeweiligen Monats ist auswählbar.
                    </li>
                    <li>
                        Die Zahlenwerte auf der Y-Achse geben den Besucherdurchschnitt pro Woche an.
                    </li>
                    <li>
                        Analysierbare Daten sind ab ca. 5 Monaten vor dem jeweils aktuellen Datum verfügbar.
                    </li>
                    <li>
                        Die Merkmale der Besuchertypen sind identisch mit denen der Analysekategorie „Besuchertypen“.
                    </li>
                    <li>
                        Unterhalb des Diagramms werden die Werte nach Besuchertypen für Standort A und B tabellarisch angezeigt.
                    </li>
                </ul>
            </div>
            <div class="listBlock">
                <strong class="listHeader">Reiter: Zeitpunkte Vergleichen</strong>

                <p>
                    Die Funktion „Zeitpunkte Vergleichen“ ermöglicht den Vergleich spezifischer Merkmale eines Standortes zu unterschiedlichen Zeitpunkten. Die Auswahl des Standorts erfolgt über die Karte oder über das Adressfeld.
                </p>
                <p>
                    Über das Dropdown Menü lassen sich folgende Merkmale laden:
                </p>
                <p class="paragraph_underline">
                    Besucher eines Standorts an zwei verschiedenen Tagen:
                </p>
                <p>
                    Angezeigt werden die Aktivitäten an einem Standort für zwei Zeitpunkte (Tage) im Vergleich.
                </p>
                <ul>
                    <li>
                        Die Auswahl der Tage erfolgt über die Kalenderfunktion.
                    </li>
                    <li>
                        Analysierbare Daten sind ab ca. 5 Tagen vor dem jeweils aktuellen Datum verfügbar.
                    </li>
                    <li>
                        Unterhalb des Diagramms werden die Werte für das Basisdatum und das Vergleichsdatum tabellarisch angezeigt.
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Besucher eines Standorts an zwei verschiedenen Tagen (stündlich):
                </p>
                <p>
                    Angezeigt werden die Aktivitäten an einem Standort für zwei ausgewählte Tage in stundenweiser Auflösung.
                </p>
                <ul>
                    <li>
                        Die Auswahl der Tage erfolgt über die Kalenderfunktion.
                    </li>
                    <li>
                        Analysierbare Daten sind ab ca. 5 Tagen vor dem jeweils aktuellen Datum verfügbar.
                    </li>
                    <li>
                        Unterhalb des Diagramms werden die Werte für das Basisdatum und das Vergleichsdatum tabellarisch angezeigt.
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Altersgruppe:
                </p>
                <p>
                    Angezeigt wird die Verteilung der Altersgruppen an einem Standort für zwei Zeitpunkte. Vergleichen lassen sich die durchschnittlichen wöchentlichen Besucher je Altersgruppe pro Monat und ausgewähltem Jahr.
                </p>
                <ul>
                    <li>
                        Die Auswahl der Monate erfolgt über die Kalenderfunktion.
                    </li>
                    <li>
                        Die Zahlenwerte auf der Y-Achse geben den Besucherdurchschnitt pro Woche an.
                    </li>
                    <li>
                        Analysierbare Daten werden mit einer zeitlichen Verzögerung ab ca. 5 Monaten bereitgestellt .
                    </li>
                    <li>
                        Die Merkmale der Altersgruppen sind identisch mit denen der Analysekategorie „Altersgruppe“.
                    </li>
                    <li>
                        Unterhalb des Diagramms werden die Werte nach Altersgruppen für das Basisdatum und das Vergleichsdatum tabellarisch angezeigt.
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Verweildauer:
                </p>
                <p>
                    Angezeigt wird die durchschnittliche wöchentliche Verweildauer der Besucher pro Monat und ausgewähltem Jahr an einem Standort für zwei unterschiedliche Zeitpunkte.
                </p>
                <ul>
                    <li>
                        Die Auswahl der Monate erfolgt über die Kalenderfunktion. Der erste des jeweiligen Monats ist auswählbar.
                    </li>
                    <li>
                        Die Zahlenwerte auf der Y-Achse geben den Besucherdurchschnitt pro Woche an.
                    </li>
                    <li>
                        Analysierbare Daten sind ab ca. 5 Monaten vor dem jeweils aktuellen Datum verfügbar.
                    </li>
                    <li>
                        Die Merkmale der Zeitintervalle sind identisch mit denen der Analysekategorie „Verweildauer“.
                    </li>
                    <li>
                        Unterhalb des Diagramms werden die Werte nach Zeitintervallen für das Basisdatum und das Vergleichsdatum tabellarisch angezeigt.
                    </li>
                </ul>
                <p class="paragraph_underline">
                    Besuchertypen:
                </p>
                <p>
                    Angezeigt werden die durchschnittlichen wöchentlichen Besucher eines Standortes pro Monat für zwei Zeitpunkte.
                </p>
                <ul>
                    <li>
                        Die Auswahl der Monate erfolgt über die Kalenderfunktion. Der erste des jeweiligen Monats ist auswählbar.
                    </li>
                    <li>
                        Die Zahlenwerte auf der Y-Achse geben den Besucherdurchschnitt pro Woche an.
                    </li>
                    <li>
                        Analysierbare Daten sind ab ca. 5 Monaten vor dem jeweils aktuellen Datum verfügbar.
                    </li>
                    <li>
                        Die Merkmale der Besuchertypen sind identisch mit denen der Analysekategorie „Besuchertypen“.
                    </li>
                    <li>
                        Unterhalb des Diagramms werden die Werte nach Besuchertypen für das Basisdatum und das Vergleichsdatum tabellarisch angezeigt.
                    </li>
                </ul>
            </div>
        </div>

        <div class="section">
            <h2>
                Datenquellen
            </h2>

            <div>
                <p>
                    Als Datengrundlage dienen Signalisierungsdaten der Telefónica Deutschland GmbH & Co. OHG, welche anonymisiert über den Dienstleister WHATALOCATION über elektronische Schnittstellen im VPI-Dashboard bereitgestellt werden.
                </p>
                <p>
                    WHATALOCATION ist ein in Deutschland ansässiges Unternehmen, welches die aufbereiteten und anonymisierten Signalisierungsdaten der Telefónica Deutschland GmbH & Co. OHG für eine Web-Applikation nutzt. Diese beinhaltet ein Dashboard mit der sich Analysen zu Aufenthalts- und Bewegungsverhalten durchführen lassen. Das Dashboard und die in der WHATALOCATION Web-Applikation genutzten Merkmale bildeten die Grundlage für die Entwicklung des Fachportals Verborgene Potenziale Innenstadt.
                </p>
                <a
                    href="https://www.whatalocation.ai/"
                    target="_blank"
                    rel="nofollow noopener"
                >WHATALOCATION.ai</a>
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
                        . Das im VPI Dashboard genutzte Gitter hat, in Abhängigkeit von der Netzverfügbarkeit der jeweiligen Betreiber quadratische Zellgrößen von 500 m bis 1 km.
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
