var SocrataModel = function(_baseUrl, _resource, _apiKey, _eventHandler, _responseType){
  // Data for Requesting Resources from the server
  this.baseUrl = _baseUrl;
  this.resource = _resource;
  this.apiKey = _apiKey;
  this.responseType = _responseType || "json";
  this.fullUrl = "{0}/resource/{1}.{2}?".format(this.baseUrl, this.resource, this.responseType);
  // Local variable
  this.eventHandler = _eventHandler;
  this.years = [2004];
  this.grouping = "getMonth"
  this.data = [];
  this.displayData = null;
}


SocrataModel.prototype.get = function (str, callback, offset, limit, clear){
    var that = this;
    if(clear)
      that.data = [];

    var request = str + "&$offset={0}&$limit={1}".format(offset, limit);
    $.getJSON(this.fullUrl
        + request 
        + "&$$app_token=" + this.apiKey,
      function(data, status) {
        that.data.push.apply(that.data, data);
        state.length = state.length + data.length  || data.length
        if(data.length < limit){
          safe_callback(callback, that);
        } else{
          that.get(str, callback, offset+limit, limit, false);
        }
      }
    ).fail(function() {
      console.log("Something went wrong!");
    });
}


SocrataModel.prototype.getMain = function (str, callback, offset, limit, clear){
    var that = this;
    if(clear)
      that.data = [];

    if(state.year < 2015){
      queue().defer(d3.json, "data/socrata_{0}.json".format(state.year))
        .await(ready);
      function ready(error, data){
        that.data = data;
        safe_callback(callback, that);
      }
    } else {
      this.get(str, callback, offset, limit, clear);
    }
}

SocrataModel.prototype.filterQuery = function(){
  if(typeof state.crime_filters == "undefined" || state.crime_filters.length == 0)
    return this.data;

  var filtered = this.data;
  state.crime_filters.map(function(d,i){
    filtered = filtered.filter(function(e,j){
      return e[d.key] == d.value;
    })
  });
  return filtered;
}

SocrataModel.prototype.filterTime = function(){
  if(state.time_filters == undefined
    || state.time_filters.length == 0 
    || state.time_filters[0] == undefined
    || state.time_filters[1] == undefined
    || state.time_filters[0].getTime() == state.time_filters[1].getTime()) 
    return [-1,-1];

  var filters = state.time_filters[0].getTime() < state.time_filters[1].getTime() ? [state.time_filters[0], state.time_filters[1]] : [state.time_filters[1], state.time_filters[0]];

  var compare_function = function(el, b){
    var target = new Date(el.getFullYear(), el.getMonth(), el.getDate());
    var tmp = d3.time.format.utc("%Y-%m-%dT%H:%M:%S").parse(b.date);
    var day = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate());
    return target.getTime() - day.getTime()
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


SocrataModel.prototype.getDisplayData = function(){
  var t0 = new Date().getTime();
  var indexes = this.filterTime();

  if(indexes[0] == -1 || indexes[1] == -1){
    this.displayData = this.data;
    if(state.time_filters.length > 0){
        console.log("Times not found");
    }
  }else{
    this.displayData = this.data.slice(indexes[0], indexes[1]);
  }

  switch(state.crime_filters.length){
    case 0:{
      break;
    }
    case 1:{
      this.displayData = this.displayData.filter(function(d){
          return d[state.crime_filters[0].key] == state.crime_filters[0].value;
        });
      break;
    }
    case 2:{
      this.displayData = this.displayData.filter(function(d){
          return (d[state.crime_filters[0].key] == state.crime_filters[0].value) 
          && (d[state.crime_filters[1].key] == state.crime_filters[1].value);
      })
      break;
    }
    case 3:{
      this.displayData = this.displayData.filter(function(d){
        return (d[state.crime_filters[0].key] == state.crime_filters[0].value) 
        && (d[state.crime_filters[1].key] == state.crime_filters[1].value)
        && (d[state.crime_filters[2].key] == state.crime_filters[2].value);
      });
      break;
    }
  }
  var t1 = new Date().getTime();
  console.log("getDisplayData: " + (t1-t0));
}

SocrataModel.prototype.wrangleBarChartRequest = function (that){
  var barData = that.barChartWrangler(that);
  $(that.eventHandler).trigger("barChartDataReady", [barData]);
  $(that.eventHandler).trigger("loadingDone");
  state.changed = false;
}

SocrataModel.prototype.wrangleRequest = function (that){
  that.getDisplayData();
  var sunArgs = that.sunburstWrangle();
  var mapArgs = that.mapWrangle("#FFCC44");
  var timeArgs = that.timeWrangle(that, "getDay");
  $(that.eventHandler).trigger("overtimeReady", [])
  $(that.eventHandler).trigger("sunburstDataReady", [sunArgs]);
  $(that.eventHandler).trigger("mapVisDataReady", [mapArgs]);
  $(that.eventHandler).trigger("timeDataReady", [timeArgs]);
  NProgress.inc()
  $(that.eventHandler).trigger("barChartInit", ["Total"])
  state.changed = false;
  
}

SocrataModel.prototype.wrangleSelectSunburst = function (that, color, resolution){
  that.getDisplayData();
  var mapArgs = that.mapWrangle(color);
  var timeArgs = that.timeWrangle(that, resolution);
  $(that.eventHandler).trigger("mapVisDataReady", [mapArgs]);
  $(that.eventHandler).trigger("timeUpdate", [timeArgs]);
  NProgress.inc()
  // $(that.eventHandler).trigger("communityAreaChanged", ["Total"])
  $(that.eventHandler).trigger("barChartInit", ["Total"])
  state.changed = false;
}

SocrataModel.prototype.wrangleTimeChange = function(that){

  that.getDisplayData();
  var sunArgs = that.sunburstWrangle();
  var mapArgs = that.mapWrangle();
  $(that.eventHandler).trigger("sunburstDataReady", [sunArgs]);
  $(that.eventHandler).trigger("mapVisDataReady", [mapArgs]);
  NProgress.inc()
  $(that.eventHandler).trigger("communityAreaChanged", ["Total"])
  NProgress.done()
  state.changed = false;
}

SocrataModel.prototype.sunburstWrangle = function(){
  var t0 = new Date().getTime();
  var that = this;
  var sunburstDisp = that.timeOnlyFilter(that.data);

  var nested = d3.nest()
    .key(function(d){return d.primary_type;})
    .key(function(d){return d.description;})
    .key(function(d){return d.location_description;})
    .rollup(function(leaves){
      return {"size": d3.sum(leaves, function(d){ return +d.count_primary_type; })}
    }).entries(sunburstDisp);

  nested = {"key": "Total", "values": nested};
  var t1 = new Date().getTime();
  console.log("sunburstWrangle: " + (t1-t0));
  return nested;
  
}

SocrataModel.prototype.mapWrangle = function(color){
  var t0 = new Date().getTime();
  var that = this;
  var mapping = d3.map();
  that.displayData.forEach(function(d){
    var val = mapping.get(+d.community_area) || 0;
    mapping.set(+d.community_area, val+parseInt(d.count_primary_type))})
  var t1 = new Date().getTime();
  console.log("mapWrangle: " + (t1-t0));
  return [mapping, color]
  
}

SocrataModel.prototype.barChartWrangler = function(that, community_area, resolution){
  var nested = d3.nest()
        .key(function(d){
            return moment(d.date).month();})
        .key(function(d){
            return d.community_area;})
        .rollup(function(leaves){
          if(leaves)
            return {"arrest_ratio" : d3.sum(leaves, function(d){return (d.arrest) ? 1 : 0}) / leaves.length};
          else
            return {"arrest_ratio": -1};
        })
        .entries(that.data);
  return nested;
}

SocrataModel.prototype.timeWrangle = function(that, resolution){
  var timeDisplayData = that.filterQuery(that.data);
  var t0 = new Date().getTime();
  var yr = state.year;
  var zeroed_data;
  if(resolution == "getDay"){
    if(yr == 2004 || yr == 2008 || yr == 2012 || yr == 2016){
      zeroed_data = new Array(367);chrom
    } else {
      zeroed_data = new Array(366);
    }
  } else if (resolution == "getMonth"){
    zeroed_data = new Array(12);
  } else{
    zeroed_data = new Array(1);
  }

  function dateFromDay(year, day){
     var date = new Date(year, 0);
     return new Date(date.setDate(day));
   }

  for(var i = 0; i < zeroed_data.length; i++){
      zeroed_data[i] = {"date": dateFromDay(yr, i), "count": 0};
  }

  for(var i = 0; i < timeDisplayData.length; i++){
    var info = moment(timeDisplayData[i].date);
    var index = (resolution == "getDay") ? info.dayOfYear() : info.month();
    zeroed_data[index].count += parseInt(timeDisplayData[i].count_primary_type);
  }

  var t1 = new Date().getTime();
  console.log("timeWrangle: " + (t1-t0));

  return zeroed_data;  
}

SocrataModel.prototype.timeFilter = function (data, pass){

    // unpack passed object
    start = pass["start"];
    end = pass["end"];

    // generate custom filter from extent
    var time_filter = function(d){
        return (d.time <= end && d.time >= start)
    }

    this.wrangleData(time_filter);

    this.updateVis();
}
