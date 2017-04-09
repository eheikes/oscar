# OSCAR Client UI

This project contains the client app for the OSCAR assistant.

It is written in [Vue.js](https://vuejs.org/) and Typescript, with [Vue class decorators](https://github.com/vuejs/vue-class-component). The design uses [Materialize](http://materializecss.com/).

## Requirements

A modern browser (Chrome, Firefox, Edge, Safari) is required to run the app.

## Installation & Usage

The built files are stored in the `build` folder. However, you may want to change the app configuration (in the `src/config.ts` file) and rebuild for your specific setup.

## Development

If you want to make changes to the software, the following npm scripts are available:

```
npm run clean  # deletes the build folder
npm run lint   # checks the code for errors
npm run build  # compiles the source code and saves it into the "build" folder
npm test       # runs the test suite
```
