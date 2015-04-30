// view-source:http://www.nytimes.com/interactive/2013/01/02/us/chicago-killings.html?_r=0
Sunburst = function(_parentElement, _eventHandler, _data, _socrataModel){
  this.parentElement = _parentElement;
  this._socrataModel = _socrataModel;

  this.eventHandler = _eventHandler;

  // defines constants
  this.margin = {top: 20, right: 50, bottom: 5, left: 50},
  this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
  this.height = 500 - this.margin.top - this.margin.bottom;

  this.depth_to_field = {
    0: "none",
    1: "primary_type",
    2: "description",
    3: "location_description"
  };

}

Sunburst.prototype.initData = function (_data){
  this.data = _data;
  this.initVis();
}

Sunburst.prototype.initVis = function() {
  var that = this;
  var sunburst_colors = d3.scale.category20().domain(that.data.children.map(function(d){return d.name}).sort());

  var getDepth = function (d, height) {
      var top = d;
      for(var i = d.depth; i > height; i--){
        top = top.parent;
      }
      return top

  }

  var getColor = function (d){
    var top = getDepth(d, 1);
    return (top.name != "sun_data") ? sunburst_colors(top.name) : "black";
  }

  // this.parentElement.selectAll("*").remove();

  this.svg = this.parentElement.append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .append("g")
    .attr("transform", "translate(250,250)");

  //http://bl.ocks.org/Caged/6476579
  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([0,0])
  .html(function(d) {
    return d.name + ": " + d.value;
  })

  this.svg.call(tip);

  radius = Math.min(this.width/1.1, this.height/1.1) / 2;

  this.x = d3.scale.linear()
      .range([0, 2 * Math.PI]);

  this.y = d3.scale.sqrt()
      .range([0, radius]);

  //this.color = d3.scale.category20c();
  this.color = ["#2D2DFB", "#329732", "#FC3333", "#932B93"];

  this.partition = d3.layout.partition()
      .value(function(d) { return d.size; });

  this.arc = d3.svg.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, that.x(d.x))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, that.x(d.x + d.dx))); })
      .innerRadius(function(d) { 
          return Math.max(0, that.y(d.y)); 
        })
      .outerRadius(function(d) { 
          return Math.max(0, that.y(d.y + d.dy)); 
      });

  this.path = that.svg.selectAll("path")
      .data(that.partition.nodes(this.data))
      .enter().append("path")
      .attr("class", "sun-path")
      .attr("d", that.arc)
      .style("stroke", "#eee")
      .style("stroke-width", ".5")
      //.style("fill", function(d) { return that.color((d.children ? d : d.parent).name); })
      //.style("fill", function(d){return that.color(d.name)})
      .on("click", click)
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide)

    /* this.border = that.svg.selectAll(".sun-border")
      .data(that.partition.nodes(this.data))
      .enter().append("path")
      .attr("class", "sun-border")
      .attr("d", that.arc)
      .style("fill", "none")
      .style("stroke", "white")
      .style("stroke-width", .2) */

    this.path.style("fill", getColor);

    function click(d){
      function getFilters(d, prev){
        if(d.depth == 0){
          return prev;
        } else {
          prev.push({"key":that.depth_to_field[d.depth], "value":d.name});
          return getFilters(d.parent, prev);
        }
      }
      
      that.path.transition()
      .duration(750)
      .attrTween("d", that.arcTween(d));
      debugger;
      state.set_crime(getFilters(d, []));
      $(that.eventHandler).trigger("selectionChanged", getColor(d));
    }

    d3.select(self.frameElement).style("height", this.height + "px");

    //    // ranking changes
    // this.parentElement.select("#resolution").select("select").on("change", function(){
    //       var res = d3.select("#resolution").selectAll("select").property("value");
    //       pass = {"res": res, "filter": lastFilter}
    //       console.log("hi")
    //       $(that.eventHandler).trigger("resolutionChange", pass)
    // })
};

// Interpolate the scales!
Sunburst.prototype.arcTween = function(d) {
  that = this;
  var xd = d3.interpolate(that.x.domain(), [d.x, d.x + d.dx]),
  yd = d3.interpolate(that.y.domain(), [d.y, 1]),
  yr = d3.interpolate(that.y.range(), [d.y ? 20 : 0, radius]);
  return function(d, i) {
    return i
        ? function(t) { return that.arc(d); }
        : function(t) { that.x.domain(xd(t)); that.y.domain(yd(t)).range(yr(t)); return that.arc(d); };
  };
}



