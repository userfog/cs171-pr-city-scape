var SocrataModel = function(_baseUrl, _resource, _apiKey, _eventHandler, _responseType){
  // Data for Requesting Resources from the server
  this.baseUrl = _baseUrl;
  this.resource = _resource;
  this.apiKey = _apiKey;
  this.responseType = _responseType || "json";
  this.fullUrl = "{0}/resource/{1}.{2}?".format(this.baseUrl, this.resource, this.responseType);
  // Local variable
  this.eventHandler = _eventHandler;
  this.prev_year = 2015
  this.grouping = "getMonth"
  this.data = [];
  this.barNoFilter;
  this.timeNoFilter;
  this.sunNoFilter;
  this.mapNoFilter;
}

SocrataModel.prototype.get = function (str, callback, offset, limit, clear){
    var that = this;
    if(clear)
      that.data = [];
    var request = str + "&$offset={0}&$limit={1}".format(offset, 1000);
    $.getJSON(this.fullUrl
        + request 
        + "&$$app_token=" + this.apiKey,
      function(data, status) {
        that.data.push.apply(that.data, data);
        state.length = state.length + data.length  || data.length
        if(data.length < limit || true){
          safe_callback(callback, that);
        } else{
          that.get(str, callback, offset+limit, limit, false);
        }
      }
    ).fail(function() {
      console.log("Something went wrong!");
    });
}


SocrataModel.prototype.filterTime = function(){
  if(state.time_filters == undefined
    || state.time_filters.length == 0 
    || state.time_filters[0] == undefined
    || state.time_filters[1] == undefined
    || calendarCompare(state.time_filters[0], state.time_filters[1])) 
    return [-1,-1];

  var filters = state.time_filters[0].getTime() < state.time_filters[1].getTime() ? [state.time_filters[0], state.time_filters[1]] : [state.time_filters[1], state.time_filters[0]];

  var compare_function = function(el, b){
    var tmp = moment(b.date).utcOffset("-6:00");
    if(moment(el).calendar() == tmp.calendar())
      return 0
    return moment(el).toDate().getTime() - tmp.toDate().getTime()
  }

  var start_index = binarySearch(this.data, filters[0], compare_function);
  var end_index = binarySearch(this.data, filters[1], compare_function);
  return [start_index, end_index];
}


SocrataModel.prototype.timeOnlyFilter  = function (){
  var indexes = this.filterTime();
  if(indexes[0] == -1 || indexes[1] == -1)
    return this.data;
  return this.data.slice(indexes[0], indexes[1])
}

SocrataModel.prototype.categoryFilter = function(data){
    if(typeof state.crime_filters == "undefined")
      return data

    switch(state.crime_filters.length){
      case 0:{
        return data;
      }
      case 1:{
        return data.filter(function(d){
            return d[state.crime_filters[0].key] == state.crime_filters[0].value;
          });
        break;
      }
      case 2:{
        return data.filter(function(d){
            return (d[state.crime_filters[0].key] == state.crime_filters[0].value) 
            && (d[state.crime_filters[1].key] == state.crime_filters[1].value);
        })
        break;
      }
      case 3:{
        return data.filter(function(d){
          return (d[state.crime_filters[0].key] == state.crime_filters[0].value) 
          && (d[state.crime_filters[1].key] == state.crime_filters[1].value)
          && (d[state.crime_filters[2].key] == state.crime_filters[2].value);
        });
        break;
      }
  }
}


SocrataModel.prototype.getDisplayData = function(){
  var t0 = new Date().getTime();
  var indexes = this.filterTime();

  if(indexes[0] == -1 && indexes[1] == -1){
    this.displayData = this.data;
    if(state.time_filters.length > 0 && !calendarCompare(state.time_filters[0], state.time_filters[1])){
        console.log("Times not found");
    }
  } else if(indexes[0] == -1 && indexes[1] != -1){
    this.displayData = this.data.slice(0, indexes[1])
  } else if(indexes[0] != -1 && indexes[1] == -1){
    this.displayData = this.data.slice(indexes[0], this.data.length-1)
  } else{
    this.displayData = this.data.slice(indexes[0], indexes[1]);
  }

  this.displayData = this.categoryFilter(this.displayData);

  var t1 = new Date().getTime();
  console.log("getDisplayData: " + (t1-t0));
}

SocrataModel.prototype.wrangleRequest = function (that){
  that.getDisplayData();
  var sunArgs = that.sunburstWrangle();
  that.sunNoFilter = $.extend(true, {},sunArgs);
  var mapArgs = that.mapWrangle("#FFCC44");
  that.mapNoFilter = $.extend(true, {}, mapArgs);
  NProgress.inc()
  var timeArgs = that.timeWrangle(that, "getDay");
  that.timeNoFilter = $.extend(true, [], timeArgs);
  var barData = that.barChartWrangler(that);
  that.barNoFilter = $.extend(true, [],barData);
  NProgress.inc()
  $(that.eventHandler).trigger("barChartDataReady", [barData]);
  NProgress.inc()  
  $(that.eventHandler).trigger("overtimeReady", [])
  NProgress.inc()
  $(that.eventHandler).trigger("sunburstDataReady", [sunArgs]);
  NProgress.inc()
  $(that.eventHandler).trigger("mapVisDataReady", [mapArgs]);
  NProgress.inc()
  $(that.eventHandler).trigger("timeDataReady", [timeArgs]);
  $(that.eventHandler).trigger("loadingDone");
  that.prev_year = state.year;
  state.changed = false;
  
}

SocrataModel.prototype.wrangleSelectSunburst = function (that, color, resolution){
  NProgress.start()
  that.getDisplayData();
  var mapArgs = that.mapWrangle(color);
  NProgress.inc()
  var timeArgs = that.timeWrangle(that, resolution);
  var barData = that.barChartWrangler(that);
  NProgress.inc()
  $(that.eventHandler).trigger("mapVisDataReady", [mapArgs]);
  NProgress.inc()
  $(that.eventHandler).trigger("timeUpdate", [timeArgs]);
  NProgress.inc()
  $(that.eventHandler).trigger("barChartDataReady", [barData]);
  NProgress.inc()
  $(that.eventHandler).trigger("loadingDone");
  state.changed = false;
}

SocrataModel.prototype.wrangleTimeChange = function(that){
  NProgress.start()
  that.getDisplayData();
  var sunArgs = that.sunburstWrangle();
  NProgress.inc()
  var mapArgs = that.mapWrangle();
  var barData = that.barChartWrangler(that);
  NProgress.inc()
  $(that.eventHandler).trigger("sunburstDataReady", [sunArgs]);
  NProgress.inc()
  $(that.eventHandler).trigger("mapVisDataReady", [mapArgs]);
  NProgress.inc()
  $(that.eventHandler).trigger("barChartDataReady", [barData]);
  NProgress.inc()
  $(that.eventHandler).trigger("loadingDone");
  state.changed = false;
}

SocrataModel.prototype.sunburstWrangle = function(){
  if(this.sunNoFilter 
    && (!state.time_filters || state.time_filters.length==0 || calendarCompare(state.time_filters[0], state.time_filters[1]))
    && this.prev_year == state.year)
    return this.sunNoFilter;

  var t0 = new Date().getTime();
  var that = this;
  var sunburstDisp = that.timeOnlyFilter(that.data);

  var nested = d3.nest()
    .key(function(d){return d.primary_type;})
    .key(function(d){return d.description;})
    .key(function(d){return d.location_description;})
    .rollup(function(leaves){
      return {"size": leaves.length}
    }).entries(sunburstDisp);

  nested = {"key": "Total", "values": nested};
  var t1 = new Date().getTime();
  console.log("sunburstWrangle: " + (t1-t0));
  return nested;
  
}

SocrataModel.prototype.mapWrangle = function(color){
  if(this.mapNoFilter 
    && (!state.crime_filters || state.crime_filters.length==0)
    && (!state.time_filters || state.time_filters.length==0)
    && this.prev_year == state.year)
    return this.mapNoFilter;

  var t0 = new Date().getTime();
  var that = this;
  var mapping = d3.map();
  that.displayData.forEach(function(d){
    var val = mapping.get(parseInt(d.community_area)) || 0;
    mapping.set(parseInt(d.community_area), val+1)})
  var t1 = new Date().getTime();
  console.log("mapWrangle: " + (t1-t0));
  return [mapping, color]
  
}

SocrataModel.prototype.barChartWrangler = function(that, community_area, resolution){
  if(this.barNoFilter 
    && (!state.crime_filters || state.crime_filters.length==0)
    && (!state.time_filters || state.time_filters.length==0)
    && this.prev_year == state.year)
    return this.barNoFilter;

  var nested = d3.nest()
        .key(function(d){
            return moment(d.date).utcOffset("-6:00").month();})
        .key(function(d){
            return d.community_area;})
        .rollup(function(leaves){
          if(leaves)
            return {"arrest_ratio" : d3.sum(leaves, function(d){return (d.arrest) ? 1 : 0}) / leaves.length};
          else
            return {"arrest_ratio": -1};
        })
        .entries(that.displayData);
  return nested;
}

SocrataModel.prototype.timeWrangle = function(that, resolution){
  if(this.timeNoFilter 
    && (!state.crime_filters || state.crime_filters.length==0)
    && this.prev_year == state.year)
    return this.timeNoFilter

  var timeDisplayData = that.categoryFilter(that.data);
  var t0 = new Date().getTime();
  var yr = state.year;
  var zeroed_data;

  if(resolution == "getDay"){
    if(yr == 2004 || yr == 2008 || yr == 2012 || yr == 2016){
      zeroed_data = new Array(367);
    } else {
      zeroed_data = new Array(366);
    }
  } else if (resolution == "getMonth"){
    zeroed_data = new Array(12);
  } else{
    zeroed_data = new Array(1);
  }

  for(var i = 0; i < zeroed_data.length; i++){
      zeroed_data[i] = {"date": moment({"year": state.year}).utcOffset("-6:00").add(i, "d").toDate(), "count": 0};
  }

  for(var i = 0; i < timeDisplayData.length; i++){
    var info = moment(timeDisplayData[i].date).utcOffset("-6:00");
    var index = (resolution == "getDay") ? info.dayOfYear() : info.month();
    zeroed_data[index].count++;
  }

  var t1 = new Date().getTime();
  console.log("timeWrangle: " + (t1-t0));
  return zeroed_data;  
}
