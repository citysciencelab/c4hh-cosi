<?php
	/**
	 * Dieses Skript stellt eine Verbindung zur activedirectory.php her, die den Abgleich mit dem AD herstellt.
	 * Dort werden diverse Variablen aus dem AD ausgelesen und im PHP gesetzt. Hier erfolgt nun eine Auswertung
	 * dieser Variablen und eine Feststellung, welcher Nutzergruppe mit welchen Rechten der User zugeordnet ist.
	 */
	mb_internal_encoding("UTF-8");
	require ('../libs/php/activedirectory.php');
	evaluateuser();
	if (ismemberofgroup('CN=U-LGV-LGV_G31,OU=Universal,OU=Gruppen,OU=GV,DC=fhhnet,DC=stadt,DC=hamburg,DC=de') == TRUE){
        $accessgranted =  true;
        // memberOf: CN=U-LGV-VL-LGV-G31,OU=Verteilerlisten,OU=Exchangeverwaltung,OU=Gruppen,OU=GV,DC=fhhnet,DC=stadt,DC=hamburg,DC=de
	}
    elseif (ismemberofgroup('CN=U-LGV-VL-LGV-G32,OU=Verteilerlisten,OU=Exchangeverwaltung,OU=Gruppen,OU=GV,DC=fhhnet,DC=stadt,DC=hamburg,DC=de') == TRUE){
		$accessgranted =  true;
    }
	elseif (ismemberofgroup('CN=ROL-LGV-VL-G3,OU=Verteilerlisten,OU=Exchangeverwaltung,OU=Gruppen,OU=GV,DC=fhhnet,DC=stadt,DC=hamburg,DC=de') == TRUE){
		$accessgranted =  true;
    }
    elseif (ismemberofgroup('CN=ROL-LGV-VL-G2,OU=Verteilerlisten,OU=Exchangeverwaltung,OU=Gruppen,OU=GV,DC=fhhnet,DC=stadt,DC=hamburg,DC=de') == TRUE){
		$accessgranted =  true;
    }
	elseif (ismemberofgroup('CN=ROL-LGV-VL-G1,OU=Verteilerlisten,OU=Exchangeverwaltung,OU=Gruppen,OU=GV,DC=fhhnet,DC=stadt,DC=hamburg,DC=de') == TRUE){
		$accessgranted =  true;
    }
	// elseif (ismemberofgroup('CN=ROL-N-ITB-CoSI-Sprint,OU=Sondergruppen,OU=Groups,OU=N,OU=Bezirke,DC=fhhnet,DC=stadt,DC=hamburg,DC=de') == TRUE){
	// 	$accessgranted =  true;
    // }
    // elseif (ismemberofgroup('CN=ROL-N-ITB-CoSI-Prod,OU=Sondergruppen,OU=Groups,OU=N,OU=Bezirke,DC=fhhnet,DC=stadt,DC=hamburg,DC=de') == TRUE){
	// 	$accessgranted =  true;
    // }
    elseif (ismemberofgroup('CN=ROL-HH007-COSI-SPRINT-VL,OU=Gruppen,OU=00,OU=007,OU=Mandanten,DC=fhhnet,DC=stadt,DC=hamburg,DC=de') == TRUE){
		$accessgranted =  true;
    }
    elseif (ismemberofgroup('CN=ROL-HH007-COSI-PROD-VL,OU=Gruppen,OU=00,OU=007,OU=Mandanten,DC=fhhnet,DC=stadt,DC=hamburg,DC=de') == TRUE){
		$accessgranted =  true;
    }
	elseif (ismemberofgroup('CN=RES-DTZ73-OS-FDS-FVM,OU=Gruppen,OU=FDSOpenS_HH001,OU=Verfahren,OU=Dataport,DC=fhhnet,DC=stadt,DC=hamburg,DC=de') == TRUE){
		$accessgranted =  true;
	}
	else {
		throw new Exception ('Sie besitzen keine Berechtigung, um dieses Portal zu betreten.</br>Bitte wenden Sie sich an Ihren Administrator.');
		$accessgranted =  false;
	}
?>
