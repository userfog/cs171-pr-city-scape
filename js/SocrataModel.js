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
  this.data = [];
  this.displayData = null;
}

SocrataModel.prototype.get = function (str, callback, offset, limit){
    NProgress.start();
    var that = this;
    request = str + "&$offset={0}&$limit={1}".format(offset, limit);
    $.getJSON(this.fullUrl
        + request 
        + "&$$app_token=" + this.apiKey,
      function(data, status) {
        that.data.push.apply(that.data, data);
        if(data.length !=  limit){
            if(callback){
              callback(that);
              NProgress.done();
            }else{
              console.log(data);
            }
        } else{
          NProgress.inc();
          that.get(str, callback, offset+limit, limit);
        }
      }
    ).fail(function() {
      console.log("Something went wrong!");
    });
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


SocrataModel.prototype.getDisplayData = function(){
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
      return;
    }
    case 1:{
      this.displayData = this.displayData.filter(function(d){
          return d[state.crime_filters[0].key] == state.crime_filters[0].value;
        });
      return
    }
    case 2:{
      this.displayData = this.displayData.filter(function(d){
          return (d[state.crime_filters[0].key] == state.crime_filters[0].value) 
          && (d[state.crime_filters[1].key] == state.crime_filters[1].value);
      })
      return;
    }
    case 3:{
      this.displayData = this.displayData.filter(function(d){
        return (d[state.crime_filters[0].key] == state.crime_filters[0].value) 
        && (d[state.crime_filters[1].key] == state.crime_filters[1].value)
        && (d[state.crime_filters[2].key] == state.crime_filters[2].value);
      });
      return 
    }
  }
}


SocrataModel.prototype.wrangleRequest = function (that){
  var t0 = new Date().getTime();
  that.getDisplayData();
  var t1 = new Date().getTime();
  console.log("getDisplayData: " + (t1-t0));
  that.sunburstWrangle();
  var t2 = new Date().getTime();
  console.log("sunburstWrangle: " + (t2-t1));
  that.mapWrangle();
  var t3 = new Date().getTime();
  console.log("mapWrangle: " + (t3-t2));
  that.timeWrangle(that, false, "getDay");
  var t4 = new Date().getTime();
  console.log("timeWrangle: " + (t4-t3));
}


SocrataModel.prototype.sunburstWrangle = function(){

  var that = this;

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
    }).entries(that.displayData);

  nested = convert_nested({"key": "sun_data", "values": nested});

  $(that.eventHandler).trigger("sunburstDataReady", [nested]);
}


SocrataModel.prototype.mapWrangle = function(){
  var that = this;
  var mapping = d3.map();
  that.displayData.forEach(function(d){
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
  var df = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
  var yr = 2004;
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

  function make_date(info){
    if (resolution == "getDay"){
      return new Date(info.getFullYear(), info.getMonth(), info.getDate());
    }
    else if (resolution == "getMonth"){
      return new Date(info.getFullYear(), info.getMonth(), 1);
    }
    else {
      return new Date(info.getFullYear(), 0, 1);
    }
  }

  function dateFromDay(year, day){
    var date = new Date(year, 0);
    return new Date(date.setDate(day));
  }

  for(var i = 0; i < zeroed_data.length; i++){
      zeroed_data[i] = {"date": dateFromDay(yr, i), "value": 0};
  }

  function dayFromDate(year, day){
    var start = new Date(year, 0, 0);
    var diff = day - start;
    var oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  for(var i = 0; i < that.displayData.length; i++){
    var info = df.parse(that.displayData[i].date);
    var day = dayFromDate(yr, info);
    if(day == 366){
      console.log(day)
    }
    zeroed_data[day].value++;
  }


  // var timeData = that.displayData;
  

  // var getParsed = function(d, dateFormatter){
  //   var month = dateFormatter.parse(d).getMonth()
  //   var year = dateFormatter.parse(d).getFullYear()
  //   var day = dateFormatter.parse(d).getDate()
  //   return {"d":day, "m": month, "yr":year}
  // }

  // var t0 = new Date().getTime();
  // var time_final = d3.nest()
  //   .key(function(d){
  //     var info = getParsed(d.date, d3.time.format.utc("%Y-%m-%dT%H:%M:%S"));
  //     if (resolution == "getDay"){
  //       return dateFormatter(new Date(info.yr, info.m, info.d))
  //     }
  //     else if (resolution == "getMonth"){
  //       return dateFormatter(new Date(info.yr, info.m, 1))
  //     }
  //     else {
  //       return dateFormatter(new Date(info.yr, 0, 1))
  //     }
  //   }).rollup(function(values){
  //     if(values){
  //       return {"count" : d3.sum(values, function(d){return d.count_primary_type})}
  //     }
  //   }).map(timeData)

  

  // var t1 = new Date().getTime();
  // console.log("\ttime_final: " + (t1-t0));

  // // generate empty date array to fill in blanks
  // var keys_to_dates = Object.keys(time_final).map(function(d){
  //   var info = getParsed(d, dateFormatter);
  //   if (resolution == "getDay"){
  //     return new Date(info.yr, info.m, info.d);
  //   }
  //   else if (resolution == "getMonth"){
  //     return new Date(info.yr, info.m, 1);
  //   }
  //   else {
  //     return new Date(info.yr, 0, 1);
  //   }
  // });
  // var extent = d3.extent(keys_to_dates); 


  // var dates;
  // if (resolution == "getDay"){dates = d3.time.day.range(extent[0], extent[1].setDate(extent[1].getDate() + 1))}
  // else if (resolution == "getMonth"){dates = d3.time.month.range(extent[0], extent[1].setMonth(extent[1].getMonth() + 1))}
  // else {dates = d3.time.year.range(extent[0], extent[1]); }

  // var zeroed_data = []
  // dates.map(function(d){
  //   zeroed_data.push({"date":d, "count":0})
  // })

  // // populate zeroed data
  // zeroed_data.forEach(function (k){
  //   var str = dateFormatter(k.date);
  //   if(str in time_final){
  //     k.count += time_final[str].count;
  //   }
  // });
  // var t2 = new Date().getTime();
  // console.log("\tzero data : " + (t2-t1));
  debugger;
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
