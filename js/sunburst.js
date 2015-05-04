// view-source:http://www.nytimes.com/interactive/2013/01/02/us/chicago-killings.html?_r=0
Sunburst = function(_parentElement, _eventHandler, _data, _socrataModel){
  this.parentElement = _parentElement;
  this._socrataModel = _socrataModel;

  this.eventHandler = _eventHandler;

  // defines constants
  this.margin = {top: 10, right: 10, bottom: 10, left: 50},
  this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
  this.height = 300 - this.margin.top - this.margin.bottom;

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
  var sunburst_colors = d3.scale.category20().domain(that.data.values.map(function(d){return d.key}).sort());

  var getDepth = function (d, height) {
      var top = d;
      for(var i = d.depth; i > height; i--){
        top = top.parent;
      }
      return top;
  }

  var getColor = function (d){
    var top = getDepth(d, 1);
    return (top.key != "Total") ? sunburst_colors(top.key) : "#FFCC44";
  }

  this.parentElement.selectAll("*").remove();

  this.svg = this.parentElement.append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .append("g")
    .attr("transform", "translate(225,130)");

  //http://bl.ocks.org/Caged/6476579
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0,0])
    .html(function(d) {
      var txt = d.key.split(".");
      return "<div><strong>{0}</strong><br>Quantity: {1}</di>".format(txt.join(","), d.size);
    });

  this.svg.call(tip);

  this.radius = Math.min(this.width, this.height) / 2.5;

  this.x = d3.scale.linear()
      .range([0, 2 * Math.PI]);

  this.y = d3.scale.sqrt()
      .range([0, that.radius]);

  //this.color = d3.scale.category20c();
  this.color = ["#2D2DFB", "#329732", "#FC3333", "#932B93"];

  this.partition = d3.layout.partition()
      .value(function(d) { return d.values.size; })
      .children(function(d){return d.values;})
      .size([2 * Math.PI, this.radius]);

  this.arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx - .01 / (d.depth + .5); })
    .innerRadius(function(d) { return that.radius / 3 * d.depth; })
    .outerRadius(function(d) { return that.radius / 3 * (d.depth + 1) - 1; });


  this.path = that.svg.selectAll("path")
      .data(that.partition.nodes(this.data))
      .enter().append("path")
      .attr("class", "sun-path")
      .attr("d", that.arc)
      .style("stroke", "#eee")
      .style("stroke-width", ".5")
      .on("click", click)
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide)


    this.path.style("fill", getColor);

    function click(d){
      function getFilters(d, prev){
        if(d.depth == 0){
          return prev;
        } else {
          prev.push({"key":that.depth_to_field[d.depth], "value":d.key});
          return getFilters(d.parent, prev);
        }
      }
      
      that.path.transition()
      .duration(750)
      .attrTween("d", that.arcTween(d));
      state.set_crime(getFilters(d, []));
      $(that.eventHandler).trigger("selectionChanged", getColor(d));
    }

    d3.select(self.frameElement).style("height", this.height + "px");
};

// Interpolate the scales!
Sunburst.prototype.arcTween = function(d) {
  that = this;
  var xd = d3.interpolate(that.x.domain(), [d.x, d.x + d.dx]),
  yd = d3.interpolate(that.y.domain(), [d.y, 1]),
  yr = d3.interpolate(that.y.range(), [d.y ? 20 : 0, that.radius]);
  return function(d, i) {
    return i
        ? function(t) { return that.arc(d); }
        : function(t) { that.x.domain(xd(t)); that.y.domain(yd(t)).range(yr(t)); return that.arc(d); };
  };
}



