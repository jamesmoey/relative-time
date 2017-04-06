class RelativeTime extends Polymer.Element {
  static get is() { return 'relative-time' }
  static get properties() {
    return {
      /**
       * date, as a string
       */
      time: {
        type: String
      },

      /**
       * formatting of the date
       * can be a string, an array of string, or nothing
       * http://momentjs.com/docs/#/parsing/string-format/
       */
      inputFormat: {
        type: Object,
        value: function() {
          return null
        }
      },

      /**
       * language that this element will interpret/render
       */
      locale: {
        type: String,
        value: "en"
      },

      /**
       * assumed time zone of the input string
       * must match the name or abbreviation of a [moment.tz.Zone](http://momentjs.com/timezone/docs/#/zone-object/)
       * default is the time zone of the user
       */
      inputTimezone: {
        type: String,
        value: function() {
          var timezoneOffset = new Date().getTimezoneOffset();
          return moment.tz.names().map( name => moment.tz.zone(name) ).find( timezone => timezone.offsets.indexOf(timezoneOffset)>-1 ).name;
        }
      },
      /**
       * time zone for the output string
       * must match the name or abbreviation of a [moment.tz.Zone](http://momentjs.com/timezone/docs/#/zone-object/)
       * default is the time zone of the user
       */
      outputTimezone: {
        type: String,
        value: function() {
          var timezoneOffset = new Date().getTimezoneOffset();
          return moment.tz.names().map( name => moment.tz.zone(name) ).find( timezone => timezone.offsets.indexOf(timezoneOffset)>-1 ).name;
        }
      },

      /**
       * time object as parsed by moment
       */
      _parsedTime: {
        type: Object,
        computed: "_parseTime(time, inputFormat, locale, inputTimezone, outputTimezone)"
      },

      /**
       * formatting of the output string
       * valid formats:
       * 'fromNow': 12 minutes ago
       * 'fromNowBrief': 12 minutes
       * 'toNow': in 12 minutes
       * 'calendar': today at 12 am
       * a custom string, representing a format: http://momentjs.com/docs/#/displaying/format/
       */
      outputFormat: {
        type: String,
        value: "fromNow"
      },

      /**
       * value used to make the element recalculate relative times
       */
      __renewer: {
        type: Number,
        value: 0
      },

      /**
       * computed output string
       */
      renderedTime: {
        type: String,
        computed: "_getRelativeTime(_parsedTime, outputFormat, __renewer)"
      },

      /**
       * a more expanded version of renderedTime
       * used to render the title
       * example:
       * 12 minutes ago (today at 14:04)
       */
      title: {
        type: String,
        computed: "_getRelativeTitle(_parsedTime, __renewer)",
        reflectToAttribute: true
      }
    };
  }
  static get observers() {
    return [
      "_manageTimer(_parsedTime, outputFormat)"
    ];
  }
  constructor() {
    super();
  }
  connectedCallback() {
    super.connectedCallback();
  }

  _manageTimer(_parsedTime, outputFormat) {
    if (!_parsedTime || !outputFormat) { return }
    clearTimeout(this.__timer);

    if (this._parsedTime) {
      this.__renewer = ++this.__renewer % 10;

      var t0 = moment();
      var newTimeout = 1000;
      if (t0.diff(this._parsedTime, 'days') > 0) {         // more than a day passed
        newTimeout = 1000 * 60 * 60;                       // update every hour
      }
      else if (t0.diff(this._parsedTime, 'hours') > 0) {   // more than an hour passed
        newTimeout = 1000 * 60 * 10;                       // update every 10 minutes
      }
      else if (t0.diff(this._parsedTime, 'minutes') > 0) { // more than a minute passed
        newTimeout = 1000 * 10;                            // update every 10 seconds
      }

      this.__timer = setTimeout( this._manageTimer.bind(this), newTimeout);
    }
  }

  _parseTime(time, inputFormat, locale, inputTimezone, outputTimezone) {
    if (!time || !locale || !inputTimezone || !outputTimezone) { return }
    var m = moment.tz(time, inputFormat, locale, inputTimezone);
    if (m.isValid()) {
      return m.tz(outputTimezone);
    } else {
      console.warn(this, `time input ${time} did not parse correctly`)
      return null;
    }
  }

  _getRelativeTime(_parsedTime, outputFormat, __renewer) {
    if (!_parsedTime || !outputFormat || !__renewer) {
      return "unknown";
    }
    if (outputFormat == "fromNow") {
      return _parsedTime.fromNow();
    }
    else if (outputFormat == "fromNowBrief") {
      return _parsedTime.fromNow(true);
    }
    else if (outputFormat == "toNow") {
      return _parsedTime.toNow();
    }
    else if (outputFormat == "calendar") {
      return _parsedTime.calendar();
    }
    else {
      return _parsedTime.format(outputFormat);
    }
  }

  _getRelativeTitle(_parsedTime, __renewer) {
    if (!_parsedTime || !__renewer) { return }
    return _parsedTime.calendar(null, { sameElse: 'MMM Do YYYY' }) + '\n' + _parsedTime.format();
  }
}
customElements.define(RelativeTime.is, RelativeTime);
