// view-source:http://www.nytimes.com/interactive/2013/01/02/us/chicago-killings.html?_r=0
MapVis = function(_parentElement, _data, _socrataModel, _eventHandler){
  this.parentElement = _parentElement;
  this.data = _data;
  this.socrataModel = _socrataModel;
  this.eventHandler = _eventHandler;

  this.areasMap = {
"rogers park": 1,
"west ridge": 2,
"uptown": 3,
"lincoln square": 4,
"north center": 5,
"lake view": 6,
"lake view": 7,
"near north side": 8,
"edison park": 9,
"norwood park": 10,
"jefferson park": 11,
"forest glen": 12,
"north park": 13,
"albany park": 14,
"portage park": 15,
"irving park": 16,
"dunning": 17,
"montclare": 18,
"belmont cragin": 19,
"hermosa": 20,
"avondale": 21,
"logan square": 22,
"humboldt park": 23,
"west town": 24,
"austin": 25,
"west garfield park": 26,
"east garfield park": 27,
"near west side": 28,
"north lawndale": 29,
"south lawndale": 30,
"lower west side": 31,
"loop": 32,
"near south side": 33,
"armour square": 34,
"douglas": 35,
"oakland": 36,
"fuller park": 37,
"grand boulevard": 38,
"kenwood": 39,
"washington park": 40,
"hyde park": 41,
"woodlawn": 42,
"south shore": 43,
"chatham": 44,
"avalon park": 45,
"south chicago": 46,
"burnside": 47,
"calumet heights": 48,
"roseland": 49,
"pullman": 50,
"south deering": 51,
"east side": 52,
"west pullman": 53,
"riverdale": 54,
"hegewisch": 55,
"garfield ridge": 56,
"archer heights": 57,
"brighton park": 58,
"mckinley park": 59,
"bridgeport": 60,
"new city": 61,
"west elsdon": 62,
"gage park": 63,
"clearing": 64,
"west lawn": 65,
"chicago lawn": 66,
"west englewood": 67,
"englewood": 68,
"greater grand crossing": 69,
"ashburn": 70,
"auburn gresham": 71,
"beverly": 72,
"washington heights": 73,
"mount greenwood": 74,
"morgan park": 75,
"ohare": 76,
"o'hare": 76,
"edgewater": 77}

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
  this.quantize = d3.scale.quantize()
    .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

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
      blockGroups = topojson.feature(this.data, this.data.objects.blockGroups),
      communityAreas = topojson.feature(this.data, this.data.objects.communityAreas);

  this.communityAreas = this.svg.selectAll("path")
    .data(topojson.feature(this.data, this.data.objects.communityAreas).features)
    .enter().append("path")
    .attr("class", "communityarea")
    .attr("id", function(d,i){
      if(d.properties.name == "OHARE"){
        debugger;
      }
      return that.areasMap[d.properties.name.toLowerCase()];})
    .attr("d", this.path)    
    .on("click", function(d){console.log(d);})

};

MapVis.prototype.choropleth = function(){
  var that = this;

  that.quantize.domain(d3.extent(d3.range(78).map(function(d){return that.socrataModel.map.get(d)})));

  this.svg.selectAll(".communityAreas")
  .data(topojson.object(this.data, this.data.objects.communityAreas).geometries)
  .enter()
  .append("path")
  .attr("class", function(d){
    return that.quantize(that.socrataModel.map.get(that.areasMap[d.properties.name.toLowerCase()]));
  }).attr("d", that.path);
}

