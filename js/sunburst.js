// view-source:http://www.nytimes.com/interactive/2013/01/02/us/chicago-killings.html?_r=0
Sunburst = function(_parentElement, _data, _eventHandler){
  this.parentElement = _parentElement;
  
  this.allData = _data;

  this.data = _data.merged;

  this.eventHandler = _eventHandler;

    // defines constants
  this.margin = {top: 20, right: 20, bottom: 30, left: 0},
  this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
  this.height = 500 - this.margin.top - this.margin.bottom;

  this.initVis();
}

Sunburst.prototype.filter = function(year){
  this.data = this.allData.unmerged.childrenDict[year];

  this.initVis();
}


Sunburst.prototype.initVis = function() {
  var that = this;

  this.svg = this.parentElement.append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .append("g")
    .attr("transform", "translate(180,200)");

  //http://bl.ocks.org/Caged/6476579
  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([0,0])
  .html(function(d) {
    return d.name + ": " + d.value;
  })

  this.svg.call(tip);

  radius = Math.min(this.width/1.25, this.height/1.25) / 2;

  this.x = d3.scale.linear()
      .range([0, 2 * Math.PI]);

  this.y = d3.scale.sqrt()
      .range([0, radius]);

  this.color = d3.scale.category20c();

  this.partition = d3.layout.partition()
      .value(function(d) { return d.size; });

  this.arc = d3.svg.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, that.x(d.x))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, that.x(d.x + d.dx))); })
      .innerRadius(function(d) { return Math.max(0, that.y(d.y)); })
      .outerRadius(function(d) { return Math.max(0, that.y(d.y + d.dy)); });

  console.log(this.data);
  this.path = that.svg.selectAll("path")
      .data(that.partition.nodes(this.data))
      .enter().append("path")
      .attr("class", "sun-path")
      .attr("d", that.arc)
      //.style("fill", function(d) { return that.color((d.children ? d : d.parent).name); })
      .style("fill", function(d){return that.color(d.name)})
      .on("click", click)
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide)

    function click(d){
      that.path.transition()
      .duration(750)
      .attrTween("d", that.arcTween(d));
    }

    d3.select(self.frameElement).style("height", this.height + "px");
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



