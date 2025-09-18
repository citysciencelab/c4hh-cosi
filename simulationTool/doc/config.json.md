#### Portalconfig.menu.tools.children.simulationTool

Tool to simulate wind and noise.

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|name|yes|String|Connected Urban Simulations|The title of the tool.|false|
|icon|yes|String|bi-sliders2|The icon to use.|false|
|simulationApiUrl|yes|String|https://ump-lgv.germanywestcentral.cloudapp.azure.com/api|The api url.|true|
|dataSources|yes|**[dataSources](#markdown-header-portalconfigmenutoolsimulationtooldatasources)**| |The data sources.|true|
|simulations|yes|**[simulations](#markdown-header-portalconfigmenutoolsimulationtoolsimulations)**| |The settings for simulations.|true|

#### Portalconfig.menu.tool.simulationTool.dataSources

[inherits]: # (Portalconfig.menu.tool)

**datasources**

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|id|ja|String||The id of datasource.|true|
|title|ja|String||The titel of datasource.|true|
|maxSideLength|ja|Number|450|The maximum allowed side lenght for the selected area in meters.|true|
|inputs|yes|Object|Object|An object to set input parameter for datasources.|true|

#### Portalconfig.menu.tool.simulationTool.simulations

[inherits]: # (Portalconfig.menu.tool)

**simulations**

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|id|ja|String||The id of simulation.|true|
|title|ja|String| |The titel of simulation.|true|
|inputs|yes|Object|Object|An object to set input parameter for simulation. Parent parameters that should be ignored can be configured as "menu": "nowhere". Nested parameters to be ignored should be listed in the "ignoreProperties" array inside their parent input config object. |true|
|outputs|yes|Object|Object|An object to set output parameter for simulation.|true|
|processes|yes|**[processes](#markdown-header-portalconfigmenutoolsimulationtoolsimulationsprocesses)**| |The settings for processes.|true|
|resultStyle|yes|Object|Object|An object to set style for simulation result.|true|

#### Portalconfig.menu.tool.simulationTool.simulations.processes

[inherits]: # (Portalconfig.menu.tool)

**processes**

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|id|ja|String||The id of process.|true|
|title|ja|String| |The titel of process.|true|
|url|ja|String| |The url of the process.|true|
|pollingInterval|ja|Number| |The number of interval.|true|
|resultStyle|yes|Object|Object|An object to set style for simulation result.|true|
|renderingOptions|yes|Object|Object|An object to set rendering options.|true|

**Example**
```
#!json
{
  "type": "simulationTool",
  "name": "additional:modules.tools.simulationTool.title",
  "icon": "bi-sliders2",
  "simulationApiUrl": "https://ump-lgv.germanywestcentral.cloudapp.azure.com/api",
  "dataSources": [
	{
	  "id": "default",
	  "title": "Gebäude und Straßen (für Lärm- und Windsimulation)",
	  "maxSideLength": 500,
	  "inputs": {
		"buildings": {
		  "editable": true,
		  "label": "Gebäude",
		  "propertiesMapping": {
			"street": "Straße",
			"building_height": "Höhe"
		  },
		  "propertiesToShow": ["street", "building_height"],
		  "sortBy": "street",
		  "source": {
			"type": "oaf",
			"collection": "buildings",
			"url": "https://ump-lgv.germanywestcentral.cloudapp.azure.com/oaf/buildings_footprint"
		  }
		},
		"crs": "http://www.opengis.net/def/crs/EPSG/0/25832",
		"roads": {
		  "editable": true,
		  "label": "Straßen",
		  "propertiesMapping": {
			"strassenname": "Straßenname",
			"light_vehicles_day": "Leichtverkehr Tag (LV_D)",
			"light_vehicles_evening": "Leichtverkehr Abend (LV_E)",
			"light_vehicles_night": "Leichtverkehr Nacht (LV_N)",
			"medium_vehicles_day": "Mittelverkehr Tag (MV_D)",
			"medium_vehicles_evening": "Mittelverkehr Abend (MV_E)",
			"medium_vehicles_night": "Mittelverkehr Nacht (MV_N)",
			"heavy_vehicles_day": "Schwerverkehr Tag (HGV_D)",
			"heavy_vehicles_evening": "Schwerverkehr Abend (HGV_E)",
			"heavy_vehicles_night": "Schwerverkehr Nacht (HGV_N)",
			"light_speed_day": "Geschwindigkeit Leichtverkehr Tag (LV_SPD_D)",
			"light_speed_evening": "Geschwindigkeit Leichtverkehr Abend (LV_SPD_E)",
			"light_speed_night": "Geschwindigkeit Leichtverkehr Nacht (LV_SPD_N)",
			"medium_speed_day": "Geschwindigkeit Mittelverkehr Tag (MV_SPD_D)",
			"medium_speed_evening": "Geschwindigkeit Mittelverkehr Abend (MV_SPD_E)",
			"medium_speed_night": "Geschwindigkeit Mittelverkehr Nacht (MV_SPD_N)",
			"heavy_speed_day": "Geschwindigkeit Schwerverkehr Tag (HGV_SPD_D)",
			"heavy_speed_evening": "Geschwindigkeit Schwerverkehr Abend (HGV_SPD_E)",
			"heavy_speed_night": "Geschwindigkeit Schwerverkehr Nacht (HGV_SPD_N)",
			"pavement": "Straßenbelagtyp"
		  },
		  "propertiesToShow": ["strassenname"],
		  "sortBy": "strassenname",
		  "source": {
			"type": "oaf",
			"collection": "streets",
			"url": "https://ump-lgv.germanywestcentral.cloudapp.azure.com/oaf/streets_traffic"
		  }
		}
	  }
	}
  ],
  "simulations": [
	{
	  "id": "noise_v4:traffic_noise",
	  "title": "Traffic Noise",
	  "inputs": {
		"acoustic_parameters": {
		  "menu": "primary",
		  "propertiesMapping": {
			"humidity": "Humidity",
			"max_reflection_distance": "Max. reflection distance",
			"temperature": "Temperature"
		  }
		},
		"buildings": {
		  "editable": true
		},
		"building_grid_settings": {
		  "menu": "primary",
	      "primaryProperties": ["height_between_levels_3d", "receiver_distance", "receiver_height_2d"],
		  "propertiesMapping": {},
          "ignoreProperties": ["join_receivers_by_xy_location_3d"]
		},
		"dem_url": {
		  "source": {
			"type": "optional_bbox_url",
			"url": "https://ump-lgv.germanywestcentral.cloudapp.azure.com/raster/dem5_hh/cog/bbox"
		  }
		},
		"ground_absorption": {
		  "menu": "primary",
		  "source": {
			"type": "oaf",
			"collection": "ground",
			"url": "https://ump-lgv.germanywestcentral.cloudapp.azure.com/oaf/ground_gruenflaechen"
		  }
		},
		"receiver_grid_settings": {
		  "menu": "primary",
		  "primaryProperties": ["calculation_height"],
		  "propertiesMapping": {
			"humidity": "Humidity",
			"max_reflection_distance": "Max. reflection distance",
			"temperature": "Temperature"
		  }
		},
		"roads": {
		  "editable": true
		}
	  },
	  "outputs": {
		"propertiesMapping": {
		  "noise_day": "Lärm am Tag",
		  "noise_den": "Lärm am Tag und bei Nacht",
		  "noise_evening": "Lärm am Abend",
		  "noise_night": "Lärm bei Nacht"
		}
	  },
	  "processes": [
		{
		  "id": "noise_v4:traffic_noise_propagation",
		  "title": "Traffic Noise Propagation Calculation",
		  "url": "https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/",
		  "pollingInterval": 1000,
		  "resultStyle": {
			"property": "ISOLABEL",
			"styles": [
			  {
				"value": "< 35",
				"style": {
				  "fillColor": [187, 201, 204, 1],
				  "strokeColor": [187, 201, 204, 1],
				  "strokeWidth": 1
				}
			  },
			  {
				"value": "35-40",
				"style": {
				  "fillColor": [194, 206, 214, 1],
				  "strokeColor": [194, 206, 214, 1],
				  "strokeWidth": 1
				}
			  },
			  {
				"value": "40-45",
				"style": {
				  "fillColor": [206, 223, 220, 1],
				  "strokeColor": [206, 223, 220, 1],
				  "strokeWidth": 1
				}
			  },
			  {
				"value": "45-50",
				"style": {
				  "fillColor": [222, 234, 215, 1],
				  "strokeColor": [222, 234, 215, 1],
				  "strokeWidth": 1
				}
			  },
			  {
				"value": "50-55",
				"style": {
				  "fillColor": [234, 243, 206, 1],
				  "strokeColor": [234, 243, 206, 1],
				  "strokeWidth": 1
				}
			  },
			  {
				"value": "55-60",
				"style": {
				  "fillColor": [237, 214, 161, 1],
				  "strokeColor": [237, 214, 161, 1],
				  "strokeWidth": 1
				}
			  },
			  {
				"value": "60-65",
				"style": {
				  "fillColor": [218, 162, 123, 1],
				  "strokeColor": [218, 162, 123, 1],
				  "strokeWidth": 1
				}
			  },
			  {
				"value": "65-70",
				"style": {
				  "fillColor": [195, 123, 113, 1],
				  "strokeColor": [195, 123, 113, 1],
				  "strokeWidth": 1
				}
			  },
			  {
				"value": "70-75",
				"style": {
				  "fillColor": [165, 92, 123, 1],
				  "strokeColor": [165, 92, 123, 1],
				  "strokeWidth": 1
				}
			  },
			  {
				"value": "75-80",
				"style": {
				  "fillColor": [136, 76, 132, 1],
				  "strokeColor": [136, 76, 132, 1],
				  "strokeWidth": 1
				}
			  },
			  {
				"value": "> 80",
				"style": {
				  "fillColor": [105, 76, 118, 1],
				  "strokeColor": [105, 76, 118, 1],
				  "strokeWidth": 1
				}
			  }
			],
			"type": "polygon"
		  }
		},
		{
		  "id": "noise_v4:traffic_noise_buildings",
		  "title": "Traffic Noise Immission Calculation around building facades",
		  "url": "https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/",
		  "pollingInterval": 1000,
		  "renderingOptions": {
			"featureRenderMode": "table",
			"modeRuleAttribute": "building_grid_settings.grid_type",
			"attributeToShow": "LAEQ"
		  }
		}
	  ]
	}
  ],
  "hiddenSideMenus": ["job", "help-panel"]
}
```

***




