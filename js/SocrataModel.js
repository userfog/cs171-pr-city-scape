

var SocrataModel = function(_baseUrl, _resource, _apiKey, _eventHandler, _responseType){
  this.baseUrl = _baseUrl;
  this.resource = _resource;
  this.apiKey = _apiKey;
  this.responseType = _responseType || "json";
  this.fullUrl = "{0}/resource/{1}.{2}?".format(this.baseUrl, this.resource, this.responseType);
  this.eventHandler = _eventHandler;
}

SocrataModel.prototype.get = function (str, callback, method){
    var that = this;
    $.getJSON(this.fullUrl
        + str 
        + "&$$app_token=" + this.apiKey,
      function(data, status) {
                  that.map = d3.map();
                  data.forEach(function(d){that.map.set(+d.community_area, +d.count_primary_type)})
                  //that.mapWrangle(data)
                  callback(method(data));
                  $(that.eventHandler).trigger("selectionChanged", []);
                }
    ).fail(function() {
      console.log("Something went wrong!");
    });
}

SocrataModel.prototype.sunburstWrangle = function(data){

  var that=this;

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

  return {unmerged:sun_data, merged:sun_merged_data};
}

SocrataModel.prototype.mapWrangle = function(data){

  var that=this;


}