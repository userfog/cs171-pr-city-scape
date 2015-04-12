

var SocrataModel = function(_baseUrl, _resource, _apiKey, _eventHandler, _responseType){
  this.baseUrl = _baseUrl;
  this.resource = _resource;
  this.apiKey = _apiKey;
  this.responseType = _responseType || "json";
  this.fullUrl = "{0}/resource/{1}.{2}?".format(this.baseUrl, this.resource, this.responseType);
  this.eventHandler = _eventHandler;
  this.data;
}

SocrataModel.prototype.get = function (str, callback){
    var that = this;
    $.getJSON(this.fullUrl
        + str 
        + "&$$app_token=" + this.apiKey,
      callback || function(data, status) {
                  that.map = d3.map();
                  data.forEach(function(d){that.map.set(+d.community_area, +d.count_primary_type)})
                  $(that.eventHandler).trigger("selectionChanged", []);
                }
    ).fail(function() {
      console.log("Something went wrong!");
    });
}