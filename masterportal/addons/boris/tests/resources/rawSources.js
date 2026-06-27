
export default {
    gfiResponseNewer: "<?xml version='1.0' encoding='UTF-8'?>" +
    "<FeatureCollection xmlns=\"http://www.opengis.net/wfs\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:gml=\"http://www.opengis.net/gml\" xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd http://www.deegree.org/app https://geodienste.hamburg.de/HH_WMS_Bodenrichtwerte?request=GetFeatureInfoSchema&amp;layers=v_brw_zonen_geom_flaeche_2022\">" +
      "<gml:boundedBy>" +
        "<gml:Box srsName=\"EPSG:25832\">" +
          "<gml:coordinates decimal=\".\" cs=\",\" ts=\" \">565843.639,5933855.957 565914.232,5933897.601</gml:coordinates>" +
        "</gml:Box>" +
      "</gml:boundedBy>" +
      "<gml:featureMember>" +
        "<app:v_brw_zonen_geom_flaeche_2022 xmlns:app=\"http://www.deegree.org/app\" fid=\"APP_V_BRW_ZONEN_GEOM_FLAECHE_2022_1393191\">" +
          "<app:zonen_nr>10259</app:zonen_nr>" +
          "<app:jahrgang>2022</app:jahrgang>" +
          "<app:nutzungsart>{" +
      "\"nutzungen\": [" +
        "{\"richtwertnummer\":\"09110259\", \"nutzungsart\":\"A Acker\"}," +
        "{\"richtwertnummer\":\"09210259\", \"nutzungsart\":\"GR Grünland\"}," +
        "{\"richtwertnummer\":\"09310259\", \"nutzungsart\":\"EGA Erwerbsgartenanbaufläche\"}," +
        "{\"richtwertnummer\":\"09610259\", \"nutzungsart\":\"F forstwirtschaftliche Fläche\"}," +
        "{\"richtwertnummer\":\"01110259\", \"nutzungsart\":\"EFH Ein- und Zweifamilienhäuser\"}," +
        "{\"richtwertnummer\":\"01210259\", \"nutzungsart\":\"MFH Mehrfamilienhäuser\"}," +
        "{\"richtwertnummer\":\"01310259\", \"nutzungsart\":\"GH Geschäftshäuser (mehrgeschossig, Wertanteil Erdgeschoss)\"}," +
        "{\"richtwertnummer\":\"01410259\", \"nutzungsart\":\"LAD Läden (eingeschossig)\"}," +
        "{\"richtwertnummer\":\"01510259\", \"nutzungsart\":\"BH Bürohäuser\"}," +
        "{\"richtwertnummer\":\"01610259\", \"nutzungsart\":\"PL Produktion und Logistik\"}" +
      "]" +
     "}</app:nutzungsart>" +
        "</app:v_brw_zonen_geom_flaeche_2022>" +
      "</gml:featureMember>" +
    "</FeatureCollection>",
    gfiResponseOlder: "<?xml version='1.0' encoding='UTF-8'?>" +
    "<FeatureCollection xmlns=\"http://www.opengis.net/wfs\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:gml=\"http://www.opengis.net/gml\" xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd http://www.deegree.org/app https://geodienste.hamburg.de/HH_WMS_Bodenrichtwerte?request=GetFeatureInfoSchema&amp;layers=lgv_brw_lagetypisch_2006\">" +
      "<gml:boundedBy>" +
        "<gml:Box srsName=\"EPSG:25832\">" +
          "<gml:coordinates decimal=\".\" cs=\",\" ts=\" \">565843.000,5933973.000 565843.000,5933973.000</gml:coordinates>" +
        "</gml:Box>" +
      "</gml:boundedBy>" +
      "<gml:featureMember>" +
        "<app:lgv_brw_lagetypisch_2006 xmlns:app=\"http://www.deegree.org/app\" fid=\"APP_LGV_BRW_LAGETYPISCH_2006_702740\">" +
          "<app:jahrgang>2006</app:jahrgang>" +
          "<app:richtwertnummer>06434111</app:richtwertnummer>" +
          "<app:richtwert_euro>9100.00</app:richtwert_euro>" +
          "<app:richtwert_dm>17798.05</app:richtwert_dm>" +
          "<app:postleitzahl>20095</app:postleitzahl>" +
          "<app:entw_zustand>B</app:entw_zustand>" +
          "<app:nutzung>M</app:nutzung>" +
          "<app:nutzung_ergaenzung>BGH</app:nutzung_ergaenzung>" +
          "<app:nutzung_kombiniert>BGH Büro- und Geschäftshäuser</app:nutzung_kombiniert>" +
          "<app:geschossfl_zahl>6.00</app:geschossfl_zahl>" +
          "<app:feld_44>          ;59;MK        ;                                                            ;        ; 1794,00;        ; 1230,00; 4611,00;          ;0,00;        ;Läden     ;1,00; 4611,00;Büros     ;1,00;  897,00;Büros     ;1,00;  897,00;Büros     ;3,00;  897,00</app:feld_44>" +
          "<app:lage>R053;Rathausmarkt;11;;Mönckebergstraße 31;Hamburg-Mitte;1006;</app:lage>" +
          "<app:gemeinde>Hamburg</app:gemeinde>" +
          "<app:stadtteil>Hamburg-Altstadt</app:stadtteil>" +
          "<app:beitragszustand>erschließungsbeitrags-/kostenerstattungsbetragsfrei und abgabenfrei nach Kommunalabgabengesetz</app:beitragszustand>" +
          "<app:entwicklungszustand>B Baureifes Land</app:entwicklungszustand>" +
          "<app:bodenrichtwertgruppennr>59</app:bodenrichtwertgruppennr>" +
          "<app:bodenrichtwertgruppenkuerzel>MK</app:bodenrichtwertgruppenkuerzel>" +
          "<app:normschichtwert>1794.00</app:normschichtwert>" +
          "<app:schichtwert>{\"normschichtwert_buero\":\"1230.00\"," +
    "\"normschichtwert_laden\":\"4611.00\"," +
    "\"schichtwerte\":[{\"geschoss\":\"3. Obergeschoss oder höher\",\"wgfz\":\"3.00\",\"nutzung\":\"Büros\",\"schichtwert\":\"897.00\"}," +
    "{\"geschoss\":\"2. Obergeschoss\",\"wgfz\":\"1.00\",\"nutzung\":\"Büros\",\"schichtwert\":\"897.00\"}," +
    "{\"geschoss\":\"1. Obergeschoss\",\"wgfz\":\"1.00\",\"nutzung\":\"Büros\",\"schichtwert\":\"897.00\"}," +
    "{\"geschoss\":\"Erdgeschoss\",\"wgfz\":\"1.00\",\"nutzung\":\"Läden\",\"schichtwert\":\"4611.00\"}]}</app:schichtwert>" +
          "<app:bezirk>Hamburg-Mitte</app:bezirk>" +
          "<app:statistisches_gebiet>1006</app:statistisches_gebiet>" +
          "<app:strassenschluessel>R053</app:strassenschluessel>" +
          "<app:strassenname>Rathausmarkt</app:strassenname>" +
          "<app:hausnummer>11</app:hausnummer>" +
          "<app:lagebezeichnung>Mönckebergstraße 31</app:lagebezeichnung>" +
        "</app:lgv_brw_lagetypisch_2006>" +
      "</gml:featureMember>" +
    "</FeatureCollection>",
    featureRequestResponse: "<?xml version='1.0' encoding='UTF-8'?>" +
    "<wfs:FeatureCollection xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd http://www.deegree.org/app https://geodienste.hamburg.de/HH_WFS_Bodenrichtwerte?SERVICE=WFS&amp;VERSION=1.1.0&amp;REQUEST=DescribeFeatureType&amp;OUTPUTFORMAT=text%2Fxml%3B+subtype%3Dgml%2F3.1.1\" xmlns:wfs=\"http://www.opengis.net/wfs\" timeStamp=\"2022-06-16T12:55:41Z\" xmlns:gml=\"http://www.opengis.net/gml\">" +
      "<gml:featureMember>" +
        "<app:v_brw_zonen_geom_flaeche_2022 xmlns:app=\"http://www.deegree.org/app\" gml:id=\"APP_V_BRW_ZONEN_GEOM_FLAECHE_2022_1393260\">" +
          "<app:zonen_nr>10239</app:zonen_nr>" +
          "<app:jahrgang>2022</app:jahrgang>" +
          "<app:nutzungsart>{" +
      "\"nutzungen\": [" +
        "{\"richtwertnummer\":\"09110239\", \"nutzungsart\":\"A Acker\"}," +
       "{\"richtwertnummer\":\"09210239\", \"nutzungsart\":\"GR Grünland\"}," +
       "{\"richtwertnummer\":\"09310239\", \"nutzungsart\":\"EGA Erwerbsgartenanbaufläche\"}," +
       "{\"richtwertnummer\":\"09610239\", \"nutzungsart\":\"F forstwirtschaftliche Fläche\"}," +
       "{\"richtwertnummer\":\"01110239\", \"nutzungsart\":\"EFH Ein- und Zweifamilienhäuser\"}," +
       "{\"richtwertnummer\":\"01210239\", \"nutzungsart\":\"MFH Mehrfamilienhäuser\"}," +
       "{\"richtwertnummer\":\"01510239\", \"nutzungsart\":\"BH Bürohäuser\"}" +
      "]" +
     "}</app:nutzungsart>" +
          "<app:geom_zone_flaeche>" +
            "<!--Inlined geometry 'APP_V_BRW_ZONEN_GEOM_FLAECHE_2022_1393260_APP_GEOM_ZONE_FLAECHE'-->" +
            "<gml:Polygon gml:id=\"APP_V_BRW_ZONEN_GEOM_FLAECHE_2022_1393260_APP_GEOM_ZONE_FLAECHE\" srsName=\"EPSG:25832\">" +
              "<gml:exterior>" +
                "<gml:LinearRing srsName=\"EPSG:25832\">" +
                  "<gml:posList>565727.475 5934016.972 565727.476 5934016.743 565727.378 5934016.840 565727.375 5934016.841 565727.314 5934016.861 565727.315 5934016.855 565727.315 5934016.852 565727.305 5934016.856 565726.657 5934002.607 565727.225 5934001.968 565727.627 5934001.541 565728.105 5934001.094 565728.611 5934000.679 565729.142 5934000.298 565729.503 5934000.068 565752.552 5933974.435 565752.916 5933974.050 565753.393 5933973.603 565753.899 5933973.188 565754.431 5933972.807 565754.986 5933972.462 565755.563 5933972.153 565756.159 5933971.883 565756.771 5933971.653 565757.397 5933971.463 565758.034 5933971.315 565758.679 5933971.208 565759.330 5933971.144 565759.867 5933971.126 565760.036 5933970.939 565760.005 5933970.577 565759.984 5933969.923 565760.005 5933969.269 565760.070 5933968.618 565760.176 5933967.973 565760.325 5933967.336 565760.514 5933966.710 565760.745 5933966.098 565761.015 5933965.502 565761.323 5933964.925 565761.668 5933964.369 565762.049 5933963.838 565762.464 5933963.332 565762.547 5933963.239 565766.986 5933958.302 565782.501 5933941.048 565785.732 5933937.455 565786.012 5933936.934 565786.357 5933936.379 565786.738 5933935.847 565787.153 5933935.342 565787.239 5933935.246 565787.974 5933934.428 565788.187 5933934.192 565787.853 5933933.829 565787.438 5933933.323 565787.057 5933932.792 565786.711 5933932.236 565786.403 5933931.659 565786.205 5933931.222 565784.172 5933929.406 565771.684 5933918.251 565771.563 5933918.211 565770.951 5933917.981 565770.355 5933917.711 565769.778 5933917.402 565769.223 5933917.057 565768.691 5933916.676 565768.185 5933916.261 565768.120 5933916.204 565761.622 5933910.405 565761.210 5933910.015 565761.114 5933909.917 565743.467 5933891.779 565740.033 5933888.717 565739.618 5933888.325 565739.171 5933887.847 565738.756 5933887.342 565738.375 5933886.810 565738.029 5933886.254 565737.721 5933885.678 565737.451 5933885.082 565737.220 5933884.470 565737.031 5933883.844 565736.882 5933883.207 565736.776 5933882.561 565736.711 5933881.910 565736.709 5933881.832 565710.272 5933858.113 565709.995 5933858.080 565709.349 5933857.974 565708.712 5933857.825 565708.086 5933857.635 565707.474 5933857.405 565706.878 5933857.135 565706.301 5933856.827 565705.746 5933856.481 565705.422 5933856.249 565705.371 5933856.213 565705.316 5933856.771 565705.210 5933857.416 565705.061 5933858.053 565704.871 5933858.679 565704.641 5933859.291 565704.371 5933859.887 565704.063 5933860.464 565703.717 5933861.020 565703.336 5933861.551 565702.921 5933862.057 565702.853 5933862.134 565690.858 5933875.531 565690.480 5933875.931 565690.002 5933876.378 565689.497 5933876.793 565688.965 5933877.174 565688.410 5933877.519 565687.833 5933877.828 565687.237 5933878.098 565686.625 5933878.328 565685.999 5933878.518 565685.362 5933878.667 565684.716 5933878.773 565684.065 5933878.837 565683.412 5933878.859 565682.758 5933878.837 565682.107 5933878.773 565681.461 5933878.667 565680.824 5933878.518 565680.198 5933878.328 565680.108 5933878.297 565679.883 5933878.530 565679.406 5933878.977 565678.900 5933879.392 565678.368 5933879.773 565677.813 5933880.118 565677.236 5933880.427 565676.640 5933880.697 565676.028 5933880.927 565675.402 5933881.117 565674.765 5933881.266 565674.120 5933881.372 565673.469 5933881.436 565672.815 5933881.458 565672.161 5933881.436 565671.510 5933881.372 565670.865 5933881.266 565670.228 5933881.117 565669.668 5933880.947 565660.638 5933891.043 565660.761 5933891.328 565660.991 5933891.940 565661.181 5933892.566 565661.330 5933893.203 565661.436 5933893.848 565661.501 5933894.499 565661.522 5933895.153 565661.501 5933895.807 565661.437 5933896.458 565661.330 5933897.103 565661.182 5933897.740 565660.992 5933898.366 565660.761 5933898.978 565660.491 5933899.574 565660.183 5933900.151 565659.838 5933900.707 565659.457 5933901.238 565659.042 5933901.744 565658.941 5933901.857 565641.048 5933921.650 565640.702 5933922.014 565640.224 5933922.462 565639.719 5933922.877 565639.187 5933923.258 565638.632 5933923.603 565638.055 5933923.911 565637.813 5933924.027 565635.082 5933927.111 565620.998 5933928.663 565621.007 5933928.671 565620.997 5933928.673 565620.991 5933928.670 565620.988 5933928.667 565620.631 5933928.347 565620.629 5933928.343 565620.629 5933928.338 565620.614 5933928.353 565613.356 5933926.599 565604.276 5933935.085 565727.451 5934031.004 565732.269 5934034.756 565740.449 5934025.807 565727.475 5934016.972</gml:posList>" +
                "</gml:LinearRing>" +
              "</gml:exterior>" +
            "</gml:Polygon>" +
          "</app:geom_zone_flaeche>" +
          "<app:geom_brw_grdstk>" +
            "<!--Inlined geometry 'APP_V_BRW_ZONEN_GEOM_FLAECHE_2022_1393260_APP_GEOM_BRW_GRDSTK'-->" +
            "<gml:Point gml:id=\"APP_V_BRW_ZONEN_GEOM_FLAECHE_2022_1393260_APP_GEOM_BRW_GRDSTK\" srsName=\"EPSG:25832\">" +
              "<gml:pos>565674.000 5933968.000</gml:pos>" +
            "</gml:Point>" +
          "</app:geom_brw_grdstk>" +
        "</app:v_brw_zonen_geom_flaeche_2022>" +
      "</gml:featureMember>" +
    "</wfs:FeatureCollection>",
    featureResponse: "<?xml version='1.0' encoding='UTF-8'?>" +
    "<wfs:FeatureCollection xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd http://www.deegree.org/app https://geodienste.hamburg.de/HH_WFS_Bodenrichtwerte?SERVICE=WFS&amp;VERSION=1.1.0&amp;REQUEST=DescribeFeatureType&amp;OUTPUTFORMAT=text%2Fxml%3B+subtype%3Dgml%2F3.1.1&amp;TYPENAME=app:lgv_brw_zoniert_alle&amp;NAMESPACE=xmlns(app=http%3A%2F%2Fwww.deegree.org%2Fapp)\" xmlns:wfs=\"http://www.opengis.net/wfs\" timeStamp=\"2022-06-21T08:37:00Z\" xmlns:gml=\"http://www.opengis.net/gml\">" +
      "<gml:featureMember>" +
        "<app:lgv_brw_zoniert_alle xmlns:app=\"http://www.deegree.org/app\" gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_6254113\">" +
          "<app:jahrgang>2022</app:jahrgang><app:richtwertnummer>01510239</app:richtwertnummer>" +
          "<app:richtwert_euro>11752.89</app:richtwert_euro><app:richtwert_dm>22986.65</app:richtwert_dm>" +
          "<app:postleitzahl>20457</app:postleitzahl><app:nutzung>M</app:nutzung>" +
          "<app:nutzung_ergaenzung>BH</app:nutzung_ergaenzung><app:nutzung_kombiniert>BH Bürohäuser</app:nutzung_kombiniert>" +
          "<app:geschossfl_zahl>3.70</app:geschossfl_zahl><app:stadtteil>Hamburg-Altstadt</app:stadtteil>" +
          "<app:gemeinde>Hamburg</app:gemeinde><app:anbauart></app:anbauart>" +
          "<app:beitragszustand>erschließungsbeitrags-/kostenerstattungsbeitragsfrei und abgabenfrei nach Kommunalabgabengesetz</app:beitragszustand>" +
          "<app:sanierungszusatz></app:sanierungszusatz><app:entwicklungszustand>B Baureifes Land</app:entwicklungszustand>" +
          "<app:bodenrichtwertgruppennr>69</app:bodenrichtwertgruppennr><app:bodenrichtwertgruppenkuerzel>M BH</app:bodenrichtwertgruppenkuerzel>" +
          "<app:normschichtwert>4000.00</app:normschichtwert><app:schichtwert>{\"normschichtwert_buero_text\":\"Normierter Bodenrichtwert für Bürohäuser\",\"normschichtwert_buero\":\"4000.00\"}</app:schichtwert>" +
          "<app:bezirk>Hamburg-Mitte</app:bezirk><app:statistisches_gebiet>1006</app:statistisches_gebiet><app:strassenschluessel>A158</app:strassenschluessel>" +
          "<app:strassenname>Alter Wall</app:strassenname><app:hausnummer>11</app:hausnummer><app:hausnummerzusatz></app:hausnummerzusatz>" +
          "<app:lagebezeichnung></app:lagebezeichnung><app:baublock>102010</app:baublock>" +
          "<app:geom_zone>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_6254113_APP_GEOM_ZONE'-->" +
            "<gml:Polygon gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_6254113_APP_GEOM_ZONE\" srsName=\"EPSG:25832\">" +
              "<gml:exterior>" +
                "<gml:LinearRing srsName=\"EPSG:25832\">" +
                  "<gml:posList>565727.305 5934016.856 565726.657 5934002.607 565726.395 5934002.902 565699.499 5933978.689 565699.402 5933978.603 565698.896 5933978.188 565698.773 5933978.095 565680.481 5933964.501 565680.072 5933964.212 565679.517 5933963.867 565678.940 5933963.558 565678.344 5933963.288 565677.732 5933963.058 565677.106 5933962.868 565676.469 5933962.720 565675.823 5933962.613 565675.172 5933962.549 565674.519 5933962.528 565673.865 5933962.549 565673.805 5933962.553 565634.712 5933927.529 565635.082 5933927.111 565620.998 5933928.663 565672.520 5933974.823 565674.519 5933972.524 565692.811 5933986.118 565726.899 5934016.806 565727.022 5934016.873 565727.201 5934016.892 565727.305 5934016.856</gml:posList>" +
                "</gml:LinearRing>" +
              "</gml:exterior>" +
            "</gml:Polygon>" +
          "</app:geom_zone>" +
          "<app:geom_brw_grdstk>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_6254113_APP_GEOM_BRW_GRDSTK'-->" +
            "<gml:Point gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_6254113_APP_GEOM_BRW_GRDSTK\" srsName=\"EPSG:25832\">" +
              "<gml:pos>565674.000 5933968.000</gml:pos>" +
            "</gml:Point>" +
          "</app:geom_brw_grdstk>" +
        "</app:lgv_brw_zoniert_alle>" +
      "</gml:featureMember>" +
      "<gml:featureMember>" +
        "<app:lgv_brw_zoniert_alle xmlns:app=\"http://www.deegree.org/app\" gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_968081\">" +
          "<app:jahrgang>2017</app:jahrgang><app:richtwertnummer>01510239</app:richtwertnummer>" +
          "<app:richtwert_euro>10577.60</app:richtwert_euro><app:richtwert_dm>20687.99</app:richtwert_dm>" +
          "<app:postleitzahl>20457</app:postleitzahl><app:nutzung>M</app:nutzung>" +
          "<app:nutzung_ergaenzung>BH</app:nutzung_ergaenzung><app:nutzung_kombiniert>BH Bürohäuser</app:nutzung_kombiniert>" +
          "<app:geschossfl_zahl>3.70</app:geschossfl_zahl><app:stadtteil>Hamburg-Altstadt</app:stadtteil>" +
          "<app:gemeinde>Hamburg</app:gemeinde><app:beitragszustand>erschließungsbeitrags-/kostenerstattungsbeitragsfrei und abgabenfrei nach Kommunalabgabengesetz</app:beitragszustand>" +
          "<app:entwicklungszustand>B Baureifes Land</app:entwicklungszustand><app:bodenrichtwertgruppennr>69</app:bodenrichtwertgruppennr>" +
          "<app:bodenrichtwertgruppenkuerzel>M BH</app:bodenrichtwertgruppenkuerzel><app:normschichtwert>3600.00</app:normschichtwert>" +
          "<app:schichtwert>{\"normschichtwert_buero_text\":\"Normierter Bodenrichtwert für Bürohäuser\",\"normschichtwert_buero\":\"3600.00\"}</app:schichtwert>" +
          "<app:bezirk>Hamburg-Mitte</app:bezirk><app:statistisches_gebiet>1006</app:statistisches_gebiet>" +
          "<app:strassenschluessel>A158</app:strassenschluessel><app:strassenname>Alter Wall</app:strassenname>" +
          "<app:hausnummer>11</app:hausnummer><app:baublock>102010</app:baublock>" +
          "<app:geom_zone>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_968081_APP_GEOM_ZONE'-->" +
            "<gml:Polygon gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_968081_APP_GEOM_ZONE\" srsName=\"EPSG:25832\">" +
              "<gml:exterior>" +
                "<gml:LinearRing srsName=\"EPSG:25832\">" +
                  "<gml:posList>565727.305 5934016.856 565726.657 5934002.607 565726.395 5934002.902 565699.499 5933978.689 565699.402 5933978.603 565698.896 5933978.188 565698.773 5933978.095 565680.481 5933964.501 565680.072 5933964.212 565679.517 5933963.867 565678.940 5933963.558 565678.344 5933963.288 565677.732 5933963.058 565677.106 5933962.868 565676.469 5933962.720 565675.823 5933962.613 565675.172 5933962.549 565674.519 5933962.528 565673.865 5933962.549 565673.805 5933962.553 565634.712 5933927.529 565635.082 5933927.111 565620.998 5933928.663 565672.520 5933974.823 565674.519 5933972.524 565692.811 5933986.118 565726.899 5934016.806 565727.022 5934016.873 565727.201 5934016.892 565727.305 5934016.856</gml:posList>" +
                "</gml:LinearRing>" +
              "</gml:exterior>" +
            "</gml:Polygon>" +
          "</app:geom_zone>" +
          "<app:geom_brw_grdstk>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_968081_APP_GEOM_BRW_GRDSTK'-->" +
            "<gml:Point gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_968081_APP_GEOM_BRW_GRDSTK\" srsName=\"EPSG:25832\">" +
              "<gml:pos>565674.000 5933968.000</gml:pos>" +
            "</gml:Point>" +
          "</app:geom_brw_grdstk>" +
        "</app:lgv_brw_zoniert_alle>" +
      "</gml:featureMember>" +
      "<gml:featureMember>" +
        "<app:lgv_brw_zoniert_alle xmlns:app=\"http://www.deegree.org/app\" gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_2356152\">" +
          "<app:jahrgang>2016</app:jahrgang><app:richtwertnummer>01510239</app:richtwertnummer>" +
          "<app:richtwert_euro>7639.38</app:richtwert_euro><app:richtwert_dm>14941.33</app:richtwert_dm>" +
          "<app:postleitzahl>20457</app:postleitzahl><app:nutzung>M</app:nutzung>" +
          "<app:nutzung_ergaenzung>BH</app:nutzung_ergaenzung><app:nutzung_kombiniert>BH Bürohäuser</app:nutzung_kombiniert>" +
          "<app:geschossfl_zahl>3.70</app:geschossfl_zahl><app:stadtteil>Hamburg-Altstadt</app:stadtteil>" +
          "<app:gemeinde>Hamburg</app:gemeinde><app:beitragszustand>erschließungsbeitrags-/kostenerstattungsbeitragsfrei und abgabenfrei nach Kommunalabgabengesetz</app:beitragszustand>" +
          "<app:entwicklungszustand>B Baureifes Land</app:entwicklungszustand><app:bodenrichtwertgruppennr>69</app:bodenrichtwertgruppennr>" +
          "<app:bodenrichtwertgruppenkuerzel>M BH</app:bodenrichtwertgruppenkuerzel><app:normschichtwert>2600.00</app:normschichtwert>" +
          "<app:schichtwert>{\"normschichtwert_buero_text\":\"Normierter Bodenrichtwert für Bürohäuser\",\"normschichtwert_buero\":\"2600.00\"}</app:schichtwert>" +
          "<app:bezirk>Hamburg-Mitte</app:bezirk><app:statistisches_gebiet>1006</app:statistisches_gebiet><app:strassenschluessel>A158</app:strassenschluessel>" +
          "<app:strassenname>Alter Wall</app:strassenname><app:hausnummer>11</app:hausnummer><app:baublock>102010</app:baublock>" +
          "<app:geom_zone>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_2356152_APP_GEOM_ZONE'-->" +
            "<gml:Polygon gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_2356152_APP_GEOM_ZONE\" srsName=\"EPSG:25832\">" +
              "<gml:exterior>" +
                "<gml:LinearRing srsName=\"EPSG:25832\">" +
                  "<gml:posList>565727.305 5934016.856 565726.657 5934002.607 565726.395 5934002.902 565699.499 5933978.689 565699.402 5933978.603 565698.896 5933978.188 565698.773 5933978.095 565680.481 5933964.501 565680.072 5933964.212 565679.517 5933963.867 565678.940 5933963.558 565678.344 5933963.288 565677.732 5933963.058 565677.106 5933962.868 565676.469 5933962.720 565675.823 5933962.613 565675.172 5933962.549 565674.519 5933962.528 565673.865 5933962.549 565673.805 5933962.553 565634.712 5933927.529 565635.082 5933927.111 565620.998 5933928.663 565672.520 5933974.823 565674.519 5933972.524 565692.811 5933986.118 565726.899 5934016.806 565727.022 5934016.873 565727.201 5934016.892 565727.305 5934016.856</gml:posList>" +
                "</gml:LinearRing>" +
              "</gml:exterior>" +
            "</gml:Polygon>" +
          "</app:geom_zone>" +
          "<app:geom_brw_grdstk>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_2356152_APP_GEOM_BRW_GRDSTK'-->" +
            "<gml:Point gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_2356152_APP_GEOM_BRW_GRDSTK\" srsName=\"EPSG:25832\">" +
              "<gml:pos>565674.000 5933968.000</gml:pos>" +
            "</gml:Point>" +
          "</app:geom_brw_grdstk>" +
        "</app:lgv_brw_zoniert_alle>" +
      "</gml:featureMember>" +
      "<gml:featureMember>" +
        "<app:lgv_brw_zoniert_alle xmlns:app=\"http://www.deegree.org/app\" gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_3271048\">" +
          "<app:jahrgang>2018</app:jahrgang>" +
          "<app:richtwertnummer>01510239</app:richtwertnummer>" +
          "<app:richtwert_euro>11165.24</app:richtwert_euro>" +
          "<app:richtwert_dm>21837.31</app:richtwert_dm>" +
          "<app:postleitzahl>20457</app:postleitzahl>" +
          "<app:nutzung>M</app:nutzung>" +
          "<app:nutzung_ergaenzung>BH</app:nutzung_ergaenzung>" +
          "<app:nutzung_kombiniert>BH Bürohäuser</app:nutzung_kombiniert>" +
          "<app:geschossfl_zahl>3.70</app:geschossfl_zahl>" +
          "<app:stadtteil>Hamburg-Altstadt</app:stadtteil>" +
          "<app:gemeinde>Hamburg</app:gemeinde>" +
          "<app:beitragszustand>erschließungsbeitrags-/kostenerstattungsbeitragsfrei und abgabenfrei nach Kommunalabgabengesetz</app:beitragszustand>" +
          "<app:entwicklungszustand>B Baureifes Land</app:entwicklungszustand>" +
          "<app:bodenrichtwertgruppennr>69</app:bodenrichtwertgruppennr>" +
          "<app:bodenrichtwertgruppenkuerzel>M BH</app:bodenrichtwertgruppenkuerzel>" +
          "<app:normschichtwert>3800.00</app:normschichtwert>" +
          "<app:schichtwert>{\"normschichtwert_buero_text\":\"Normierter Bodenrichtwert für Bürohäuser\",\"normschichtwert_buero\":\"3800.00\"}</app:schichtwert>" +
          "<app:bezirk>Hamburg-Mitte</app:bezirk>" +
          "<app:statistisches_gebiet>1006</app:statistisches_gebiet>" +
          "<app:strassenschluessel>A158</app:strassenschluessel>" +
          "<app:strassenname>Alter Wall</app:strassenname>" +
          "<app:hausnummer>11</app:hausnummer>" +
          "<app:baublock>102010</app:baublock>" +
          "<app:geom_zone>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_3271048_APP_GEOM_ZONE'-->" +
            "<gml:Polygon gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_3271048_APP_GEOM_ZONE\" srsName=\"EPSG:25832\">" +
              "<gml:exterior>" +
                "<gml:LinearRing srsName=\"EPSG:25832\">" +
                  "<gml:posList>565727.305 5934016.856 565726.657 5934002.607 565726.395 5934002.902 565699.499 5933978.689 565699.402 5933978.603 565698.896 5933978.188 565698.773 5933978.095 565680.481 5933964.501 565680.072 5933964.212 565679.517 5933963.867 565678.940 5933963.558 565678.344 5933963.288 565677.732 5933963.058 565677.106 5933962.868 565676.469 5933962.720 565675.823 5933962.613 565675.172 5933962.549 565674.519 5933962.528 565673.865 5933962.549 565673.805 5933962.553 565634.712 5933927.529 565635.082 5933927.111 565620.998 5933928.663 565672.520 5933974.823 565674.519 5933972.524 565692.811 5933986.118 565726.899 5934016.806 565727.022 5934016.873 565727.201 5934016.892 565727.305 5934016.856</gml:posList>" +
                "</gml:LinearRing>" +
              "</gml:exterior>" +
            "</gml:Polygon>" +
          "</app:geom_zone>" +
          "<app:geom_brw_grdstk>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_3271048_APP_GEOM_BRW_GRDSTK'-->" +
            "<gml:Point gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_3271048_APP_GEOM_BRW_GRDSTK\" srsName=\"EPSG:25832\">" +
              "<gml:pos>565674.000 5933968.000</gml:pos>" +
            "</gml:Point>" +
          "</app:geom_brw_grdstk>" +
        "</app:lgv_brw_zoniert_alle></gml:featureMember><gml:featureMember>" +
        "<app:lgv_brw_zoniert_alle xmlns:app=\"http://www.deegree.org/app\" gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_4019910\">" +
          "<app:jahrgang>2019</app:jahrgang><app:richtwertnummer>01510239</app:richtwertnummer>" +
          "<app:richtwert_euro>11165.24</app:richtwert_euro><app:richtwert_dm>21837.31</app:richtwert_dm>" +
          "<app:postleitzahl>20457</app:postleitzahl><app:nutzung>M</app:nutzung>" +
          "<app:nutzung_ergaenzung>BH</app:nutzung_ergaenzung><app:nutzung_kombiniert>BH Bürohäuser</app:nutzung_kombiniert>" +
          "<app:geschossfl_zahl>3.70</app:geschossfl_zahl><app:stadtteil>Hamburg-Altstadt</app:stadtteil>" +
          "<app:gemeinde>Hamburg</app:gemeinde><app:beitragszustand>erschließungsbeitrags-/kostenerstattungsbeitragsfrei und abgabenfrei nach Kommunalabgabengesetz</app:beitragszustand>" +
          "<app:entwicklungszustand>B Baureifes Land</app:entwicklungszustand><app:bodenrichtwertgruppennr>69</app:bodenrichtwertgruppennr>" +
          "<app:bodenrichtwertgruppenkuerzel>M BH</app:bodenrichtwertgruppenkuerzel><app:normschichtwert>3800.00</app:normschichtwert>" +
          "<app:schichtwert>{\"normschichtwert_buero_text\":\"Normierter Bodenrichtwert für Bürohäuser\",\"normschichtwert_buero\":\"3800.00\"}</app:schichtwert>" +
          "<app:bezirk>Hamburg-Mitte</app:bezirk><app:statistisches_gebiet>1006</app:statistisches_gebiet>" +
          "<app:strassenschluessel>A158</app:strassenschluessel><app:strassenname>Alter Wall</app:strassenname>" +
          "<app:hausnummer>11</app:hausnummer><app:baublock>102010</app:baublock>" +
          "<app:geom_zone>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_4019910_APP_GEOM_ZONE'-->" +
            "<gml:Polygon gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_4019910_APP_GEOM_ZONE\" srsName=\"EPSG:25832\"><gml:exterior><gml:LinearRing srsName=\"EPSG:25832\">" +
                  "<gml:posList>565727.305 5934016.856 565726.657 5934002.607 565726.395 5934002.902 565699.499 5933978.689 565699.402 5933978.603 565698.896 5933978.188 565698.773 5933978.095 565680.481 5933964.501 565680.072 5933964.212 565679.517 5933963.867 565678.940 5933963.558 565678.344 5933963.288 565677.732 5933963.058 565677.106 5933962.868 565676.469 5933962.720 565675.823 5933962.613 565675.172 5933962.549 565674.519 5933962.528 565673.865 5933962.549 565673.805 5933962.553 565634.712 5933927.529 565635.082 5933927.111 565620.998 5933928.663 565672.520 5933974.823 565674.519 5933972.524 565692.811 5933986.118 565726.899 5934016.806 565727.022 5934016.873 565727.201 5934016.892 565727.305 5934016.856</gml:posList>" +
                "</gml:LinearRing></gml:exterior></gml:Polygon>" +
          "</app:geom_zone>" +
          "<app:geom_brw_grdstk>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_4019910_APP_GEOM_BRW_GRDSTK'--><gml:Point gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_4019910_APP_GEOM_BRW_GRDSTK\" srsName=\"EPSG:25832\">" +
              "<gml:pos>565674.000 5933968.000</gml:pos></gml:Point>" +
          "</app:geom_brw_grdstk>" +
        "</app:lgv_brw_zoniert_alle>" +
      "</gml:featureMember>" +
      "<gml:featureMember>" +
        "<app:lgv_brw_zoniert_alle xmlns:app=\"http://www.deegree.org/app\" gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_5963053\">" +
          "<app:jahrgang>2020</app:jahrgang><app:richtwertnummer>01510239</app:richtwertnummer>" +
          "<app:richtwert_euro>11165.24</app:richtwert_euro><app:richtwert_dm>21837.31</app:richtwert_dm>" +
          "<app:postleitzahl>20457</app:postleitzahl><app:nutzung>M</app:nutzung><app:nutzung_ergaenzung>BH</app:nutzung_ergaenzung>" +
          "<app:nutzung_kombiniert>BH Bürohäuser</app:nutzung_kombiniert><app:geschossfl_zahl>3.70</app:geschossfl_zahl>" +
          "<app:stadtteil>Hamburg-Altstadt</app:stadtteil><app:gemeinde>Hamburg</app:gemeinde>" +
          "<app:beitragszustand>erschließungsbeitrags-/kostenerstattungsbeitragsfrei und abgabenfrei nach Kommunalabgabengesetz</app:beitragszustand>" +
          "<app:entwicklungszustand>B Baureifes Land</app:entwicklungszustand><app:bodenrichtwertgruppennr>69</app:bodenrichtwertgruppennr>" +
          "<app:bodenrichtwertgruppenkuerzel>M BH</app:bodenrichtwertgruppenkuerzel><app:normschichtwert>3800.00</app:normschichtwert>" +
          "<app:schichtwert>{\"normschichtwert_buero_text\":\"Normierter Bodenrichtwert für Bürohäuser\",\"normschichtwert_buero\":\"3800.00\"}</app:schichtwert>" +
          "<app:bezirk>Hamburg-Mitte</app:bezirk><app:statistisches_gebiet>1006</app:statistisches_gebiet>" +
          "<app:strassenschluessel>A158</app:strassenschluessel><app:strassenname>Alter Wall</app:strassenname>" +
          "<app:hausnummer>11</app:hausnummer><app:baublock>102010</app:baublock>" +
          "<app:geom_zone>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_5963053_APP_GEOM_ZONE'-->" +
            "<gml:Polygon gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_5963053_APP_GEOM_ZONE\" srsName=\"EPSG:25832\">" +
              "<gml:exterior><gml:LinearRing srsName=\"EPSG:25832\">" +
                  "<gml:posList>565727.305 5934016.856 565726.657 5934002.607 565726.395 5934002.902 565699.499 5933978.689 565699.402 5933978.603 565698.896 5933978.188 565698.773 5933978.095 565680.481 5933964.501 565680.072 5933964.212 565679.517 5933963.867 565678.940 5933963.558 565678.344 5933963.288 565677.732 5933963.058 565677.106 5933962.868 565676.469 5933962.720 565675.823 5933962.613 565675.172 5933962.549 565674.519 5933962.528 565673.865 5933962.549 565673.805 5933962.553 565634.712 5933927.529 565635.082 5933927.111 565620.998 5933928.663 565672.520 5933974.823 565674.519 5933972.524 565692.811 5933986.118 565726.899 5934016.806 565727.022 5934016.873 565727.201 5934016.892 565727.305 5934016.856</gml:posList>" +
                "</gml:LinearRing></gml:exterior></gml:Polygon>" +
          "</app:geom_zone>" +
          "<app:geom_brw_grdstk>" +
            "<!--Inlined geometry 'APP_LGV_BRW_ZONIERT_ALLE_5963053_APP_GEOM_BRW_GRDSTK'-->" +
            "<gml:Point gml:id=\"APP_LGV_BRW_ZONIERT_ALLE_5963053_APP_GEOM_BRW_GRDSTK\" srsName=\"EPSG:25832\"><gml:pos>565674.000 5933968.000</gml:pos></gml:Point>" +
          "</app:geom_brw_grdstk>" +
        "</app:lgv_brw_zoniert_alle>" +
      "</gml:featureMember>" +
    "</wfs:FeatureCollection>",
    convertResponse: {
        "ExecuteResponse": {
            "attributes": {
                "xmlns:wps": "http://www.opengis.net/wps/1.0.0",
                "xmlns:ows": "http://www.opengis.net/ows/1.1",
                "xmlns:ogc": "http://www.opengis.net/ogc",
                "xmlns:xlink": "http://www.w3.org/1999/xlink",
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                "service": "WPS",
                "version": "1.0.0",
                "xml:lang": "en",
                "xsi:schemaLocation": "http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_response.xsd",
                "serviceInstance": "https://geodienste.hamburg.de/HH_WPS?service=WPS&request=GetCapabilities&version=1.0.0"
            },
            "Process": {
                "attributes": {
                    "wps:processVersion": "0.0.1"
                },
                "Identifier": "BRWConvert.fmw",
                "Title": "BrwConvert",
                "Abstract": "<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">Prio: hoch</p> <p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">kritisch: ja</p> <p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">Ansprechpartner: gutachterausschuss@gv.hamburg.de</p> <p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">     <br/> </p> <p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">Beschreibung:</p> <p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">Diese Workbench rechnet einen aktuellen Bodenrichtwert auf ein individuelles Grundstück um und nutzt hierfür Parameter, die dieser Workbench mitgegeben werden. </p> "
            },
            "Status": {
                "attributes": {
                    "creationTime": "2022-06-22T08:54:19.160Z"
                },
                "ProcessSucceeded": "Process execution finished@2022-06-22T08:54:19.160Z"
            },
            "ProcessOutputs": {
                "Output": {
                    "Identifier": "FMEResponse",
                    "Title": "Response from FME (Job Submitter Service)",
                    "Data": {
                        "ComplexData": {
                            "attributes": {
                                "mimeType": "application/xml"
                            },
                            "Bodenrichtwert": {
                                "attributes": {
                                    "xmlns:wps": "http://www.safe.com/xml/xmltables",
                                    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                                    "xsi:schemaLocation": "http://www.safe.com/xml/xmltables output.xsd"
                                },
                                "Parameter": "",
                                "Ergebnis": {
                                    "BRW": "5.34",
                                    "ErrorOccured": "No",
                                    "Fehlermeldung": ""
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
