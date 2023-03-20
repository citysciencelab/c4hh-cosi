# Running CoSI locally

## Assumptions
- running iOS.
- (npm installed via homebrew)
- nvm installed
- git installed
- You have a Bitbucket account and access to the following repositories (if you do not have access, currently the developers at LGV can grant you access):
	- https://bitbucket.org/geowerkstatt-hamburg/masterportal
	- https://bitbucket.org/geowerkstatt-hamburg/addons
	- https://bitbucket.org/geowerkstatt-hamburg/portalconfigs
- You have your git authentication set up in your command line using an access token


## Qickstart
Run this in terminal:

```
git clone https://bitbucket.org/geowerkstatt-hamburg/masterportal
cd masterportal
git checkout dev

rm -r addons

git clone https://bitbucket.org/geowerkstatt-hamburg/addons addons
git clone https://bitbucket.org/geowerkstatt-hamburg/portalconfigs

cd addons
git checkout dev
cd ../portal
git checkout dev
cd ..

nvm install 16.16.0
nvm use 16.16.
node -v

npm install

cd addons
npm run postinstall
cd ..

npm start
```
After some compile time, CoSI should run at https://localhost:9001/portal/cosi



Cosi consists of three repositories. They are available on Bitbucket (private repos, owned by the city). There is also a fork on Github (privated repos, owned by the CityScienceLab github organisation). The three repos are: 
1. The `masterportal` (https://bitbucket.org/geowerkstatt-hamburg/masterportal)
2. Two folders of the masterportal are replaced by another repository each. These folders are set to be (git)ignored by the masterportal repository.
	1. the `addons` folder in masterportal is replaced by
		1. https://bitbucket.org/geowerkstatt-hamburg/addons
	2. the `portal` folder in masterportal is replaced by https://bitbucket.org/geowerkstatt-hamburg/portalconfigs
3. on all repositories we work on the branch called `cosi/dev` (not `dev`)

So we clone the masterportal repo first and get on the right branch
Delete folders to be replaced with the other two repos
download relevant repos as these folders
- `geowerkstatt-hamburg/addons` as `addons`
- `geowerkstatt-hamburg/portalconfigs` as `portal`
Switch to the relevant branches
Set up Node and Install. You might need to use a specific node version. On 24.08.22 it's `16.16.0` .
Then install the masterportal node dependencies (in masterportal root folder):

Cosi consists of multiple nested node apps. For each, the dependencies have to be installed. there is a costum script `postinstall` to do this correctly (defined in /addons/package.json) that can be executed when in the addons folder.


# More Developer Documentation (under construction)


## Development Workflow

### Git Branching Model

- in all three repositories, development should happen in feature branches. After a code review, and if all unit tests pass, these changes go direclty into the `dev` branch (which is the branch that is in production).
- adding a new feature:
	- open a ticket on jira (jira.geowerkstatt-hamburg.de). On the ticket, you can create a branch for your feature
	- `git checkout FEATURE_BRANCH_NAME` to switch to that new branch locally
	- `git commit -m "commit message"` to commit your changes to that feature branch
	- `npm run test:cosi` when your code is ready, make sure all unit tests pass with (see TDD section)
	- `git rebase dev` your branch to be ahead of the `dev` branch. [more](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)
	- fix any merge conflicts and run all unit tests again
	- create a pull request on jira, and assign someone to review your code
	- make changes as discussed with the reviewer
	- The person who reviews the code can then accept your pull request to the dev branch.
	- `git merge -ff` when accepting a pull request, make sure to merge with fast forward. That way (together with `rebase`), your changes will appear as a single commit at the time when your feature appears on the dev branch.
	- `git checkout dev` go back to the dev branch
	- `git pull` the changes that happened
	- `git branch -d FEATURE_BRANCH_NAME` delete the feature branch
	- done!




### IDE setup

- This documentation assumes you're using VSCode as your IDE
	- Download VScode
	- install Plugins
		- eslint
		- vue
- To ensure the linter (checks coding rules are fulfilled) works, add the path to your masterportal root folder to the visual studio code `settings.json` file under `eslint.workingDirectories`

 
 ## TDD
- Understanding Tests
	- have a look at "vue test utils"
	- 
- Writing Tests
	- make tests short - test one thing at a time
	- test only internal components (i.e. not functioning of a third party api)
	- test only the smallest components, not end-to-end
	- tests for 
		- dom
		- computed properties
		- user interactions
	- as an example for how tests should look like, see districtselector
- Running tests
		- there is a command set up to run only the cosi tests: `test:cosi 

 

## Developer Rules & Pre-push Hooks

- Lint
- 
- 

## Resources
- code documentation generated in masterportal `npm run buildJsDoc`
- CoSI user documentation: https://github.com/citysciencelab/cosi/tree/master/cosi
- Masterportal Developer Documentation
- Class documentation in cosi/cosi/MODULE-NAME/doc

# Stack
- the open source project "masterportal" is the foundation. It runs on
	- Node
	- Vue
		- vuetifyjs


## Architecture
- Entry point:
	- `npm start` runs `masterportal/js/app.js`. everthing else flows from there.
