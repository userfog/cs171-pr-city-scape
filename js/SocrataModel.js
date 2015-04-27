

var SocrataModel = function(_baseUrl, _resource, _apiKey, _eventHandler, _responseType){
  this.baseUrl = _baseUrl;
  this.resource = _resource;
  this.apiKey = _apiKey;
  this.responseType = _responseType || "json";
  this.fullUrl = "{0}/resource/{1}.{2}?".format(this.baseUrl, this.resource, this.responseType);
  this.eventHandler = _eventHandler;
  this.previousRequests = [];
  this.filters = [];
  this.years = [2004];
  this.community_area = 77;
  this.grouping = "getMonth"
  this.data = null;
}

SocrataModel.prototype.get = function (str, callback){
    var that = this;
    this.previousRequests.push(str);
    $.getJSON(this.fullUrl
        + str 
        + "&$$app_token=" + this.apiKey,
      function(data, status) {
        that.data = data;
        if(callback){
          callback(that);
        }else{
          console.log(data);
        }
      }
    ).fail(function() {
      console.log("Something went wrong!");
    });
}


SocrataModel.prototype.wrangleRequest = function (that){
  that.sunburstWrangle([]);
  that.mapWrangle([]);
  that.timeWrangle(that, false, "getDay");
}


SocrataModel.prototype.sunburstWrangle = function(filter_by){

  var that = this;
  var sunData = that.filterTime(that.filterQuery());

  function convert_nested (o) {
    if (typeof o.values == "number"){
      return {"name": o.key,"size":o.values}
    } else if (typeof o.values == "object") {
      return {"name": o.key, "children": o.values.map(function(d, i){
        return convert_nested(d);
      })}
    }
  }

  var nested = d3.nest()
    .key(function(d){return d.primary_type;})
    .key(function(d){return d.description;})
    .key(function(d){return d.location_description;})
    .rollup(function(leaves){
      return d3.sum(leaves, function(d){ return +d.count_primary_type; })
    }).entries(sunData);

  nested = convert_nested({"key": "sun_data", "values": nested});

  $(that.eventHandler).trigger("sunburstDataReady", [nested]);
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
  if(typeof state.time_filters == "undefined" 
    || state.time_filters.length == 0 
    || state.time_filters[0].getTime() == state.time_filters[1].getTime()) 
    return this.data;

  filters = state.time_filters[0].getTime() < state.time_filters[1].getTime() ? [state.time_filters[0], state.time_filters[1]] : [state.time_filters[1], state.time_filters[0]];
  debugger;
  return this.data.filter(function(d){
    return d3.time.format.utc("%Y-%m-%dT%H:%M:%S").parse(d.date).getTime() > filters[0].getTime() && d3.time.format.utc("%Y-%m-%dT%H:%M:%S").parse(d.date).getTime() < filters[1].getTime();
  });
}

SocrataModel.prototype.mapWrangle = function(){
  var that = this;
  var mapData = that.filterTime(that.filterQuery());
  var mapping = d3.map();
  mapData.forEach(function(d){
    var val = mapping.get(+d.community_area) || 0;
    mapping.set(+d.community_area, val+parseInt(d.count_primary_type))})
  $(that.eventHandler).trigger("mapVisDataReady", [mapping]);
}

SocrataModel.prototype.barChartWrangler = function(that, community_area, filter_by, years){
  var dateFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
  var arrestRatios = d3.nest()
        .key(function(d){
            return dateFormatter.parse(d.date)[that.grouping]();})
        .rollup(function(leaves){
          if(leaves)
            return {"arrest_ratio" : d3.sum(leaves, function(d){return (d.arrest) ? 1 : 0}) / leaves.length};
          else
            return {"arrest_ratio": -1};
        })
        .entries(that.data);
        
  $(that.eventHandler).trigger("barChartDataReady", [arrestRatios]);
}

SocrataModel.prototype.timeWrangle = function(that, update, resolution){
  var timeData = that.filterQuery(state.crime_filters, resolution);
  var dateFormatter = (resolution == "getDay") ? d3.time.format.utc("%Y-%m-%d") : ((resolution == "getMonth") ? d3.time.format.utc("%Y-%m") : d3.time.format.utc("%Y"));

  var getParsed = function (d){
    var re = ((resolution == "getDay") ? /T(.*?)$/gi : ((resolution == "getMonth") ? /-\d+T(.*?)$/gi : /-\d+-\d+T(.*?)$/gi));
    return d.date.replace(re, "")
  }

  var time_final = d3.nest()
    .key(function(d){
      return getParsed(d);
    })
    .rollup(function(values){
      if(values){
        return {"count" : d3.sum(values, function(d){return d.count_primary_type})}
      }
    }).map(timeData)

  // generate empty date array to fill in blanks
  var extent = d3.extent(Object.keys(time_final).map(function(d){
    if(resolution == "getYear") 
      return new Date(d, 0,1);
    else 
      return dateFormatter.parse(d);
  }));

  var dates;
  if (resolution == "getDay"){dates = d3.time.day.range(extent[0], extent[1].setDate(extent[1].getDate() + 1))}
  else if (resolution == "getMonth"){dates = d3.time.month.range(extent[0], extent[1].setMonth(extent[1].getMonth() + 1))}
  else {dates = d3.time.year.range(extent[0], extent[1]); }

  var zeroed_data = []
  dates.map(function(d){
    zeroed_data.push({"date":d, "count":0})
  })

  // populate zeroed data
  zeroed_data.forEach(function (k){
    var str = dateFormatter(k.date);
    if(str in time_final){
      k.count += time_final[str].count;
    }
  });

  var pass = update;
  if (pass){$(that.eventHandler).trigger("timeUpdate", [zeroed_data])}
    else {$(that.eventHandler).trigger("timeDataReady", [zeroed_data])}
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
