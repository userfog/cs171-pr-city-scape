

var SocrataModel = function(_baseUrl, _resource, _apiKey, _responseType){
  this.baseUrl = _baseUrl;
  this.resource = _resource;
  this.apiKey = _apiKey;
  this.responseType = _responseType || "json";
  this.fullUrl = "{0}/resource/{1}.{2}?".format(this.baseUrl, this.resource, this.responseType);
}

SocrataModel.prototype.get = function (str, callback){
    $.getJSON(this.fullUrl
        + str 
        + "&$$app_token=" + this.apiKey,
      callback || function(data, status) {
                  console.log("Request received: " + data);
                }
    ).fail(function() {
      console.log("Something went wrong!");
    });
}