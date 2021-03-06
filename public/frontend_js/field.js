goog.provide('concerto.frontend.Field');

goog.require('concerto.frontend.Content.ClientTime');
goog.require('concerto.frontend.Content.RandomText');
goog.require('concerto.frontend.Transition.Fade');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.style');



/**
 * A Position's Field.
 * Responsible for rendering the content in a position.
 *
 * @param {!concerto.frontend.Position} position The position that owns this.
 * @param {number} id The field ID number.
 * @param {Object=} opt_transition A transition to use between content.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
concerto.frontend.Field = function(position, id, opt_transition) {
  goog.events.EventTarget.call(this);

  /**
   * Position showing this field.
   * @type {!concerto.frontend.Position}
   */
  this.position = position;

  /**
   * Field ID.
   * @type {number}
   */
  this.id = id;

  /**
   * Previous content that was shown.
   * @type {?Object}
   * @private
   */
  this.prev_content_ = null;

  /**
   * Current piece of content being shown.
   * @type {?Object}
   * @private
   */
  this.current_content_ = null;

  /**
   * Next piece of content to show.
   * @type {?Object}
   * @private
   */
  this.next_content_ = null;

  /**
   * Should this field automatically move to the next piece of
   * content when the duration of the current content expires.
   * @type {boolean}
   * @private
   */
  this.auto_advance_ = true;

  /**
   * Transition to use between content items.
   * @type {!Object}
   * @private
   */
  this.transition_ = opt_transition || concerto.frontend.Transition.Fade;

  this.createDiv();
  this.nextContent();
};
goog.inherits(concerto.frontend.Field, goog.events.EventTarget);


/**
 * The logger for this class.
 * @type {goog.debug.Logger}
 * @private
 */
concerto.frontend.Field.prototype.logger_ = goog.debug.Logger.getLogger(
    'concerto.frontend.Field');


/**
 * Create a div for the field.
 */
concerto.frontend.Field.prototype.createDiv = function() {
  if (!goog.isDefAndNotNull(this.div_)) {
    var properties = {'id': 'field_' + this.id, 'class': 'field'};
    var div = goog.dom.createDom('div', properties);
    goog.style.setSize(div, '100%', '100%');
    this.position.inject(div);
    this.div_ = div;
  }
};


/**
 * Inset a div into the field.
 *
 * @param {Element} div The thing to insert into the field.
 */
concerto.frontend.Field.prototype.inject = function(div) {
  goog.dom.appendChild(this.div_, div);
};


/**
 * Get and setup the next content for a field.
 * Create a new piece of content, associate it with the required events
 * and then start loading it.  Listen for the FINISH_LOAD event to
 * inidicate we should show this content and the DISPLAY_END event to
 * load a new piece of content.
 */
concerto.frontend.Field.prototype.loadContent = function() {
  this.logger_.info('Field ' + this.id + ' is looking for new content.');
  var random_duration = Math.floor(Math.random() * 11);
  var data = { duration: random_duration };

  var contents = [
    concerto.frontend.Content.SampleImage,
    concerto.frontend.Content.RandomText,
    concerto.frontend.Content.ClientTime
  ];

  this.next_content_ = new contents[Math.floor(Math.random() * 3)](data);

  // When the content is loaded, we show it in the field,
  goog.events.listen(this.next_content_,
      concerto.frontend.Content.EventType.FINISH_LOAD,
      this.showContent, false, this);

  // When the content has been shown for too long try to load a new one.
  goog.events.listen(this.next_content_,
      concerto.frontend.Content.EventType.DISPLAY_END,
      this.autoAdvance, false, this);
};


/**
 * Start showing the new piece of content in a field.
 * Triggered when the content has finished loading,
 * we render the content, trigger the transition, and update
 * the current field state.
 */
concerto.frontend.Field.prototype.showContent = function() {
  this.logger_.info('Field ' + this.id + ' is showing new content.');
  // Render the HTML for the div into content.div
  this.next_content_.render();

  var transition = new this.transition_(
      this, this.current_content_, this.next_content_);
  transition.go();

  this.prev_content = this.current_content_;
  this.current_content_ = this.next_content_;
  this.next_content_ = null;
};


/**
 * Advance content.
 */
concerto.frontend.Field.prototype.nextContent = function() {
  this.logger_.info('Field ' + this.id +
      ' would like a new piece of content.');
  // If a piece of content is already in the queue, use that.
  if (!goog.isDefAndNotNull(this.next_content_)) {
    this.loadContent();
  }
  this.next_content_.startLoad();
};


/**
 * Autoadvance content.
 */
concerto.frontend.Field.prototype.autoAdvance = function() {
  if (this.auto_advance_) {
    this.logger_.info('Field ' + this.id + ' is auto-advancing.');
    this.nextContent();
  } else {
    this.logger_.info('Field ' + this.id + ' is not advancing.');
  }
};
