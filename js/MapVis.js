// view-source:http://www.nytimes.com/interactive/2013/01/02/us/chicago-killings.html?_r=0
MapVis = function(_parentElement, _data, _eventHandler){
  this.parentElement = _parentElement;
  this.data = _data;
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
  this.margin = {top: 20, right: 20, bottom: 30, left: 0},
  this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
  this.height = 1000 - this.margin.top - this.margin.bottom;

  this.initVis();
}

MapVis.prototype.initVis = function() {
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
      blockGroups = topojson.object(this.data, this.data.objects.blockGroups),
      communityAreas = topojson.object(this.data, this.data.objects.communityAreas);

  this.svg.insert("defs", "*").append("clipPath")
    .datum(communityAreas)
    .attr("id", "g-clip-district")
  .append("path")
    .attr("d", this.path);

  this.svg.append("path")
    .datum(communityAreas)
    .attr("class", "g-district")
    .attr("d", this.path);

  this.svg.append("path")
      .datum(topojson.mesh(this.data, this.data.objects
        .communityAreas, function(a, b) { return a !== b; }))
      .attr("class", "g-district-inner-boundary")
      .attr("d", this.path);

  this.svg.append("path")
      .datum(topojson.mesh(this.data, this.data.objects
        .communityAreas, function(a, b) { return a === b; }))
      .attr("class", "g-district-outer-boundary")
      .attr("d", this.path);

  this.svg.append("path")
      .datum({type: "GeometryCollection", geometries: communityAreas.geometries.filter(function(d) { return d.properties.name in that.specials; })})
      .attr("class", "g-district-special")
      .attr("d", this.path);


  this.districtLabel = this.svg.selectAll(".g-district-label")
      .data(communityAreas.geometries.filter(function(d) {
        var l = that.customLabels[d.properties.name] || {};
        d.properties.hide = l.hide || false;
        d.properties.dx = l.offset ? l.offset[0] : 0;
        d.properties.dy = l.offset ? l.offset[1] : 0;
        if (l.name) d.properties.name = l.name;
        return !d.properties.hide;
      }))
    .enter().append("g")
      .attr("class", "g-district-label")
      .attr("transform", function(d) {
        var c = that.path.centroid(d);
        return "translate(" + [c[0] + d.properties.dx, c[1] + d.properties.dy] + ")";
      });

  this.districtLabel.selectAll("text")
      .data(function(d) {
        var words = d.properties.name.split(" ");
        return words.map(function(d) { return {word: d, count: words.length}; });
      })
    .enter().append("text")
      .attr("class", "g-district-name")
      .attr("dy", function(d, i) { return (i - d.count / 2 + .7) + "em"; })
      .text(function(d) { return d.word; });

};