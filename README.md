# Video_Annotation_src

## File structure description:

1. Source code is in `src` folder
2. The `templates` folder contains html written with HBS library, which is mainly used for the purpose of promatically control what html elements to show in the workflow. The HBS files are pre-compiled into a JS file within dev environment to speed up the workflow (see `src/js/components/controls.js` for more details) 
3. The `js/components` folder contains Javascript files corresponding to the hbs file with the same name. 
4. `annotation_comments.js` and `index.js` are the entry point of the program, which is mainly responsible for registering the program as a plugin for video.js -- I have made some modification to make it work with default html video player. Please check the other repo.  
5. The program is written in the OOP fashion, and use Babel to handle backward compatibility. 
6. "shape" is referring to the orange square when users toggle cursur to draw a highlight; "Marker" is referring to the highlighted tick on the video timeline when annotation is made.
7. To understand the program workflow, please look into `src/js/components/controls.js`. There's a `bindEvents` function which select elements using css selector and bind it with different events. 

## Develop and Build

- cd into `videojs-annotation-comments`
- Use node 10.13.0 or 10.15.2 by `nvm use 10.13.0`
- Run `yarn install`
- Run `yarn build`
- Run `yarn watch`
- Website is hosted at `http://localhost:3004/test.html`


## Customize templates

1. html codes can be added in `controls.hbs`
2. In `js/components/controls.js`, add corresponding Javascript codes to control when to show temmplates. 

## Original project website: 
https://github.com/contently/videojs-annotation-comments