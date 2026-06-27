<?php
	mb_internal_encoding("UTF-8");
	try {
		require ("urm.php");
		if ($accessgranted == true) {
			echo '<!DOCTYPE html>';
			echo '<html lang="de">';
			echo '<meta http-equiv="X-UA-Compatible" content="IE=edge">';
			echo '<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=0">';
			echo '<meta name="apple-mobile-web-app-capable" content="yes">';
			echo '<meta name="mobile-web-app-capable" content="yes">';
			echo '<title>CoSI - Cockpit Städtische Infrastrukturen</title>';
			echo '<script type="module" src="../mastercode/3_22_0_dev_git_last_commit_at_2026-05-06__17-15-05/js/masterportal.js"></script>';
			echo '<link rel="stylesheet" href="../mastercode/3_22_0_dev_git_last_commit_at_2026-05-06__17-15-05/css/masterportal.css">';
			echo '<link rel="stylesheet" href="https://geodienste.hamburg.de/lgv-config/css/fonts.css">';
			echo '<link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">';
			echo '<link href="https://cdn.jsdelivr.net/npm/@mdi/font@4.x/css/materialdesignicons.min.css" rel="stylesheet">';
			echo '</head>';
            echo '<body class="touchscreen">';
            echo '<div id="masterportal-root"></div>';
			echo '</body>';
			echo '</html>';
		}
	}
	catch (exception $e){
		echo '<!DOCTYPE html>';
		echo '<html lang="de">';
		echo '<head>';
		echo '<meta charset="utf-8">';
		echo '<meta http-equiv="X-UA-Compatible" content="IE=edge">';
		echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
		echo '<title>Geoportal CoSI</title>';
		echo '<h1>' . $firstname . " " . $lastname . ", " . $e->getMessage() . '</h1>';
		echo '</head>';
		echo '</html>';
	}
?>
