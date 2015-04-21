

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
  that.sunburstWrangle(that);
  that.mapWrangle([]);
  that.timeWrangle([]);
}


SocrataModel.prototype.sunburstWrangle = function(that){

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
    }).entries(that.data);

  nested = convert_nested({"key": "sun_data", "values": nested});

  $(that.eventHandler).trigger("sunburstDataReady", [nested]);
}

SocrataModel.prototype.filterQuery = function(filter_by){
  if(typeof filter_by == "undefined" || filter_by.length == 0)
    return this.data;

  var filtered = this.data;
  filter_by.map(function(d,i){
    filtered = filtered.filter(function(e,j){
      return e[d.key] == d.value;
    })
  });
  return filtered;
}

SocrataModel.prototype.mapWrangle = function(filter_by, years){
  var that = this;
  var mapData = that.filterQuery(filter_by);
  var mapping = d3.map();
  mapData.forEach(function(d){
    var val = mapping.get(+d.community_area) || 0;
    mapping.set(+d.community_area, val+parseInt(d.count_primary_type))})
  $(that.eventHandler).trigger("mapVisDataReady", [[mapping, filter_by]]);
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

SocrataModel.prototype.timeWrangle = function(filter_by){
  var that=this;
  var timeData = that.filterQuery(filter_by);

  var dateFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
  timeData.map(function(d){
    var month = dateFormatter.parse(d.date).getMonth()
    var year = dateFormatter.parse(d.date).getFullYear()
    d["new_date"] = dateFormatter(new Date(year, month, 1))
  })

  var time_ags = d3.nest()
    .key(function(d){return d.new_date})
    .rollup(function(values){
      if(values)
        return {"count" : d3.sum(values, function(d){return d.count_primary_type})}
    }).map(that.data)

  // change to better format
  time_final = []
  Object.keys(time_ags).map(function(d){time_final.push({"date":dateFormatter.parse(d), "count":time_ags[d].count})})

  $(that.eventHandler).trigger("timeDataReady", [time_final]);
}
