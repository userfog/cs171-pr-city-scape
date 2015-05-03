self.onmessage = function(e) {
  var mapping = {};
  e.data.forEach(function(d){
    var val = mapping.get(+d.community_area) || 0;
    mapping[+d.community_area] = val+parseInt(d.count_primary_type);
  });
  postMessage(mapping);
}