# StorySelector

The StorySelector is a tool that lists all stories for the DataNarrator provided in a json configured through the tool parameter storyIndexURL. It opens the story which was clicked on. The json includes imformation about each story such as title, title image, a description about the story and the reading time.
The tool was created for the DIPAS project but can be used anywhere.

## Config stories.json

The main parameters in the json are as follows:

1. "proceedingname" - Name of the proceeding/ project for which the stories were created. This is shown as a second headline below the title of the tool.
2. "proceedingurl" - URL of the proceeding/ project web page. This is set as a link on the proceedingname.
3. "storycount" - Number of stories of the proceeding/ project
4. "storybaseurl" - The base URL to the masterportal including the the URL to the json containing all the stories as a URL parameter
5. "toolheadline" - The headline of the tool
6. "stories" - Array containing all the stories with the parameters below

The parameters of each story are as follows:

1. "nid" - The ID of the story. This ID is used by the tool in combination with the storybaseurl to open the story
2. "title" - The title of the story
3. "description" - The description used in the tool to provide some information about the story
4. "coverImagePath" - The image to be used in the tool for each story
5. "coverImageAlt" - An alt tag to be used for the image
6. "reading_time" - The estimated time a reader will take to read the whole story

## Configuration
Below are the parameters the tool can be configered with in the config.json of the masterportal.
In addition to the default parameters of each masterportal tool the tool has the parameter storyIndexURL.

| Name               | Required | Type    | Default        | Description                                                                              |
| ------------------ | -------- | ------- |----------------| ---------------------------------------------------------------------------------------- |
| name               | no       | String  | Story-Selector  | Name of the tool in the menu.                                                            |
| icon               | no       | String  | bi-bookshelf   | Bootstrap class, which is displayed before the name of the tool in the menu.             |                                       |
| storyIndexURL      | yes      | String  |-               | The URL pointing to the json containing the parameters listed above
