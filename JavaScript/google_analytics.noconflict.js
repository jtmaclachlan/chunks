/*
  Google Universal Analytics Integration Library
  Written by: Josh MacLachlan
  Requires jQuery
*/

/*
  BEGIN Internal Functions
  Used by analytics functions for building
  the event envelope
*/
function buildDimensionsObject(dimensions) {
  dimensionsHash = {};
  jQuery.each(dimensions, function(key, value) {
    jQuery.each(ugaDimensions, function(key2, value2) {
      if (key == value2) {
        dimensionsHash['dimension' + key2] = value;
      }
    });
  });
  return dimensionsHash;
}

function checkParameter(parameterValue, defaultValue) {
  if ([undefined, null].indexOf(parameterValue) == -1) {
    return parameterValue;
  } else {
    return defaultValue;
  }
}
/*
  END Internal Functions
*/

/*
  BEGIN Analytics Functions
*/
function analyticsPageLoad() {
  if (analyticsId != '') {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    ga('create', analyticsId, 'auto');
    ga('require', 'displayfeatures');
    ga('send', 'pageview');
  }
}

function analyticsRecordEvent(category, action, label, value, nonInteraction, dimensions, callback) {
  var envelope = {
    'hitType'        : 'event',
    'eventCategory'  : category,
    'eventAction'    : action,
    'eventLabel'     : checkParameter(label, undefined),
    'eventValue'     : checkParameter(value, undefined),
    'nonInteraction' : checkParameter(nonInteraction, undefined)
  };
  if (dimensions != undefined && dimensions != {}) {
    var parsedDimensions = buildDimensionsObject(dimensions);
    jQuery.each(parsedDimensions, function(key, value) {
      envelope[key] = value;
    });
  }
  if (callback != undefined && typeof(callback) == 'function') {
    envelope['hitCallback'] = callback;
  }
  ga('send', envelope);
}

function analyticsRecordSocial(network, action, target, nonInteraction, dimensions, callback) {
  var envelope = {
    'hitType'        : 'social',
    'socialNetwork'  : network,
    'socialAction'   : action,
    'socialTarget'   : target,
    'nonInteraction' : checkParameter(nonInteraction, undefined)
  };
  if (dimensions != undefined && dimensions != {}) {
    var parsedDimensions = buildDimensionsObject(dimensions);
    jQuery.each(parsedDimensions, function(key, value) {
      envelope[key] = value;
    });
  }
  if (callback != undefined && typeof(callback) == 'function') {
    envelope['hitCallback'] = callback;
  }
  ga('send', envelope);
}

function analyticsRecordTiming(category, varName, value, label, dimensions, callback) {
  var envelope = {
    'hitType'        : 'timing',
    'timingCategory' : checkParameter(category, undefined),
    'timingVar'      : checkParameter(varName, undefined),
    'timingValue'    : checkParameter(value, undefined),
    'timingLabel'    : checkParameter(label, undefined)
  };
  if (callback != undefined && typeof(callback) == 'function') {
    envelope['hitCallback'] = callback;
  }
  ga('send', envelope);
}

function analyticsRecordException(description, fatal) {
  var envelope = {
    'hitType'       : 'exception',
    'exDescription' : description,
    'exFatal'       : checkParameter(fatal, false)
  };
  ga('send', envelope);
}
/*
  END Analytics Functions
*/

// Load the analytics package if there is an app ID stored in the config file
analyticsPageLoad();
