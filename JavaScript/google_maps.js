/*
  Google Maps Integration and Directions library
  Written by: Josh MacLachlan
  Requires jQuery
*/

function _bl(override)
{
  if (window === this)
  {
    return new _bl(override);
  }

  this.opts = $.extend({
    appId : '',
    apiKey : '',
    enterpriseAccount : false,
    enterpriseUser : '',
    enterpriseChannel : '',
    permissionTimeout : 1
  }, override);

  this.flags = {
    apiLoaded : false,
    loadComplete : false,
    sensor : navigator.geolocation ? true : false
  };

  this.callbackStorage;

  return this;
}

_bl.prototype = {
  /*
    string manageCookies
    Description:
      Allows for reading and writing cookies, whose names will have the appId property
      prepended to them in order to ensure they are separated from any other app using
      this library
    Parameters:
      string mode : read/write flag, pass 'r' for reading a cookie's value, or 'w' for writing
      string name : the name of the cookie to read or write
      string|number value : value of the cookie to be set
      int expiration : the number of days until the cookie should expire
    Returns via callback:
      false
    Returns:
      On successful read or write, returns the cookie value
      On error, returns the string 'ERROR: [error explanation]'
  */
  manageCookies : function(mode, name, value, expiration)
  {
    blInstance = this;
    if (mode == 'r')
    {
      var nameEq = blInstance.opts.appId + "_" + name + '=';
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++)
      {
        var c = ca[i];
        while (c.charAt(0) == ' ')
        {
          c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEq) == 0)
        {
          return c.substring(nameEq.length, c.length);
        }
      }
      return 'ERROR: Requested cookie not found';
    }
    else if (mode == 'w')
    {
      var expires = '';
      if (expiration)
      {
        var date = new Date();
        date.setTime(date.getTime() + (expiration * 24 * 60 * 60 * 1000));
        var expires = '; expires=' + date.toGMTString();
      }
      else
      {
        return 'ERROR: Expiration value must be set';
      }
      document.cookie = blInstance.opts.appId + "_" + name + "=" + value + expires + "; path=/";
      return value;
    }
  },

  /*
    object locateUser
    Description:
      If currently allowed (per cookies containing the permissionTimeout option value), attempts
      to resolve the user's location into latitude/longitude coordinates
    Parameters:
      function success: callback function on successful geolocation
      function failure: callback function on failure to locate the user
    Returns via callback:
      true
    Returns:
      On success, hands the success function a google.maps.LatLng object containing the user's coordinates
      On failue, hands the failure function an error object
  */
  locateUser : function(success, failure)
  {
    blInstance = this;
    var permissionCookie = blInstance.manageCookies('r', 'geolocation_requested');
    switch(permissionCookie)
    {
      case 'success':
        if (blInstance.flags.apiLoaded) {
          var coordinates = blInstance.LatLng(blInstance.manageCookies('r', 'user_latitude'), blInstance.manageCookies('r', 'user_longitude'));
        } else {
          var coordinates = {latitude: blInstance.manageCookies('r', 'user_latitude'), longitude: blInstance.manageCookies('r', 'user_longitude')}
        }
        if (success != undefined && typeof(success) == 'function')
        {
          success(coordinates);
        }
        break;
      case 'failure':
        break;
      default:
        if (blInstance.flags.sensor)
        {
          navigator.geolocation.getCurrentPosition(
          function(position)
          {
            if (blInstance.flags.apiLoaded) {
              var coordinates = blInstance.LatLng(position.coords.latitude, position.coords.longitude);
            } else {
              var coordinates = {latitude: position.coords.latitude, longitude: position.coords.longitude}
            }
            blInstance.manageCookies('w', 'geolocation_requested', 'success', blInstance.opts.permissionTimeout);
            blInstance.manageCookies('w', 'user_latitude', position.coords.latitude, blInstance.opts.permissionTimeout);
            blInstance.manageCookies('w', 'user_longitude', position.coords.longitude, blInstance.opts.permissionTimeout);
            if (success != undefined && typeof(success) == 'function')
            {
              success(coordinates);
            }
          },
          function(error)
          {
            blInstance.manageCookies('w', 'geolocation_requested', 'failure', blInstance.opts.permissionTimeout);
            if (failure != undefined && typeof(failure) == 'function')
            {
              failure(error);
            }
          },
          {'enableHighAccuracy':true, 'timeout':20000, 'maximumAge':0}
          );
        }
    }
  },

  /*
    void loadMapsAPI
    Description:
      Asynchronously loads the Google Maps API, then calls onMapsLoad(), which must be defined
      in your application in global scope
    Parameters:
      none
    Returns via callback:
      false
    Returns:
      none
  */
  loadMapsAPI : function(callback)
  {
    blInstance = this;
    if (!blInstance.flags.apiLoaded)
    {
      var script = document.createElement("script");
      script.type = "text/javascript";
      if (blInstance.opts.enterpriseAccount)
      {
        script.src = "http://maps.googleapis.com/maps/api/js?client=" + blInstance.opts.enterpriseUser + "&channel=" + blInstance.opts.enterpriseChannel + "&sensor=" + blInstance.flags.sensor + "&callback=onMapsLoad";
      }
      else
      {
        script.src = "http://maps.googleapis.com/maps/api/js?key=" + blInstance.opts.apiKey + "&sensor=" + blInstance.flags.sensor + "&callback=onMapsLoad";
      }
      document.body.appendChild(script);
      blInstance.flags.apiLoaded = true;
    }
    if (callback != undefined && typeof(callback) == 'function')
    {
      if (blInstance.flags.loadComplete) {
        callback();
      } else {
        blInstance.callbackStorage = callback;
      }
    }
  },

  /*
    object LatLng
    Description:
      Creates a google.maps.LatLng object for a given set of coordinates
    Parameters:
      string|number lat: string, int, or float representing latitude
      string|number lng: string, int, or float representing longitude
    Returns via callback:
      false
    Returns:
      google.maps.LatLng
  */
  LatLng : function(lat, lng)
  {
    return new google.maps.LatLng(lat, lng);
  },

  /*
    object InfoWindow
    Description:
      Creates a google.maps.InfoWindow with an optional options object
    Parameters:
      object opts: associative array of options for an InfoWindow. Optional
    Returns via callback:
      false
    Returns:
      google.maps.InfoWindow
  */
  InfoWindow : function(opts)
  {
    return new google.maps.InfoWindow(opts);
  },

  /*
    object Geocoder
    Description:
      Creates a google.maps.Geocoder for use in converting addresses to lat/lng and vice versa
    Parameters:
      none
    Returns via callback:
      false
    Returns:
      google.maps.Geocoder
  */
  Geocoder : function()
  {
    return new google.maps.Geocoder();
  },

  /*
    object DirectionsService
    Description:
      Creates a google.maps.DirectionsService for use in getting directions
    Parameters:
      none
    Returns via callback:
      false
    Returns:
      google.maps.DirectionsService
  */
  DirectionsService : function()
  {
    return new google.maps.DirectionsService();
  },

  /*
    object DirectionsRenderer
    Description:
      Creates a google.maps.DirectionsRenderer for a given map and panel on which to display them
    Parameters:
      google.maps.Map map: the map on which to show directions. Optional
      node panel: the JS node on which to display directions text. Optional
    Returns via callback:
      false
    Returns:
      google.maps.DirectionsRenderer
  */
  DirectionsRenderer : function(map, panel)
  {
    rendererOptions = {
      map : map,
      panel : panel
    };
    return new google.maps.DirectionsRenderer(rendererOptions);
  },

  /*
    void Map
    Description:
      Creates a google.maps.Map object and displays it in the requested div node
    Parameters:
      string div: id attribute of the div you want to build a map in
      object opts: options to apply to the map, such as center and zoom
      function callback: function to execute after the map is initialized
    Returns via callback:
      true
    Returns:
      the initialized google.maps.Map as a parameter to callback
  */
  Map : function(div, opts, callback)
  {
    blInstance = this;
    var mapOptions = {
      center : blInstance.LatLng(0,0),
      zoom : 5
    };
    mapOptions = $.extend(mapOptions, opts);
    map = new google.maps.Map(document.getElementById(div), mapOptions);
    if (callback != undefined && typeof(callback) == 'function')
    {
      callback(map);
    }
  },

  /*
    void setMapCenter
    Description:
      Updates the center of a given google.maps.Map object
    Parameters:
      google.maps.Map map: the map object to be updated
      google.maps.LatLng newCenter: the coordinates to set the map center to
      function callback: function to be executed once the center is updated
    Returns via callback:
      true
    Returns:
      the updated map as a parameter to callback
  */
  setMapCenter : function(map, newCenter, callback)
  {
    map.setCenter(newCenter);
    if (callback != undefined && typeof(callback) == 'function')
    {
      callback(map);
    }
  },

  /*
    object Marker
    Description:
      Creates a new google.maps.Marker object, and optionally attaches a google.maps.InfoWindow
    Parameters:
      object opts: associative array of options for the marker object. Needs to include map and position
      boolean attachInfo: whether or not to attach an InfoWindow that opens when the marker is clicked
      string data: HTML to display in the InfoWindow
    Returns via callback:
      false
    Returns:
      the created google.maps.Marker
  */
  Marker : function(opts, attachInfo, data)
  {
    blInstance = this;
    marker = new google.maps.Marker(opts);
    if (attachInfo)
    {
      blInstance.attachInfoWindow(marker, data);
    }
    return marker;
  },

  /*
    void hideMarker
    Description:
      Hides a currently displayed google.maps.Marker
    Parameters:
      google.maps.Marker marker: the marker to hide
    Returns via callback:
      false
    Returns:
      none
  */
  hideMarker : function(marker)
  {
    marker.setVisible(false);
  },

  /*
    void showMarker
    Description:
      Shows a currently hidden google.maps.Marker
    Parameters:
      google.maps.Marker marker: the marker to show
    Returns via callback:
      false
    Returns:
      none
  */
  showMarker : function(marker)
  {
    marker.setVisible(true);
  },

  /*
    null destroyMarker
    Description:
      Completely destroys a google.maps.Marker object
    Parameters:
      google.maps.Marker marker: the marker to be destroyed
    Returns via callback:
      false
    Returns:
      null
  */
  destroyMarker : function(marker)
  {
    marker.setMap(null);
    return null;
  },

  /*
    array setMultipleMarkers
    Description:
      Turns an array of objects into multiple markers on a map
    Parameters:
      [object] markers: An array of objects of format {opts : {map : foo, position : bar}, attachInfo : true, data : "foobar"}
    Returns via callback:
      false
    Returns:
      array of created markers
  */
  setMultipleMarkers : function(markers)
  {
    blInstance = this;
    setMarkers = [];
    if (markers.length)
    {
      for (var i = 0; i < markers.length; i++)
      {
        marker = markers[i];
        setMarkers.push(blInstance.Marker(marker.opts, marker.attachInfo, marker.data));
      }
    }
    return setMarkers;
  },

  /*
    void hideMultipleMarkers
    Description:
      Hides an array of google.maps.Marker objects
    Parameters:
      [google.maps.Marker] markers: array of markers to hide
    Returns via callback:
      false
    Returns:
      none
  */
  hideMultipleMarkers : function(markers)
  {
    blInstance = this;
    if (markers.length)
    {
      for (var i = 0; i < markers.length; i++)
      {
        marker = markers[i];
        blInstance.hideMarker(marker);
      }
    }
  },

  /*
    void showMultipleMarkers
    Description:
      Shows an array of google.maps.Marker objects
    Parameters:
      [google.maps.Marker] markers: array of markers to show
    Returns via callback:
      false
    Returns:
      none
  */
  showMultipleMarkers : function(markers)
  {
    blInstance = this;
    if (markers.length)
    {
      for (var i = 0; i < markers.length; i++)
      {
        marker = markers[i];
        blInstance.showMarker(marker);
      }
    }
  },

  /*
    array destroyMultipleMarkers
    Description:
      Wipes an array of google.maps.Marker objects from memory
    Parameters:
      [google.maps.Marker] array of markers to destroy
    Returns via callback:
      false
    Returns:
      an empty array
  */
  destroyMultipleMarkers : function(markers)
  {
    if (markers.length)
    {
      for (var i = 0; i < markers.length; i++)
      {
        marker = markers[i];
        marker.setMap(null);
      }
    }
    return [];
  },

  /*
    void attachInfoWindow
    Description:
      Adds an object element to a google.maps.Marker object that holds a google.maps.InfoWindow object,
      which is opened when the marker is clicked. This function is generally only called from the
      function Marker()
    Parameters:
      google.maps.Marker marker: the marker to attach an InfoWindow to
      string data: the HTML string to place in the InfoWindow
    Returns via callback:
      false
    Returns:
      none
  */
  attachInfoWindow : function(marker, data)
  {
    blInstance = this;
    marker['infoWindow'] = blInstance.InfoWindow({content : data});
    google.maps.event.addListener(marker, 'click', function(){
      marker.infoWindow.open(marker.getMap(), marker);
    });
  },

  /*
    void geocodeAddress
    Description:
      Takes a string holding an address and attempts to resolve it to latitude/longitude. If
      successful, also hands back an object containing level by level location data specific
      to the term searched
    Parameters:
      google.maps.Geocoder geocoder: the geocoder object which handles the request. If one is
        not defined, you may pass this.Geocoder()
      string address: the raw address to be geocoded
      function callback: code to be executed
    Returns via callback:
      true
    Returns:
      none
  */
  geocodeAddress : function(geocoder, address, callback)
  {
    blInstance = this;
    geocoderRequest = {address : address}
    geocoder.geocode(geocoderRequest, function(result, status){
      if (status == google.maps.GeocoderStatus.OK)
      {
        resultLatLng = blInstance.LatLng(result[0].geometry.location.lat(), result[0].geometry.location.lng());
        if (callback != undefined && typeof(callback) == 'function')
        {
          callback(result, resultLatLng);
        }
      }
      else
      {
        if (callback != undefined && typeof(callback) == 'function')
        {
          callback(status);
        }
      }
    });
  },

  /*
    void defineLatLng
    Description:
      The reverse (sort of) of geocodeAddress(), takes a LatLng object and finds the closest
      address and location data, as loosely defined as need be. If successful, also hands back
      an object containing level by level location data specific to the coordinates searched
    Parameters:
      google.maps.Geocoder geocoder: the geocoder object which handles the request. If one is
        not defined, you may pass this.Geocoder()
      google.maps.LatLng coordinates: the lat/lng coordinates to be identified
      function callback: code to be executed
    Returns via callback:
      true
    Returns:
      none
  */
  defineLatLng : function(geocoder, coordinates, callback)
  {
    geocoderRequest = {location : coordinates};
    geocoder.geocode(geocoderRequest, function(result, status){
      if (status == google.maps.GeocoderStatus.OK)
      {
        if (callback != undefined && typeof(callback) == 'function')
        {
          callback(result);
        }
      }
      else
      {
        if (callback != undefined && typeof(callback) == 'function')
        {
          callback(status);
        }
      }
    });
  },

  /*
    void getDirections
    Description:
      Finds directions between two addresses or sets of coordinates to be displayed on a map and/or
      in text form
    Parameters:
      google.maps.DirectionsRenderer renderer: the directions rendering service object you will use
        to display the directions
      multi origin: the origin point of the directions, can be a string to be geocoded or a
        google.maps.LatLng object
      multi destination: the destination point of the directions, can be a string to be geocoded or a
        google.maps.LatLng object
      hash opts: additional options hash to merge with the default set of DirectionsRequest options
      array markersToHide: an array of google.maps.Marker objects that should be hidden while directions
        are displayed
      function callback: function to be executed after directions are displayed
    Returns via callback:
      true
    Returns:
      none
  */
  getDirections : function(renderer, origin, destination, opts, markersToHide, callback)
  {
    blInstance = this;
    directionsRequest = {
      origin : origin,
      destination : destination,
      travelMode : google.maps.TravelMode.DRIVING
    };
    directionsRequest = $.extend(directionsRequest, opts);
    blInstance.DirectionsService().route(directionsRequest, function(response, status){
      if (status == google.maps.DirectionsStatus.OK)
      {
        if (markersToHide.length)
        {
          blInstance.hideMultipleMarkers(markersToHide);
        }
        renderer.setDirections(response);
        if (callback != undefined && typeof(callback) == 'function')
        {
          callback(renderer);
        }
      }
      else
      {
        if (callback != undefined && typeof(callback) == 'function')
        {
          callback(status);
        }
      }
    });
  },

  /*
    void clearDirections
    Description:
      Clears directions displayed on a map and/or panel and returns any hidden map markers
    Parameters:
      google.maps.DirectionsRenderer renderer: the DirectionsRenderer whose directions you
        wish to clear
      [google.maps.Marker] markersToShow: a set of map markers to show once directions are cleared
      function callback: function to execute after clearing directions
    Returns via callback:
      true
    Returns:
      none
  */
  clearDirections : function(renderer, markersToShow, callback)
  {
    blInstance = this;
    renderer.setDirections({routes : []});
    if (markersToShow.length)
    {
      blInstance.showMultipleMarkers(markersToShow);
    }
    if (callback != undefined && typeof(callback) == 'function')
    {
      callback(renderer);
    }
  },

  /*
    string getStreetViewImageTag
    Description:
      Retrieves an HTML image tag that displays a Google Maps Street View image of a given size and field of view
    Parameters:
      google.maps.LatLng location: lat/lng coordinates of the the picture's position
      integer heading: compass heading in degrees of the image from its location
      integer fov: the image's field of view in degrees
      integer width: the image's width in pixels
      integer height: the image's height in pixels
    Returns via callback:
      true
    Returns:
      none
  */
  getStreetViewImageTag : function(location, heading, fov, width, height)
  {
    return '<img src="http://maps.googleapis.com/maps/api/streetview?location=' +
    location.lat() + ',' + location.lng() + '&heading=' + heading + '&fov=' + fov +
    '&size=' + width + 'x' + height + '&sensor=true" />';
  }
}
