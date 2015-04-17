

var SocrataModel = function(_baseUrl, _resource, _apiKey, _eventHandler, _responseType){
  this.baseUrl = _baseUrl;
  this.resource = _resource;
  this.apiKey = _apiKey;
  this.responseType = _responseType || "json";
  this.fullUrl = "{0}/resource/{1}.{2}?".format(this.baseUrl, this.resource, this.responseType);
  this.eventHandler = _eventHandler;
  this.previousRequests = [];
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
  that.sunburstWrangle();
  that.mapWrangle([]);
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
    }).entries(this.data);

  nested = convert_nested({"key": "sun_data", "values": nested});

  $(this.eventHandler).trigger("sunburstDataReady", [nested]);
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

SocrataModel.prototype.mapWrangle = function(filter_by){
  var that = this;
  var mapData = that.filterQuery(filter_by);
  var mapping = d3.map();
  mapData.forEach(function(d){
    var val = mapping.get(+d.community_area) || 0;
    mapping.set(+d.community_area, val+parseInt(d.count_primary_type))})
  $(that.eventHandler).trigger("mapVisDataReady", [mapping]);
}

SocrataModel.prototype.barChartWrangler = function(that){

  var arrestRatios = d3.nest()
    .key(function(d){return d.community_area})
    .rollup(function(values){
      if(values)
        return {"arrest_ratio" : d3.sum(values, function(d){return (d.arrest) ? 1 : 0}) / values.length};
    }).map(that.data)

  $(that.eventHandler).trigger("barChartDataReady", [arrestRatios]);
}
