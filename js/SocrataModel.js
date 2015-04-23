

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
  that.timeWrangle([], false, "getDay");
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

  console.log(filter_by)
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

SocrataModel.prototype.timeWrangle = function(filter_by, update, resolution){
  var that=this;
  var timeData = that.filterQuery(filter_by);
  var dateFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");

  

  var time_final = d3.nest()
    .key(function(d){
      var date = dateFormatter.parse(d.date);
      if(resolution=="getDay"){
        return date.getYear() + "/" + date.getMonth() + "/" + date.getDay();
      } else if (resolution=="getMonth"){
        return date.getYear() + "/" + date.getMonth();
      } else if (resolution=="getYear"){
        return date.getYear();
      }
    })
    .rollup(function(values){
      if(values){
        return {"date": dateFormatter.parse(values[0].date), "count" : d3.sum(values, function(d){return d.count_primary_type})}
      }
    }).map(timeData)

  // sort by time (if not sorted, path code won't work)
  time_final.sort(function (a,b) {return d3.ascending(a.date, b.date) })

  // generate empty date array to fill in blanks
  var extent = d3.extent(time_final.map(function(d){return d.date}))
  var dates;
  if (resolution == "getDay"){dates = d3.time.day.range(extent[0], extent[1])}
  else if (resolution == "getMonth"){dates = d3.time.month.range(extent[0], extent[1])}
  else {dates = d3.time.year.range(extent[0], extent[1])}

  var zeroed_data = []
  dates.map(function(d){
    zeroed_data.push({"date":d, "count":0})
  })

  // populate zeroed data
  time_final.map(function(d){
    zeroed_data.forEach(function(k, i, arr){
      if(i == 0 && (d.date <= k.date)){
        k.count += d.count;
      } else if(i == arr.length-1 && (d.date >= k.date)){
        k.count += d.count;
      } else if(d.date > arr[i-1].date && d.date < arr[i+1].date){
        k.count += d.count;
      }
    })
  })
 d
  var pass = update;
  if (pass){$(that.eventHandler).trigger("timeUpdate", [zeroed_data])}
    else {$(that.eventHandler).trigger("timeDataReady", [zeroed_data])}
}
