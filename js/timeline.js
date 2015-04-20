// view-source:http://www.nytimes.com/interactive/2013/01/02/us/chicago-killings.html?_r=0
Timeline = function(_parentElement, _eventHandler, _data, _socrataModel){
  this.parentElement = _parentElement;
  this._socrataModel = _socrataModel;
  this.eventHandler = _eventHandler;

  // defines constants
  this.margin = {top: 20, right: 0, bottom: 5, left: 0},
  this.width = 600- this.margin.left - this.margin.right,
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

    this.x = d3.scale.ordinal()
      .rangeRoundBands([0, this.width/1.25],1);

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
    .interpolate("linear")
    .x(function(d) { return that.x(d.year); })
    .y(function(d) { return that.y(d.count); });

/*this.area = d3.svg.area()
      .interpolate("monotone")
      .x(function(d) { return that.x(d.year);})
      .y0(this.height)
      .y1(function(d) { return that.y(d.count);}); */

    this.brush = d3.svg.brush()
      .on("brush", function(){
        // initialize pass to send to other functions
        pass = {}
        if (that.brush.empty()){
        }
        else {
        }

        console.log(that.brush.extent()[0])
        // trigger event
        //$(that.eventHandler).trigger("selectionChanged", pass)
      });

    this.svg.append("g")
        .attr("class", "brush")

    this.updateVis();
};

Timeline.prototype.updateVis = function() {
  var that = this;

  console.log(this.data)
  this.x.domain(this.data.map(function(d){return d.year}))
  //this.x.domain(d3.extent(this.data, function(d) { return d.year; }));
  this.y.domain(d3.extent(this.data, function(d) { return d.count; }));

  // updates axis
  this.svg.select(".x.axis")
      .call(this.xAxis);

  this.svg.select(".y.axis")
      .call(this.yAxis)

  this.svg.append("path")
      .data([this.data])
      .attr("class", "line")
      .attr("d", that.line);

    /* // updates graph
    var path = this.svg.selectAll(".area")
      .data([this.displayData])

    path.enter()
      .append("path")
      .attr("class", "area");

    path
      .transition()
      .attr("d", this.area);

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

  this.svg.selectAll(".dot")
      .data(this.data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d){return that.x(d.year)})
      .attr("cy", function(d){return that.y(d.count)})
}





