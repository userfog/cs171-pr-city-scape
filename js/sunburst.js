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

  this.radius = Math.min(this.width/1.1, this.height/1.1) / 2;
  //http://bl.ocks.org/Caged/6476579
  this.tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0,0])
    .html(function(d) {
      var txt = d.key.split(".");
      return "<div><strong>{0}</strong><br>Quantity: {1}</di>".format(d.key, d.value);
    });

  this.luminance = d3.scale.sqrt()
    .domain([0, 3])
    .clamp(true)
    .range([10, 75]);
}

Sunburst.prototype.initData = function (_data){
  this.data = _data;

  this.initVis();

}

Sunburst.prototype.initVis = function() {
  var that = this;


  var getDepth = function (d, height) {
      var top = d;
      for(var i = d.depth; i > height; i--){
        top = top.parent;
      }
      return top;
  }

  var getColor = function (d){
    var top = getDepth(d, 1);
    return (top.key != "Total") ? that.fill(top.key, d.depth) : "#FFCC44";
  }

  this.parentElement.selectAll("*").remove();

  this.svg = this.parentElement.append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .append("g")
    .attr("transform", "translate(225,130)");

  this.svg.call(this.tip);


  this.x = d3.scale.linear()
      .range([0, 2 * Math.PI]);

  this.y = d3.scale.sqrt()
      .range([0, that.radius]);

  this.partition = d3.layout.partition()
      .value(function(d) { return d.values.size; })
      .children(function(d){return d.values;})

  this.arc = d3.svg.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, that.x(d.x))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, that.x(d.x + d.dx))); })
      .innerRadius(function(d) { 
          return Math.max(0, that.y(d.y)); 
        })
      .outerRadius(function(d) { 
          return Math.max(0, that.y(d.y + d.dy)); 
      });

  var par = that.partition.nodes(this.data)

  if(!this.sunburst_colors){
      var tmp = par[0].values.sort(function(a,b){a.value - b.value});
      this.sunburst_colors = d3.scale.category20().domain(tmp.map(function(d){return d.key}));
  }

  this.path = that.svg.selectAll("path")
      .data(par)
      .enter().append("path")
      .attr("class", "sun-path")
      .attr("d", that.arc)
      .style("stroke", "#E0D9DA")
      .style("stroke-width", ".4")
      .on("click", click)
      .on("mouseover", function(d){
        d3.select(this).style("fill", "aquamarine")
        that.tip.show(d)
      })
      .on("mouseout", function(d){
        d3.select(this).style("fill", getColor(d))
        that.tip.hide(d)
      })


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


Sunburst.prototype.fill = function  (key, depth) {
  var c = d3.lab(this.sunburst_colors(key));
  c.l = this.luminance(depth);
  return c;
}


