/**
 * This file is part of Keskispas, a Web service to display geolocalized content
 *
 * Copyright (C) 2011  Clochix.net
 *
 * Keskispas is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * Keskispas is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 */
if (!window.console) var console = {};
console.log = console.log || function(){};
console.warn = console.warn || function(){};
console.error = console.error || function(){};
console.info = console.info || function(){};

var map;
var tl;  // The Timeline
(function keskispas(opt) {
  // some "global" variables
  var instance = this;
  instance.options = opt;
  //var tl;  // The Timeline
  var events = [];
  //var map; // The Map
  var vector;
  function redrawEvents(e) {
    var min = e[0].getStart();
    var max = e[0].getStart();
    e.forEach(function(i){if (i.getStart()<min) min = i.getStart();if (i.getStart()>max) max = i.getStart();});
    var interval = Math.round((max-min)/1000)+1;
    if (tl) tl.dispose();
    var bandInfo = {
      width:          "100%", 
      showEventText: false,
      eventSource: eventSource
    };
    if (interval < 3600) {
      bandInfo.intervalUnit = Timeline.DateTime.MINUTE;
      bandInfo.intervalPixels = 550 * 60 / interval;
    } else if (interval < 86400) {
      bandInfo.intervalUnit = Timeline.DateTime.HOUR;
      bandInfo.intervalPixels = 550 * 3600 / interval;
    } else {
      bandInfo.intervalUnit = Timeline.DateTime.DAY;
      bandInfo.intervalPixels = 550 * 86400 / interval;
    }
    if (bandInfo.intervalPixels < 20) bandInfo.intervalPixels = 20;
    tl = Timeline.create(document.getElementById("timeline"), [Timeline.createBandInfo(bandInfo)], Timeline.VERTICAL);
    var source = tl.getBand(0).getEventSource();
    source.clear();
    source.addMany(e);
    // Fix "vertical" bug
    jQuery(".timeline-event-icon").each(function(){
      e = jQuery(this);
      var pos = e.position();
      e.css({top: pos.left + 'px', left: pos.top + 'px'});
    });
  }
  function getLonLat(lon, lat) {
    return new OpenLayers.LonLat(lon,lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
  }
  this.getRadius = function getRadius() {
    var e = map.getExtent();
    return Math.floor(OpenLayers.Util.distVincenty(new OpenLayers.LonLat(e.left, e.top), new OpenLayers.LonLat(e.right, e.top)) / 2);
  };
  function markerAdd(lon, lat, content, name, icon) {
    var lonlat = getLonLat(lon, lat);
    var popupClose = function(evt) {
      if (popup !== null) {
        feature.destroyPopup();
      }
      jQuery('.' + name).removeClass('active');
      Event.stop(evt);
    };
    var featureDatas = {popupContentHTML: content, lonlat: lonlat, popupSize: new OpenLayers.Size(200, 200), closeBox: true, closeBoxCallback: popupClose};
    if (icon) featureDatas.icon = new OpenLayers.Icon(icon, new OpenLayers.Size(32, 32));
    var feature = new OpenLayers.Feature(map.baseLayer, lonlat, featureDatas);
    var marker = feature.createMarker();
    marker.icon.imageDiv.firstChild.classList.add(name);
    marker.events.register("mouseover", marker, function (evt) {
      popup = feature.createPopup(true); // Create an AnchoredBubble
      //popup.autoSize = true;
      popup.panMapIfOutOfView = true;
      markers.map.addPopup(popup);
      itemActive(name);
    });
    //marker.events.register("mouseout", marker, popupClose);
    markers.addMarker(marker);
  }
  this.getJsonP = function getJsonP(opt) {
      jQuery.ajax({
        url: opt.url,
        data: opt.data,
        dataType: 'jsonp',
        crossDomain: true,
        beforeSend: function(){jQuery('#message').slideToggle('slow');},
        dataFilter: function(){jQuery('#message').slideToggle('slow');},
        success: opt.success
    }); 
  };
  function error(msg) {
    if (!msg) msg = "Error";
    jQuery('#error').html(msg).show().fadeOut(10000);
  }
  function getRandId(prefix) {
    if (!prefix) prefix = 'itemK';
    return prefix + Math.floor(Math.random()*10000000000000);
  }
  //
  // Source {{
  //
  //------------------------------
  // Get photos in the current map
  //------------------------------
  function getFlickr() {
    var r = getRadius();
    var lonlat = map.getCenter().transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
    var licenses = {
      '0': '<a>All Rights Reserved</a>',
      '1': '<a href="http://creativecommons.org/licenses/by-nc-sa/2.0/" target="_blank">Attribution-NonCommercial-ShareAlike License</a>',
      '2': '<a href="http://creativecommons.org/licenses/by-nc/2.0/" target="_blank">Attribution-NonCommercial License</a>',
      '3': '<a href="http://creativecommons.org/licenses/by-nc-nd/2.0/" target="_blank">Attribution-NonCommercial-NoDerivs License</a>',
      '4': '<a href="http://creativecommons.org/licenses/by/2.0/" target="_blank">Attribution License</a>',
      '5': '<a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">Attribution-ShareAlike License</a>',
      '6': '<a href="http://creativecommons.org/licenses/by-nd/2.0/" target="_blank">Attribution-NoDerivs License</a>',
      '7': '<a href="http://www.flickr.com/commons/usage/" target="_blank">No known copyright restrictions</a>',
      '8': '<a href="http://www.usa.gov/copyright.shtml" target="_blank">United States Government Work</a>'
    };
    var url = 'https://secure.flickr.com/services/rest/?jsoncallback=?';
    var data = {
        api_key: instance.options.flickr,
        method: 'flickr.photos.search',
        format: 'json',
        has_geo: 1,
        lat: lonlat.lat,
        lon: lonlat.lon,
        radius: (r > 32 ? 32 : r),
        radius_unit: 'km',
        per_page: 40,
        sort: 'date-taken-desc',
        extras: 'description, license, date_upload, date_taken, owner_name, geo, tags, path_alias',
        max_taken_date: Math.floor(Date.now() / 1000)
      };
    var tags = jQuery('#query').val();
    if (tags) data.tags = tags;
    else data.min_taken_date = Math.round(Date.now()/1000) - 15552000; // 6 months
    var when = jQuery("#when").val();
    if (when) {
      data.min_taken_date = Math.round(Date.now()/1000) - when; // 6 months
    }
    getJsonP({
      url: url, 
      data: data,
      success: function(res){
        console.log(res);
        if (typeof(res) != "object") {
          error();
          return false;
        }
        // Delete previous markers
        markers.markers.forEach(function(m){markers.removeMarker(m);});
        var list = jQuery('#res');
        list.empty();
        events = [];
        if (res.photos.photo.length === 0) list.append('<li>No Content</li>');
        else {
          res.photos.photo.forEach(function(e) {
            var itemName = getRandId();
            var photoUrl = 'http://farm'+e.farm+'.static.flickr.com/'+e.server+'/'+e.id+'_'+e.secret+'_s.jpg';
            var userUrl  = 'http://www.flickr.com/photos/'+e.pathalias+'/';
            var text     = e.title;
            var content = '<div class="flickrItem '+itemName+'">'
                        + '<a href="'+userUrl+e.id+'" target="_blank"><img src="'+photoUrl+'" title="'+e.title+'" /></a>'
                        + '<p class="title translatable">'+e.title+'</p>'
                        + '<p class="author">by <a href="'+userUrl+'" target="_blank">'+e.ownername+'</a></p>'
                        + '<p><a class="description translatable">'+e.description._content+'</a></p>'
                        + '<p class="datetaken">'+e.datetaken+'</p>'
                        + '<p class="licence">'+licenses[e.license]+'</p>'
                        + '<p class="tags">'+e.tags+'</p>'
                        + '<p class="geo">'+e.longitude+' '+e.latitude+'</p>'
                        + '</div>'
            ;
            markerAdd(e.longitude, e.latitude, content, itemName);
            var evt = new Timeline.DefaultEventSource.Event( {
              start : new Date(e.datetaken.replace(/ /, 'T')),
              instant : true,
              text : e.title,
              classname: itemName,
              description: content
            });
            events.push(evt);
            list.append('<li>'+content+'</li>');
          });
        }
        redrawEvents(events);
      }
    });
  }
  //------------------------------
  // Get music events in the current map
  //------------------------------
  function getLastFM() {
    var lonlat = map.getCenter().transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));

    var url = 'http://ws.audioscrobbler.com/2.0/';
    getJsonP({
      url: url,
      data: {
        format: 'json',
        method: 'geo.getevents',
        api_key: instance.options.lastFM,
        lat: lonlat.lat,
        long: lonlat.lon,
        distance: getRadius(),
        limit: 50
      },
      crossDomain: true,
      success: function(res){
        console.log(res);
        if (typeof(res) != "object") {
          error();
          return false;
        }
        // Delete previous markers
        markers.markers.forEach(function(m){markers.removeMarker(m);});
        var list = jQuery('#res');
        list.empty();
        events = [];
        if (res && res.events.event.length === 0) list.append('<li>No Content</li>');
        else { 
          res.events.event.forEach(function(e) {
            var itemName = getRandId();
            var content = '<div class="fm-event ' + itemName + '">'
                        + '<div class="title"><a href="'+e.url+'" target="_blank">'+e.title+'</a></div>'
                        + '<div class="image"><img src="'+e.image[0]['#text']+'" /></div>'
                        + '<div class="artist">'+e.artists.headliner+'</div>'
                        + '<div class="date">'+e.startDate+'</div>'
                        + '<div class="venue">'+e.venue.name+'</div>'
                        + '</div>'
            ;
            markerAdd(e.venue.location['geo:point']['geo:long'], e.venue.location['geo:point']['geo:lat'], content, itemName);
            var evt = new Timeline.DefaultEventSource.Event( {
              start : new Date(Date.parse(e.startDate)),
              instant : true,
              text : e.user_from,
              caption : e.user_from,
              classname: itemName,
              description: content
            });
            events.push(evt);
            list.append('<li>'+content+'</li>');
          });
        }
        redrawEvents(events);
      }
    });
  }
  //------------------------------
  // Get tweets in the current map
  //------------------------------
  function getTwitter() {
    var lonlat = map.getCenter().transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));

    var url = 'https://search.twitter.com/search.json';
    var data = {
      geocode: lonlat.lat + ',' + lonlat.lon + ','+ getRadius() + 'km',
      rpp: 50
    };
    var tags = jQuery('#query').val();
    if (tags) data.q = tags;
    var when = jQuery("#when").val();
    if (when) {
      var startDate = new Date(Date.now() - when * 1000);
      data.since = startDate.toJSON().substring(0, 10);
    }
    getJsonP({
      url: url,
      data: data,
      success: function(res){
        console.log(res);
        if (typeof(res) != "object") {
          error();
          return false;
        }
        // Delete previous markers
        markers.markers.forEach(function(m){markers.removeMarker(m);});
        var list = jQuery('#res');
        list.empty();
        events = [];
        if (res && res.results.length === 0) list.append('<li>No Content</li>');
        else {
          res.results.forEach(function(e) {
            var text = e.text;
            text = text.replace(/(https?:\/\/\S+)/ig,"<a href='$1' target='_blank'>$1</a>"); 
            text = text.replace(/(@(\S+))/ig,"<a href='http://twitter.com/$2' target='_blank'>$1</a>"); 
            var itemName = getRandId();
            var content = '<div class="tweet ' + itemName + '">'
                        + '<span class="from_user"><a href="http://twitter.com/' + e.from_user + '" target="__blank">' + e.from_user + ' : </a></span>'
                        + '<span class="text translatable">' + text + '</span>'
                        + '<p class="created_at"><a href="http://twitter.com/' + e.from_user + '/status/' + e.id_str + '" target="__blank">( ' + e.created_at + ' )</a></p>'
                        + '</div>'
            ;
            if (e.geo) {
              markerAdd(e.geo.coordinates[1], e.geo.coordinates[0], content, itemName, 'twitter_newbird_blue.png');
            }
            var evt = new Timeline.DefaultEventSource.Event( {
              start : new Date(Date.parse(e.created_at)),
              instant : true,
              text : e.user_from,
              caption : e.user_from,
              classname: itemName,
              description: content
            });
            events.push(evt);
            list.append('<li>'+content+'</li>');
          });
        }
        redrawEvents(events);
      }
    });
  }
  //------------------------------
  // Get buzz in the current map
  //------------------------------
  function getBuzz() {
    var lonlat   = map.getCenter().transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
    var distance = getRadius() * 1000;
    var url  = 'https://www.googleapis.com/buzz/v1/activities/search';
    var data = {
      key: instance.options.buzz,
      alt: 'json',
      lat: lonlat.lat,
      lon: lonlat.lon,
      radius: distance,
      'max-results': 20 // Very few buzz are geolocated
    };
    var tags = jQuery('#query').val();
    if (tags) data.q = tags;
    var when = jQuery("#when").val();
    if (when) {
      var startDate = new Date(Date.now() - when * 1000);
      data.q = 'date:>' + startDate.toJSON();
    }
    getJsonP({
      url: url,
      data: data,
      success: function(res){
        console.log(res);
        if (typeof(res) != "object") {
          error();
          return false;
        }
        // Delete previous markers
        markers.markers.forEach(function(m){markers.removeMarker(m);});
        var list = jQuery('#res');
        list.empty();
        events = [];
        if (res && res.data && res.data.items) {
          res.data.items.forEach(function(e) {
            var itemName = getRandId();
            var content = '<div class="buzz ' + itemName +'">'
                        + '<div class="title translatable">'+e.title+"</div>"
                        + '<div class="author"><a href="'+e.actor.profileUrl+'" target="_blank">'+e.actor.name+'</a></div>'
                        + '<div>'+e.geocode+'</div>'
                        + '</div>'
                        ;
            var geo = e.geocode.split(' ');
            markerAdd(geo[1], geo[0], content, itemName);
            var evt = new Timeline.DefaultEventSource.Event( {
              start : new Date(e.published),
              instant : true,
              text : e.user_from,
              caption : e.user_from,
              classname: itemName,
              description: content
            });
            events.push(evt);
            list.append('<li>'+content+'</li>');
          });
        } else {
          list.append('<li>No Content</li>'); 
        }
        redrawEvents(events);
      }
    });
  }
  //------------------------------
  // Get videos from YouTube
  //------------------------------
  function getYoutube() {
    // http://code.google.com/apis/youtube/2.0/developers_guide_protocol_api_query_parameters.html
    var lonlat   = map.getCenter().transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
    var url  = 'http://gdata.youtube.com/feeds/api/videos';
    var data = {
      alt: 'json',
      location: lonlat.lat + ',' + lonlat.lon,
      'location-radius': getRadius() + 'km',
      orderby: 'published'
    };
    var tags = jQuery('#query').val();
    if (tags) data.q = tags;
    getJsonP({
      url: url,
      data: data,
      success: function(res){
        console.log(res);
        if (typeof(res) != "object") {
          error();
          return false;
        }
        // Delete previous markers
        markers.markers.forEach(function(m){markers.removeMarker(m);});
        var list = jQuery('#res');
        list.empty();
        events = [];
        if (res && res.feed && res.feed.entry) {
          res.feed.entry.forEach(function(e) {
            var itemName = getRandId();
            var content = '<div class="Youtube ' + itemName +'">'
                        + '<div class="title translatable ">'+e.title['$t']+"</div>"
                        + '<div class="video"><a href="'+e['media$group']['media$player'][0]['url']+'" target="_blank"><img src="'+e['media$group']['media$thumbnail'][0]['url']+'" width="120" height="90" /></a></div>'
                        + '<div class="content translatable">'+e.content['$t']+"</div>"
                        + '<div class="author"><a href="'+e.author[0].uri['$t']+'" target="_blank">'+e.author[0].name['$t']+'</a></div>'
                        + '<div class="date">'+e.updated['$t']+"</div>"
                        + '</div>'
                        ;
            if (e['georss$where']) {
              var geo = e['georss$where']['gml$Point']['gml$pos']['$t'].split(' ');
              markerAdd(geo[1], geo[0], content, itemName, 'youtube_32x32.png');
            }
            var evt = new Timeline.DefaultEventSource.Event( {
              start : new Date(e.updated['$t']),
              instant : true,
              text : e.title['$t'],
              caption : e.title['$t'],
              classname: itemName,
              description: content
            });
            events.push(evt);
            list.append('<li>'+content+'</li>');
          });
        } else {
          list.append('<li>No Content</li>'); 
        }
        redrawEvents(events);
      }
    });
  }

  //
  // }}
  //
  //------------------------------
  // Create Map
  //------------------------------
  var projection = new OpenLayers.Projection("EPSG:4326");
  map = new OpenLayers.Map("mapdiv", { units: 'km', displayProjection: projection});

  // Add Layers
  var layers = [];
  var layerOption = {
    isBaseLayer: true,
    displayInLayerSwitcher: true,
    visibility: false,
    projection: projection,
    sphericalMercator: true
  };

  // OSM
  var osm = new OpenLayers.Layer.OSM('OpenStreetMap', '', layerOption);
  osm.projection = "EPSG:900913";
  //layers.push(osm);
  // Google
  layers.push(new OpenLayers.Layer.Google("Google Hybrid",{type: G_HYBRID_MAP, numZoomLevels: 20}));
  layers.push(new OpenLayers.Layer.Google("Google Streets",{type: G_NORMAL_MAP, numZoomLevels: 20}));
  layers.push(new OpenLayers.Layer.Google("Google Satellite",{type: G_SATELLITE_MAP, numZoomLevels: 20}));
  map.addLayers(layers);

  vector = new OpenLayers.Layer.Vector("Vector");
  map.addLayer(vector);

  // Add controls
  map.addControl(new OpenLayers.Control.ArgParser());
  map.addControl(new OpenLayers.Control.KeyboardDefaults());
  map.addControl(new OpenLayers.Control.LayerSwitcher());
  map.addControl(new OpenLayers.Control.MouseDefaults());
  map.addControl(new OpenLayers.Control.MousePosition());
  map.addControl(new OpenLayers.Control.NavigationHistory());
  map.addControl(new OpenLayers.Control.PanZoomBar());
  map.addControl(new OpenLayers.Control.Permalink());
  map.addControl(new OpenLayers.Control.ZoomBox());
  map.addControl(new OpenLayers.Control.ScaleLine({geodesic: true}));

  // Click handler
  OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
    defaultHandlerOptions: { 'single': true, 'double': false, 'pixelTolerance': 0, 'stopSingle': false, 'stopDouble': false },
    initialize: function(options) {
      this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
      OpenLayers.Control.prototype.initialize.apply(this, arguments); 
      this.handler = new OpenLayers.Handler.Click(
        this, {
          'click': this.trigger
        }, this.handlerOptions
      );
    }, 
    trigger: function(e) {
      var lonlat = map.getLonLatFromViewPortPx(e.xy).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
      map.setCenter(lonlat);
      //var point = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
      //var circle = OpenLayers.Geometry.Polygon.createRegularPolygon(point, getRadius() * 1000, 50);
      //vector.addFeatures(new OpenLayers.Feature.Vector(circle));
    }
  });
  var click = new OpenLayers.Control.Click();
  map.addControl(click);
  click.activate();

  // Update URL on move
  map.events.register("move", map, function (evt) {
    var lonlat = map.getCenter().transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
    var params = '?lon='+encodeURIComponent(lonlat.lon)+'&lat='+encodeURIComponent(lonlat.lat)+'&zoom='+encodeURIComponent(+map.getZoom());
    if (history.replaceState) {
      history.replaceState({}, '', params);
    } else {
      location.hash = '!' + params;
    }
  });
  // add marker
  var markers = new OpenLayers.Layer.Markers( "Markers" );
  map.addLayer(markers);
  var popup = null;
  var list = jQuery('#res');
  var lon, lat, zoom;
  var parsed = {};
  // Try to get location of the browser
  if (window.location.search !== '') {
    var re = /[?|&]?([^=]+)=([^&]*)/g;
    do {
        var res = re.exec(window.location.search);
        if (res) parsed[res[1]] = res[2];
    } while (re.lastIndex > 0);
    if (parsed['lon'] && parsed['lat']) {
      // nothing to do, the ArgParser control take the control
      lon = parsed['lon'];
      lat = parsed['lat'];
    }
  } 
  if (!lon || !lat) {
    // Is-it a modern browser ?
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        map.setCenter(getLonLat(lon, lat), 12);
        //getTwitter();
      });
    } else {
      // Paris is the center of the world ;)
      map.setCenter(getLonLat(2.35099, 48.85667), 12);
    }
  }
  if (parsed['q']) {
    jQuery('#query').val(parsed['q']);
  }
  if (parsed['action']) {
    switch (parsed.action) {
      case 'flickr':
        getFlickr();
        break;
      case 'twitter':
        getTwitter();
        break;
      case 'youtube':
        getYoutube();
        break;
    }
  }
  //------------------------------
  // Translate
  //------------------------------
  jQuery(".translatable").live('click', function() {
    var e = jQuery(this);
    getJsonP({
      url: 'https://www.googleapis.com/language/translate/v2',
      data: { 
        q : e.text(),
        target: 'fr',
        key: instance.options.translateKey
      },
      success: function(response) {
        var translated = response.data.translations[0].translatedText;
        translated = translated.replace(/&#39;/, "'");
        translated = translated.replace(/(https?:\/\/\S+)/ig,"<a href='$1' target='_blank'>$1</a>"); 
        translated = translated.replace(/(@(\S+))/ig,"<a href='http://twitter.com/$2' traget='_blank'>$1</a>"); 
        e.removeClass('translatable').html(translated);
      }
    });
  });
  //------------------------------
  // Create Timeline
  //------------------------------
  var eventSource = new Timeline.DefaultEventSource();
  var bandInfos = [
      Timeline.createBandInfo({
        width:          "33%", 
        intervalUnit:   Timeline.DateTime.MINUTE, 
        intervalPixels: 50,
        showEventText: false,
        eventSource: eventSource
      }),
      Timeline.createBandInfo({
        width:          "33%", 
        intervalUnit:   Timeline.DateTime.HOUR,
        showEventText: false,
        intervalPixels: 50,
        eventSource: eventSource
      }),
      Timeline.createBandInfo({
        width:          "33%", 
        intervalUnit:   Timeline.DateTime.DAY,
        showEventText: false,
        intervalPixels: 50,
        eventSource: eventSource,
        zoomIndex: 3,
        zoomSteps: [
          {pixelsPerInterval: 400, unit: Timeline.DateTime.Day},
          {pixelsPerInterval: 200, unit: Timeline.DateTime.Day},
          {pixelsPerInterval: 100, unit: Timeline.DateTime.Day},
          {pixelsPerInterval: 50, unit: Timeline.DateTime.Day},
          {pixelsPerInterval: 25, unit: Timeline.DateTime.Day},
          {pixelsPerInterval: 12, unit: Timeline.DateTime.Day}
        ]
      })
      ];
  bandInfos[1].syncWith = 0;
  bandInfos[2].syncWith = 1;
  bandInfos[2].highlight = true;
  //tl = Timeline.create(document.getElementById("timeline"), bandInfos, Timeline.VERTICAL);
  //tl.autoWidth = true;
  //tl.getBand(2)._theme.mouseWheel = 'zoom';
  //------------------------------
  // Where
  //------------------------------
  function getPlaces() {
    getJsonP({
      url: 'http://api.geonames.org/searchJSON',
      data: {
        maxRows: 20,
        name: jQuery('#where').val(),
        username: instance.options.geonames
      },
      success:function(response) {
        if (response.totalResultsCount > 0) {
          var places = jQuery("#places");
          places.empty();
          response.geonames.forEach(function(e){
            places.append(jQuery('<li><a class="place" property="georss:point" content="'+e.lat+' '+e.lng+'">' + e.name + ' ( ' + e.adminName1 + ' ) </a></li>'));
          });
          places.slideDown();
        }
      }
    });
    return false;
  }
  jQuery('#where').change(getPlaces);
  jQuery('#where-button').click(getPlaces);
  jQuery("#places .place").live('click', function() {
    jQuery('#places').slideUp();
    var t = jQuery(this).attr('content').split(' ');
    map.setCenter(new OpenLayers.LonLat(t[1], t[0]).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()), 12);
    //getTwitter();
    return false;
  });

  var itemOnhover = function itemOnhover(event) {
    var e = jQuery(this);
    var name = e.attr('class').split(' ').filter(function(e){return e.substring(0,5) == 'itemK';})[0];
    if (name) {
      if (event.data.action == 'active') {
        itemActive(name);
      } else {
        jQuery('.' + name).removeClass('active');
      }
    }
  };
  var itemActive = function itemActive(name) {
    jQuery('.' + name).addClass('active');
    var res = jQuery('#res');
    var item = jQuery('#res .' + name);
    if (item && item.position()) {
      res.scrollTop(res.scrollTop() + item.position().top - item.height() -20);
    }
  };
  jQuery("*[class*='itemK']").live('mouseenter', {action: 'active'}, itemOnhover);
  jQuery("*[class*='itemK']").live('mouseleave', {action: 'remove'}, itemOnhover);


  //------------------------------
  // Update buttons
  //------------------------------
  jQuery('#flickr-button').click(getFlickr);
  jQuery('#lastfm-button').click(getLastFM);
  jQuery('#twitter-button').click(getTwitter);
  jQuery('#buzz-button').click(getBuzz);
  jQuery('#youtube-button').click(getYoutube);
  jQuery('#help-button').click(function(event){event.preventDefault();jQuery('.help-toggle').toggle('slow');});
})(options);

