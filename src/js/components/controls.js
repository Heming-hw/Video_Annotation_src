/*
    Component for managing annotation "control box" in upper left of video when in annotation mode,
    including all functionality to add new annotations
*/

const PlayerUIComponent = require('./../lib/player_ui_component');
const Utils = require('./../lib/utils');
const DraggableMarker = require('./draggable_marker.js');
const SelectableShape = require('./selectable_shape.js');
const PlayerButton = require('./player_button');
const Annotation = require('./annotation');

const SelectableShape_shape_screenShot = require('./../screenShotAnnot/selectable_shape_screenShot.js')

const templateName = 'controls';

// Control uses a "ui state" to determine how UI is rendered - this object is the base state, containing a
// default value for each item in the state
const BASE_UI_STATE = Object.freeze({
  adding: false, // Are we currently adding a new annotation? (step 1 of flow)
  writingComment: false, // Are we currently writing the comment for annotation (step 2 of flow)
  showTemplates: false // whether to use template or not
  // addTemplatesToComment: false // whether to add template inputs to comment box.
});

module.exports = class Controls extends PlayerUIComponent {
  constructor(player, bindArrowKeys) {
    super(player);
    this.initAPI(this, 'Controls');

    this.internalCommenting = this.plugin.options.internalCommenting;
    this.showControls = this.plugin.options.showControls;
    this.uiState = Utils.cloneObject(BASE_UI_STATE);

    // templateContent, an instance variable. Default to be an empty string if not filled out by user. 
    this.templateContent = ""

    this.bindEvents(bindArrowKeys);

    if (this.showControls) {
      // create player button in the control bar if controls are shown
      this.playerButton = new PlayerButton(this.player);
    }
    this.render();
  }
  
  // Bind all the events we need for UI interaction
  bindEvents(bindArrowKeys) {
    // this.$player
    //   .on('click.vac-controls', '.vac-controls button', this.startAddNew.bind(this)) // Add new button click
    //   .on('click.vac-controls', '.vac-annotation-nav .vac-a-next', () =>
    //     this.plugin.annotationState.nextAnnotation()
    //   ) // Click 'next' on annotation nav
    //   .on('click.vac-controls', '.vac-annotation-nav .vac-a-prev', () =>
    //     this.plugin.annotationState.prevAnnotation()
    //   ) // Click 'prev' on annotation nav
    //   .on('click.vac-controls', '.vac-video-move .vac-a-next', () => this.marker.scrubStart(1)) // Click '+1 sec' on marker nav
    //   .on('click.vac-controls', '.vac-video-move .vac-a-prev', () => this.marker.scrubStart(-1)); // Click '-1 sec' on marker nav
    
    var screenImag =$(".screenshot")
    screenImag
      .on('click.vac-controls', '.vac-controls button', this.startAddNew.bind(this)) // Add new button click
    
    // if (this.internalCommenting) {
    //   this.$player
    //     .on('click.vac-controls', '.vac-add-controls button', this.writeComment.bind(this)) // 'continue' button click while adding
    //     .on(
    //       'click.vac-controls', 
    //       '.vac-template-button', 
    //       this.addTemplate.bind(this))  // clicked "add template" button
    //     .on(
    //       'click.vac-controls',
    //       '.vac-template-save',
    //       this.templateSave.bind(this)
    //     ) // clicked "save" when adding template
    //     .on(
    //       'click.vac-controls',
    //       '.vac-save-button',                                      // used to be '.vac-video-write-new.vac-is-annotation button',
    //       this.saveNew.bind(this)
    //     ) // 'Save' button click while adding
    //     .on(
    //       'click',
    //       ".vac-cancel-add-new",                                  // '.vac-add-controls a, .vac-video-write-new.vac-is-annotation a',
    //       this.cancelAddNew.bind(this)
    //     ) // Cancel link click
    //     .on(
    //       'click.vac-controls',
    //       ".vac-cancel-template",
    //       this.cancelTemplate.bind(this)
    //     );
      var screenImag =$(".screenshot")
      screenImag
        .on('click.vac-controls', '.vac-add-controls button', this.writeComment.bind(this)) // 'continue' button click while adding
        .on(
          'click.vac-controls', 
          '.vac-template-button', 
          this.addTemplate.bind(this))  // clicked "add template" button
        .on(
          'click.vac-controls',
          '.vac-template-save',
          this.templateSave.bind(this)
        ) // clicked "save" when adding template
        .on(
          'click.vac-controls',
          '.vac-save-button',                                      // used to be '.vac-video-write-new.vac-is-annotation button',
          this.saveNew.bind(this)
        ) // 'Save' button click while adding
        .on(
          'click',
          ".vac-cancel-add-new",                                  // '.vac-add-controls a, .vac-video-write-new.vac-is-annotation a',
          this.cancelAddNew.bind(this)
        ) // Cancel link click
        .on(
          'click.vac-controls',
          ".vac-cancel-template",
          this.cancelTemplate.bind(this)
        );
    // }
    if (bindArrowKeys) {
      $(document).on(`keyup.vac-nav-${this.playerId}`, e => this.handleArrowKeys(e)); // Use arrow keys to navigate annotations
    }
    // try with screenShot Annot
    $(document).on(
      'click',
      ".sac-start",
      this.screenShotAnnot.bind(this)
    )
  }

  // entry point for screenShot Annotation
  screenShotAnnot() {
    if (!this.plugin.active) this.plugin.toggleAnnotationMode();
    // var screenImag =$(".screenshot")
    // screenImag.addClass("vac-active")

    this.adding = true
    this.showControls = true
    this.render()

    // // select the div that contains the img. 
    // var imgDiv = $(".sac-cover")
    // this.selectableShape = new SelectableShape_shape_screenShot(imgDiv);

    // show cursor help text if controls are hidden
    // if (!this.showControls) this.bindCursorTooltip();

  }


  // Remove UI and unbind events for this and child components
  teardown() {
    this.clear(true);
    this.$player.off('click.vac-controls');
    
    var screenImag = $(".screenshot")
    screenImag.off('click.vac-controls')


    $(document).off(`keyup.vac-nav-${this.playerId} mousemove.vac-tooltip-${this.playerId}`);
    if (this.playerButton) this.playerButton.teardown();
    super.teardown();
  }

  // Clear existing UI (resetting components if need be)
  clear(reset = false) {
    if (reset) {
      if (this.uiState.adding) {
        this.restoreNormalUI();
        // this.marker.teardown();
        this.selectableShape.teardown();
      }
      this.uiState = Utils.cloneObject(BASE_UI_STATE);
      // this.$player
      //   .find('.vac-video-cover-canvas')
      //   .off('mousedown.vac-cursor-tooltip')
      //   .off('mouseup.vac-cursor-tooltip');

      var screenImag = $(".screenshot")
      screenImag
        .find('.vac-video-cover-canvas')
        .off('mousedown.vac-cursor-tooltip')
        .off('mouseup.vac-cursor-tooltip');

    }
    this.$tooltip_ = null;
    this.$UI.controlElements.remove();
    var screenImag = $(".screenshot")
    screenImag.find('.vac-control').remove()
  }

  // Render the UI elements (based on uiState)
  render(reset = false) {
    this.clear(reset);
    const data = {
      rangeStr: this.marker ? Utils.humanTime(this.marker.range) : null,
      showNav: this.plugin.annotationState.annotations.length > 1,
      ...this.uiState,
      internalCommenting: this.internalCommenting,
      showControls: this.showControls,
      // templateContent, an instance variable. Default to be an empty string if not filled out by user. 
      templateContent: this.templateContent
    };

    const $ctrls = this.renderTemplate(templateName, data);
    // this.$player.append($ctrls);

    // add controls
    var screenImag =$(".screenshot")
    screenImag.append($ctrls)

    // add cover
    // const screenShotCover = this.renderTemplate("screenShotCover", data)
    // console.log(screenShotCover)

    if (this.playerButton) this.playerButton.updateNumAnnotations();
  }

  // User clicked to cancel in-progress add - restore to normal state
  cancelAddNew() {
    if (!(this.uiState.adding || this.uiState.writingComment)) return;
    this.render(true);
    // this.marker.teardown();
    // this.marker = null;
  }

  // User clicked 'add' button in the controls - setup UI and marker
  startAddNew() {
    
    if (!this.plugin.active) this.plugin.toggleAnnotationMode(); // add a "vac-active" in the video-js div

    // this.player.pause();
    this.setAddingUI();
    this.uiState.adding = true;
    this.render();

    // // construct new range and create marker
    // const range = {
    //   start: parseInt(this.currentTime, 10),
    //   stop: parseInt(this.currentTime, 10)
    // };
    // this.marker = new DraggableMarker(this.player, range);
    // this.selectableShape = new SelectableShape(this.player);

    var imgDiv = $(".sac-cover")
    this.selectableShape = new SelectableShape_shape_screenShot(imgDiv);

    // show cursor help text if controls are hidden
    // if (!this.showControls) this.bindCursorTooltip();

    // this.plugin.fire('enteredAddingAnnotation', { range });
  }

  // User clicked 'continue' action - show UI to write comment
  writeComment() {
    // clear the textarea text (which might be filled by templateContent)
    this.templateContent = ""

    this.uiState.writingComment = true;
    this.render();
  }


  // User clicked "template" button/ list
  addTemplate() {
    // alert("hiii")
    this.uiState.showTemplates = true;
    this.render();
  }

  // User clicked "save" after populating a template
  templateSave() {
    // reassign the templateContent to empty string (to due with re-using the template)
    this.templateContent = ""

    // get input array
    const inputs = this.$UI.templateInputs
    
    // get label array
    const labels = this.$UI.templateLabels

    let dat = ''
    for (let i=0; i < labels.length; i++) {

      dat += labels[i].innerHTML + inputs[i].value + '\r\n'
    }

    this.templateContent = dat
    
    // to show 
    this.uiState.showTemplates = false
    this.uiState.writingComment = true
    // this.uiState.addTemplatesToComment = true

    this.render()

  }

  cancelTemplate() {
    if (!(this.uiState.showTemplates && this.uiState.writingComment)) return;
    this.uiState.showTemplates = false;
    this.templateContent = ""
    this.render();
  }

  // User clicked to save a new annotation/comment during add new flow
  saveNew() {
    // const comment = this.$UI.newCommentTextarea.val();
    const comment = $(".screenshot").find('.vac-video-write-new textarea').val()
    if (!comment) return; // empty comment - TODO add validation / err message

    const a = Annotation.newFromData(
      // this.marker.range,
      this.selectableShape.shape,
      comment,
      this.plugin
    );
    this.plugin.annotationState.addNewAnnotation(a);

    // this.cancelAddNew();
    this.clear(false)
  }

  // Change normal UI (hide markers, hide playback, etc) on init add state
  setAddingUI() {
    this.plugin.annotationState.enabled = false;
    this.disablePlayingAndControl();
  }

  // Restore normal UI after add state
  restoreNormalUI() {
    this.plugin.annotationState.enabled = this.plugin.active;


    this.enablePlayingAndControl();
    $(document).off(`mousemove.vac-tooltip-${this.playerId}`);
  }

  // On arrow key press, navigate to next or prev Annotation
  handleArrowKeys(e) {
    if (!this.plugin.active) return;
    const keyId = e.which;

    if (keyId == 37) this.plugin.annotationState.prevAnnotation();
    if (keyId == 39) this.plugin.annotationState.nextAnnotation();
  }

  // Adds help text to cursor during annotation mode
  bindCursorTooltip() {
    this.tooltipArea = Utils.areaOfHiddenEl(
      this.$tooltip,
      this.$UI.coverCanvas,
      this.UI_CLASSES.hidden
    );

    // Assert bounds are updated in plugin in case page was modified since creation, so tooltip math is correct
    this.plugin.setBounds(false);
    $(document).on(
      `mousemove.vac-tooltip-${this.playerId}`,
      Utils.throttle(event => {
        if (!this.plugin.bounds) return;

        const x = event.pageX;
        const y = event.pageY;
        const outOfBounds =
          x < this.plugin.bounds.left ||
          x > this.plugin.bounds.right ||
          y < this.plugin.bounds.top ||
          y > this.plugin.bounds.bottom;
        const withinControls = !outOfBounds && y >= this.plugin.bounds.bottomWithoutControls;
        const markerHovered = this.$tooltip.hasClass('vac-marker-hover');

        if (outOfBounds) {
          this.$tooltip.addClass(this.UI_CLASSES.hidden);
          return;
        }

        const cursorX = x - this.plugin.bounds.left;
        const cursorY = y - this.plugin.bounds.top;
        const margin = 10;
        const rightEdge = this.$player.width();
        const bottomEdge = this.$player.height() - this.$UI.controlBar.height();
        const atRightEdge = cursorX + this.tooltipArea.width + margin * 2 >= rightEdge;
        const atBottomEdge = cursorY + this.tooltipArea.height + margin * 2 >= bottomEdge;

        // is the tooltip too close to the right or bottom edge?
        const posX = atRightEdge ? rightEdge - this.tooltipArea.width - margin : cursorX + margin;
        const posY = atBottomEdge
          ? bottomEdge - this.tooltipArea.height - margin
          : cursorY + margin;

        // hide if the cursor is over the control bar but not hovering over the draggable marker
        // also hide if mouse is down
        if ((withinControls && !markerHovered) || this.$tooltip.hasClass('vac-cursor-dragging')) {
          this.$tooltip.addClass(this.UI_CLASSES.hidden);
        } else {
          this.$tooltip.removeClass(this.UI_CLASSES.hidden);
        }

        this.$tooltip.css({
          left: `${posX}px`,
          top: `${posY}px`
        });
      }, 50)
    );
  }

  get $tooltip() {
    this.$tooltip_ = this.$tooltip_ || this.$player.find('.vac-cursor-tool-tip');
    return this.$tooltip_;
  }
};
