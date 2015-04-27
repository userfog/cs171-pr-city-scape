// view-source:http://www.nytimes.com/interactive/2013/01/02/us/chicago-killings.html?_r=0
Timeline = function(_parentElement, _eventHandler, _data, _socrataModel){
  this.parentElement = _parentElement;
  this._socrataModel = _socrataModel;
  this.eventHandler = _eventHandler;

  // defines constants
  this.margin = {top: 20, right: 0, bottom: 5, left: 0},
  this.width = getInnerWidth(this.parentElement)- this.margin.left - this.margin.right,
  this.height = 600 - this.margin.top - this.margin.bottom;

}

Timeline.prototype.initData = function (_data){
  this.data = _data;
  this.initVis();
}

Timeline.prototype.initVis = function() {
  var that = this;

  this.svg = this.parentElement.append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .append("g")
    .attr("transform", "translate(50,0)");

    /*this.x = d3.scale.ordinal()
      .rangeRoundBands([0, this.width/1.25],1.015);*/

    this.x = d3.time.scale()
      .range([0, this.width/1.25]);

    this.y = d3.scale.linear()
      .range([this.height/2,this.margin.top]);

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left");

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      

    // Add axes visual elements
    this.svg.append("g")
        .attr("class", "y axis")
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("x", -20)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(function(){
          return "Crime Count";
        });

    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height/2 + ")")

  this.line = d3.svg.line()
    .interpolate("monotone")
    .x(function(d) { return that.x(d.date); })
    .y(function(d) { return that.y(d.count); });

  this.area = d3.svg.area()
      .interpolate("monotone")
      .x(function(d) { return that.x(d.date);})
      .y0(this.height/2)
      .y1(function(d) { return that.y(d.count);});

    this.brush = d3.svg.brush()
      .on("brush", function (d){
        state.time_filters = that.brush.extent();
        $(that.eventHandler).trigger("timeChange")
      }) 

    this.svg.append("g")
        .attr("class", "brush")

    this.updateVis();
};

Timeline.prototype.updateVis = function() {
  var that = this;

  console.log(this.data)
  /*var dateFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
  this.data.map(function(d){

  }) */

  //this.x.domain(this.data.map(function(d){return d.year}))
  this.x.domain(d3.extent(this.data, function(d) { return d.date; }));
  this.y.domain([0,d3.max(this.data, function(d) { return d.count; })]);

  // updates axis
  this.svg.select(".x.axis")
      .transition().duration(750)
      .call(this.xAxis);

  this.svg.select(".y.axis")
      .transition().duration(750)
      .call(this.yAxis)

  //data join
  var trendline = this.svg.selectAll(".line")
      .data([this.data])

  // enter
  trendline.enter().append("path")
      .attr("class", "line")

  // update
  trendline.transition().duration(750)
      .attr("d", that.line);

  // exit
  trendline.exit().remove()
   
  /* // updates graph
  var path = this.svg.selectAll(".area")
      .data([that.data])

    path.enter()
      .append("path")
      .attr("class", "area");

    path
      .transition().duration(750)
      .attr("d", that.area);

    path.exit()
      .remove(); */

  this.brush.x(this.x);
    this.svg.select(".brush")
        .call(this.brush)
      .selectAll("rect")
        .attr("height", this.height/2-this.margin.top)
        .attr("y", this.margin.top)
        .style("fill", "lightgrey")
        .attr("opacity", .75)

  var points = this.svg.selectAll(".dot")
      .data(this.data)

  points.enter().append("circle")
      .attr("class", "dot")
      .attr("r", 2)
  points.transition().duration(750)
      .attr("cx", function(d){return that.x(d.date)})
      .attr("cy", function(d){return that.y(d.count)})
  points.exit().remove()


}

Timeline.prototype.onSelectionChange = function(_data) {

  this.data = _data;
  this.updateVis();
}


