

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
}

SocrataModel.prototype.get = function (str, callback){
    var that = this;
    this.previousRequests.push(str);
    $.getJSON(this.fullUrl
        + str 
        + "&$$app_token=" + this.apiKey,
      function(data, status) {
        if(callback){
          callback(that, data);
        }else{
          console.log(data);
        }
      }
    ).fail(function() {
      console.log("Something went wrong!");
    });
}


SocrataModel.prototype.wrangleRequest = function (that, data){
  that.sunburstWrangle(that, data, []);
  that.mapWrangle(that, data, []);
  that.timeWrangle(that, data, [], false, "getDay");
}


SocrataModel.prototype.sunburstWrangle = function(that, data, filter_by){

  //var sunData = that.filterQuery(filter_by);

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
    }).entries(data);

  nested = convert_nested({"key": "sun_data", "values": nested});

  $(that.eventHandler).trigger("sunburstDataReady", [nested]);
}

SocrataModel.prototype.filterQuery = function(data, filter_by){
  if(typeof filter_by == "undefined" || filter_by.length == 0)
    return data;

  var filtered = data;
  filter_by.map(function(d,i){
    filtered = filtered.filter(function(e,j){
      return e[d.key] == d.value;
    })
  });
  return filtered;
}

SocrataModel.prototype.mapWrangle = function(that, data, filter_by, years){
  var mapData = that.filterQuery(data, filter_by);
  var mapping = d3.map();
  mapData.forEach(function(d){
    var val = mapping.get(+d.community_area) || 0;
    mapping.set(+d.community_area, val+parseInt(d.count_primary_type))})
  $(that.eventHandler).trigger("mapVisDataReady", [[mapping, filter_by]]);
}

SocrataModel.prototype.barChartWrangler = function(that, data, community_area, filter_by, years){
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
        .entries(data);
        
  $(that.eventHandler).trigger("barChartDataReady", [arrestRatios]);
}

SocrataModel.prototype.timeWrangle = function(that, filter_by, update, resolution){
  var timeData = that.filterQuery(filter_by);
  var dateFormatter = d3.time.format.utc("%Y-%m-%d");

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
  var extent = d3.extent(Object.keys(time_final).map(function(d){return dateFormatter.parse(d)}));

  var dates;
  if (resolution == "getDay"){dates = d3.time.day.range(extent[0], extent[1])}
  else if (resolution == "getMonth"){dates = d3.time.month.range(extent[0], extent[1])}
  else {dates = d3.time.year.range(extent[0], extent[1])}

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

  $(that.eventHandler).trigger("timeDataReady", [zeroed_data])
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
