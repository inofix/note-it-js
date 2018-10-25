# note-it-js

Virtual version of the famous sticky paper note solution.

## Setup / Contribute

The development of this projects requires the installation of a
`node.js` environement. Install [`node.js`](https://nodejs.org/en/)
for your OS distribution — as an alternative you can install and use
[nvm](https://github.com/creationix/nvm), to manage multiple `node.js`
versions.

With `node.js` comes `npm`, the Node Package Mananger — as an
alternative you can also use [`yarn`](https://yarnpkg.com/).


* clone this git repository
* `cd note-it-js`
* `npm install` to install the dependencies described in
  `package.json`

This projects uses [parcel.js](https://parceljs.org/) (see getting
started for more details) as web application bundler. It is used to run a development server and build the production version
of the project.

## Run de development server

Inside the project's folder:

* Be sure that you have installed all javascript dependencies with `npm
install`
* Start a development server with the command `npm start`

The command output should say on which local URL and port the
development server is accessible.

When the server is running, all changes to the project's assets are
detected. It will result in the server building a new version of
each changed assets and refreshing the web page to display all changes.

## Build the project

To build the project, use `npm run build`.

This command will create a production ready folder `./dist` containing
all assets required to run the project live.

Serve the content of this folder with entry point the `index.html`
file.

To test locally, run the command `npm run serve-build`, which will
just create a server, serving the production files from the `./dist`
folder. This command is only meant for this precise purpose, to
simulate how to right files are served to the final users.

## Releases

If your only interested in the final .js, have a look at the release page:
https://github.com/inofix/note-it-js/releases

## Examples / Demo

Running examples can be found here:
https://inofix.github.io/note-it-js/

## Perspectives

We also have a Liferay-Portlet featuring note-it-js at
https://github.com/inofix/ch-inofix-sketch-board.
