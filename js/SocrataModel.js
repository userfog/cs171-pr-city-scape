

var SocrataModel = function(_baseUrl, _resource, _apiKey, _eventHandler, _responseType){
  this.baseUrl = _baseUrl;
  this.resource = _resource;
  this.apiKey = _apiKey;
  this.responseType = _responseType || "json";
  this.fullUrl = "{0}/resource/{1}.{2}?".format(this.baseUrl, this.resource, this.responseType);
  this.eventHandler = _eventHandler;
  this.previousRequests = [];
}

SocrataModel.prototype.get = function (str, callback){
    var that = this;
    this.previousRequests.push(str);
    $.getJSON(this.fullUrl
        + str 
        + "&$$app_token=" + this.apiKey,
      function(data, status) {
        if(callback){
          callback(data, that);
        }else{
          console.log(data);
        }
      }
    ).fail(function() {
      console.log("Something went wrong!");
    });
}


SocrataModel.prototype.wrangleRequest = function (data, that){
  that.sunburstWrangle(data, that);
  that.mapWrangle(data, that);
}

SocrataModel.prototype.sunburstWrangle = function(data, that){
  // instantiate top level
  var sun_merged_data = {name:"sun_data", children: [], childrenDict:{}};
  var sun_data = {name:"sun_data", children: [], childrenDict:{}};

  function nameInChildren(childrenDict, name){
    if(name in childrenDict){
      return childrenDict[name];
    }

    return null;
  }


  function createObjects(obj, parent, key, merge){
    // base case
    if(key == null){

      if(!merge){
        if (obj.count_primary_type > 10){
          parent.children.push({"name":obj.location_description,"size":obj.count_primary_type});
        }
        return;
      }

      var entry = nameInChildren(parent.childrenDict, obj.location_description);

      if(entry){
        entry.size += parseInt(obj.count_primary_type);
      }
      else{
        entry = {"name":obj.location_description,"size":obj.count_primary_type};
        if(obj.count_primary_type > 10){
          parent.children.push(entry);
          parent.childrenDict[entry.name] = entry;
          }
      }

      return;
    }

    var nextParent = nameInChildren(parent.childrenDict, obj[key]);

    // create a new object
    if(nextParent == null){
      nextParent = {name:obj[key], children:[], childrenDict:{}};
      parent.childrenDict[nextParent.name] = nextParent;
      parent.children.push(nextParent);
    }

    var nextKey;

    switch(key){
      case "year":
        nextKey = "primary_type";
        break;
      case "primary_type":
        nextKey = "description";
        break;
      case "description":
        nextKey = null;
        break;
    }

    createObjects(obj, nextParent, nextKey);
  }

  data.forEach(function(d){
    createObjects(d, sun_data, "year");
  });

   data.forEach(function(d){
    createObjects(d, sun_merged_data, "primary_type", true);
  });

  $(that.eventHandler).trigger("sunburstDataReady", [[sun_data, sun_merged_data]]);
}

SocrataModel.prototype.mapWrangle = function(data, that){
  var mapping = d3.map();
  data.forEach(function(d){mapping.set(+d.community_area, +d.count_primary_type)})
  $(that.eventHandler).trigger("selectionChanged", [mapping]);
}

SocrataModel.prototype.barChartWrangler = function(data, that){

  var arrestRatios = d3.nest()
    .key(function(d){return d.community_area})
    .rollup(function(values){
      if(values)
        return {"arrest_ratio" : d3.sum(values, function(d){return (d.arrest) ? 1 : 0}) / values.length};
    }).map(data)

  $(that.eventHandler).trigger("barChartDataReady", [arrestRatios]);
}
