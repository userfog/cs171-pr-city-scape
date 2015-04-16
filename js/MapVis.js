// view-source:http://www.nytimes.com/interactive/2013/01/02/us/chicago-killings.html?_r=0
MapVis = function(_parentElement, _data, _socrataModel, _eventHandler){
  this.parentElement = _parentElement;
  this.data = _data;
  this.socrataModel = _socrataModel;
  this.eventHandler = _eventHandler;

  this.customLabels = {
  "ARMOUR SQUARE": {offset: [0,-10]},
  "AUSTIN": {offset: [8,0]},
  "BEVERLY": {offset: [0, 10]},
  "BRIDGEPORT": {offset: [0, -5]},
  "BURNSIDE": {hide: 1},
  "EAST GARFIELD PARK": {hide: 1},
  "ENGLEWOOD": {offset: [-20,0]},
  "FULLER PARK": {hide: 1},
  "GARFIELD RIDGE": {offset: [0, 10]},
  "HEGEWISCH": {offset: [-10, 20]},
  "KENWOOD": {hide: 1},
  "OHARE": {offset: [-25,-10]},
  "PULLMAN": {hide: 1},
  "WEST ENGLEWOOD": {hide: 1},
  "WEST GARFIELD PARK": {offset: [20,0], name: "GARFIELD PARK"},
  "WEST PULLMAN": {offset: [0,-5]}
};

 this.specials = {
  "AUSTIN": 1,
  "GREATER GRAND CROSSING": 1,
  "HYDE PARK": 1,
  "LINCOLN PARK": 1
};

 this.leaderLines = [
  {label: "austin", d:"M 248 314 L 280 314"},
  {label: "lincoln", d:"M 504 254 L 554 254"},
  {label: "grand crossing", d:"M 286 610 L 490 610"},
  {label: "hyde park", d:"M 583 525 L 623 525 L 623 490"}
];
    // defines constants
  this.margin = {top: 20, right: 20, bottom: 0, left: 0},
  this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
  this.height = 900 - this.margin.top - this.margin.bottom;
  this.quantize = d3.scale.quantize()
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

  this.initVis();
}

MapVis.prototype.initVis = function() {


  function mouseovered (d){
    debugger;
  }

  function mouseouted (d){
    debugger;
  }

  var that = this;

  this.projection = d3.geo.albers()
    .rotate([87.73, 0])
    .center([0, 42.0433])
    .scale(120000)
    .translate([this.width / 2, 0]);

  this.path = d3.geo.path()
    .projection(this.projection);


  this.svg = this.parentElement.append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
  .append("g")
    .attr("transform", "translate(-25,-30)");

  var blocksById = {},
      blockGroups = topojson.feature(this.data, this.data.objects.blockGroups),
      communityAreas = topojson.feature(this.data, this.data.objects.communityAreas);

  this.communityAreas = this.svg.selectAll("path")
    .data(topojson.feature(this.data, this.data.objects.communityAreas).features)
    .enter().append("path")
    .attr("class", function(d){
      return "communityareas " + areasMap[d.properties.name.toLowerCase()];
    })
    .attr("d", this.path)    
    .on("click", function(d){console.log(d);})
    .on("mouseenter", mouseovered)
    .on("mouseover", mouseovered)
    .on("mouseout", mouseouted)
    .on("mouseleave", mouseouted);

  this.communityLabels = this.svg.selectAll(".communityareas-label")
      .data(communityAreas.features.filter(function(d) {
        var l = that.customLabels[d.properties.name] || {};
        d.properties.hide = l.hide || false;
        d.properties.dx = l.offset ? l.offset[0] : 0;
        d.properties.dy = l.offset ? l.offset[1] : 0;
        if (l.name) d.properties.name = l.name;
        return !d.properties.hide;
      }))
    .enter().append("g")
      .attr("class", "communityareas-label")
      .attr("transform", function(d) {
        var c = that.path.centroid(d);
        return "translate(" + [c[0] + d.properties.dx, c[1] + d.properties.dy] + ")";
      });

  this.communityLabels.selectAll("text")
    .data(function(d) {
          var words = d.properties.name.split(" ");
          return words.map(function(d) { return {word: d, count: words.length}; });
        })
    .enter().append("text") 
      .attr("class", "communityareas-dropshadow")
      .attr("dy", function(d, i) { return (i - d.count / 2 + .7) + "em"; })
      .text(function(d){ return d.word; })

  this.communityLabels.selectAll(".communityareas-name")
      .data(function(d) {
        var words = d.properties.name.split(" ");
        return words.map(function(d) { return {word: d, count: words.length}; });
      })
    .enter().append("text")
      .attr("class", "communityareas-name")
      .attr("dy", function(d, i) { return (i - d.count / 2 + .7) + "em"; })
      .text(function(d) { return d.word; });
};

MapVis.prototype.choropleth = function(mapping){

  var that = this;
  that.quantize.domain(d3.extent(d3.range(78).map(function(d){return mapping.get(d)})));
  this.svg.selectAll(".communityareas")
  .attr("class", function(d){
    return "communityarea " + areasMap[d.properties.name.toLowerCase()] + " " + that.quantize(mapping.get(areasMap[d.properties.name.toLowerCase()]));
  }).attr("d", that.path);

  //Adding legend for our Choropleth
  var legend = this.svg.append("g")
  .classed("legend", true)
  .attr("transform", "translate(" + 20 + "," + 0 + ")")
  .selectAll("g.legend_el")
  .data(that.quantize.range())
  .enter().append("g")
  .attr("class", "legend_el");

  var ls_w = 20, ls_h = 20;

  legend.append("rect")
  .attr("x", 20)
  .attr("y", function(d, i){ return that.height/2 - (i*ls_h) - 2*ls_h;})
  .attr("width", ls_w)
  .attr("height", ls_h)
  .attr("class", function(d, i){return "q"+i+"-9";})

  legend.append("text")
  .attr("x", 50)
  .attr("y", function(d, i){ return that.height/2 - (i*ls_h) - ls_h - 4;})
  .text(function(d, i){ 
    var q = that.quantize.invertExtent("q"+i+"-9"); 
    return q[0].toFixed() + " - " + q[1].toFixed();
  });

  this.svg.select(".legend").append("text")
  .attr("x", 20)
  .attr("y", that.height/2 - (that.quantize.range().length*ls_h) - ls_h - 4)
  .text("Quantity Of Crimes");

}

