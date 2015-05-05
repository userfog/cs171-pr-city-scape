// view-source:http://www.nytimes.com/interactive/2013/01/02/us/chicago-killings.html?_r=0
Timeline = function(_parentElement, _eventHandler, _data, _socrataModel){
  this.parentElement = _parentElement;
  this._socrataModel = _socrataModel;
  this.eventHandler = _eventHandler;
  this.initialized = false;
  this.prev_brush = [];
  // defines  tants
  this.margin = {top: 25, right: 50, bottom: 65, left: 0},
  this.width = getInnerWidth(this.parentElement)- this.margin.left - this.margin.right,
  this.height = 300 - this.margin.top - this.margin.bottom;

}

Timeline.prototype.initData = function (_data){
  this.data = _data;
  this.initVis();
  this.initialized = true;
}

Timeline.prototype.initVis = function() {
  var that = this;
  if(this.initialized){
    this.updateVis();
    return;
  }

  this.svg = this.parentElement.append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .append("g")
    .attr("transform", "translate(75,0)")

    /*this.x = d3.scale.ordinal()
      .rangeRoundBands([0, this.width/1.25],1.015);*/

    this.x = d3.time.scale()
      .range([0, this.width/1.25]);

    this.y = d3.scale.linear()
      .range([this.height/1.45,this.margin.top]);

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left");

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      

    this.svg.append("text")
        .attr("x", (that.width / 2))             
        .attr("y", (that.margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px")  
        .text("Crime Counts with Time");

    // Add axes visual elements
    this.svg.append("g")
        .attr("class", "y axis")

  this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height/1.45 + ")")

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
        var ex = that.brush.extent();

        state.set_time(ex);

        if(state.crime_filters.length > 0){
          that.brush.extent(that.prev_brush);
          that.svg.select('.brush').call(that.brush);
          d3.select("#timeline").selectAll("svg").style("opacity", 0.5)
          d3.selectAll(".warning").remove()
          d3.select("#timeline").append("text").text("You must be at the root node (all crimes) to brush.").attr("class", "warning")
        } else {
        d3.selectAll(".warning").remove()
        d3.select("#timeline").selectAll("svg").style("opacity", 1)
        that.prev_brush = ex;
        $(that.eventHandler).trigger("timeChange"); }
      })


    var g =  this.svg.append("g")
        .attr("class", "brush")



    this.updateVis();
};

Timeline.prototype.updateVis = function() {
  var that = this;
  /*var dateFormatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
  this.data.map(function(d){

  }) */

  //this.x.domain(this.data.map(function(d){return d.year}))
  this.x.domain(d3.extent(this.data, function(d) { return d.date; }));
  this.y.domain([0,d3.max(this.data, function(d) { return d.count; })]);



  // updates axis
  this.svg.select(".x.axis")
      .transition().duration(750)
      .call(this.xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-75)")
      .attr("y", -3)
      .attr("x", -10);

  this.svg.select(".y.axis")
      .transition().duration(750)
      .call(this.yAxis)

  //data join
  var trendline = this.svg.selectAll(".line")
      .data([this.data])

  // enter
  trendline.enter()
    .append("path")
    .attr("class", "line")

  // update
  trendline.transition().duration(750)
      .attr("d", that.line);

  // exit
  trendline.exit().remove()
   
  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([0,0])
  .html(function(d) {
    return String(d.date).slice(0,16) + ": " + d.count;
  })

  this.svg.call(tip);
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
        .attr("height", this.height/1.45-this.margin.top+1)
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
  points.on("mouseover", tip.show)
    .on("mouseout", tip.hide)

  points.exit().remove()


}

Timeline.prototype.onSelectionChange = function(_data) {

  this.data = _data;
  this.updateVis();
}


