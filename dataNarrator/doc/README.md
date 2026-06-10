# Data Narrator

<p align="center">
<img src="./data-narrator-logo.png" alt="drawing" width="600"/>
</p>

The Data Narrator (DANA) is a **[Masterportal](https://www.masterportal.org/)** addon that can be used to add text,
photos and images to georeferenced data sets.
This allows the typically technical, data-only representations to be supplemented with descriptive information.
The data is contextualised, making complex relationships easier to understand.
Users can scroll through a story step by step.

The Data Narrator was originally created by the City Science Lab of the HafenCity University Hamburg within the Connected Urban Twin project
for the Masterportal version 2.x.
This original addon can be found here **[City Science Lab ](https://github.com/citysciencelab/cut-data-narrator)**
A special player (DipasPlayer) was created for the DIPAS project **[DIPAS ](https://dipas.org/)**
The Data Narrator addon has now been migrated to Masterportal version 3.x by the State Agency for Geoinformation and Surveying Hamburg.
The addon is now maintained by the State Agency for Geoinformation and Surveying.
The DipasPlayer can be used as is. 
However, if any modifictions to the DipasPlayer are required which are not agreed by the DIPAS project, a new player must be created and referenced using the displayType parameter in the story.json.


### Story JSON

The main attributes of the story.json configuration file are the follwing:

1. "title" - The name of the story
2. "author" - The author visible at the story entry page
3. "description" - The description of the story shown in the Masterportal menu
4. "coverImagePath" - The cover image of the story shown at the top of the story
5. "coverImageAlt" - The alternative text for the image in case the image is broken
6. "coverImageCaption" - The caption of the cover image
7. "coverImageCopyright" - The copyright of the cover image
8. "displayType" - The display type defining the player used. At this stage only "dipas" is available
9. "showHomeButton" - Boolean value to define if the button to get to the overview of all available stories is shown.
                        Note, the addon dipasStorySelector must be configured to be able to show the overview of all stories.
10. "styleCSS" - The path to a css style sheet which overwrites some colors
11. "showDipasLogo" - Boolean value to define if the DIPAS_stories logo at the top shall be shown. Default is true.
12. "steps" - Array of the story steps



The story steps attributes in the story.json are as follows:

1. "title" - Title of the step (e.g. "Intro")
2. "titleImage" - The path to the title image of the step
3. "titleImageAlt" - The alternative text for the image in case the image is broken
4. "titleImageCaption" - The caption of the title image
5. "titleImageCopyright" - The copyright of the title image
6. "htmlFile" - String of the .html file containing the steps content (e.g. step_1-1.html)
7. "centerCoordinate" - Array for the definition of the steps map center position (e.g. [
   555894.6872343315,
   5931378.984010641
   ])
8. "zoomLevel" - Number of the steps map zoom level (e.g. 3)
9. "layers" - Array of IDs that define the map layers shown for this step (e.g. [
   "128",
   "129"
   ])
10. "interactionAddons" - Array of strings that indicating the active addons for this step (e.g. [
    "coordinates",
    "measure"])
11. "is3D" - Boolean indicating if the 3D map is activated for this step
12. "navigation3D": - If 'is3D' is true, then this attribute contains the camera configuration. (e.g. {
    "cameraPosition": [
    9.948301,
    53.552374,
    343.8
    ],
    "heading": 0.38138509963163635,
    "pitch": -0.4525214263618002
    })
    In the case of a 3D mode, the attributes 'zoomLevel' and 'centerCoordinate' are obsolete


## Configuration


**Example in the config.json**

```json
"dataNarrator": {
    "type": "dataNarrator",
    "storyConfJson": "./story.json"
}
```

The path to the story.json must be configured in the config.json using the storyConfJson parameter.
Alternatively it is possible to specify the story.json in a URL paramter story  e.g. https://test-portal/demoStory/?story=https://url-to-story-json#

## Story content folder structure within a Masterportal portal


The story content must be within the folder structure of a Masterportal portal within an assets folder.
The html files of each step must be in the steps folder.
Optionally the colors of the DIPAS player can be adjusted using a style.css file. This can be in the css folder and must be referenced the story.json. 

```
masterportal/portal
|-- my_portal
|    config.js
|    config.json
|    index.html
|    story.json
|    assets
|    |-- steps
|        step_1-1.html
|        step_2-1.html
|        step_2-2.html
|    |-- css
|        style.css

```


config.js

```js
const Config = {
    addons: ["dataNarrator"],
    [...
]
}
;
```



style.css

If any changes to the default colors are desired the following styles file can be used.
The path to this styles file needs to be addressed in the story.json using the parameter styleCSS.

```
:root {
	--DipasColorsPrimary1: #003063;
	--DipasColorsPrimary2: #e10019;
	--DipasColorsFont: #212529;
	--DipasColorsPrimaryButtonHover: #b4081b;
	--DipasColorsPrimary1TextColor: #ffffff;
	--DipasColorsPrimary2TextColor: #ffffff;
}
```




