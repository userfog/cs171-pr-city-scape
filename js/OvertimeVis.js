OvertimeVis = function(_parentElement, _eventHandler, _data, _socrataModel){
  this.parentElement = _parentElement;
  this.initialized = false;
  this.prev_brush = [];
  // defines  tants
  this.margin = {top: 50, right: 50, bottom: 0, left: 50},
  this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
  this.height = 225 - this.margin.top - this.margin.bottom;

}

OvertimeVis.prototype.initData = function (_data){
  this.data = _data;
  if(this.init)
    return
  this.init = true;
  this.initVis();
}

OvertimeVis.prototype.initVis = function() {
  var that = this;

  this.svg = this.parentElement.append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .append("g")
    .attr("transform", "translate(75,0)");


    this.x = d3.time.scale()
      .range([0, this.width/1.5]);

    this.y = d3.scale.linear()
      .range([this.height/1.25,this.margin.top]);

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .ticks(4)
      .orient("left");

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");
      

    this.svg.append("text")
        .attr("x", (that.width / 2))             
        .attr("y", (that.margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text("Crime vs Years");

    // Add axes visual elements
    this.svg.append("g")
        .attr("class", "y axis")
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("x", -20)
        .attr("dy", ".71em")
        .style("text-anchor", "end");

  this.svg.append("g")
        .attr("class", "x axis")


  this.line = d3.svg.line()
    .x(function(d) { 
      return that.x(moment({"year": d.date}).zone("-6:00")); })
    .y(function(d) { 
      return that.y(d.count); });

    this.updateVis();
};

OvertimeVis.prototype.updateVis = function() {
  var that = this;

  this.x.domain(d3.extent(this.data, function(d) { return new Date(d.date, 0, 0, 0).getTime(); }));
  this.y.domain(d3.extent(this.data, function(d) { return d.count; }));


  // updates axis
  this.svg.select(".x.axis")
      .transition().duration(750)
      .attr("transform", "translate(0," + this.height/1.25 + ")")
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
    return d.date + ": " + d.count;
  })

  this.svg.call(tip);

  var points = this.svg.selectAll(".dot")
      .data(this.data)

  points.enter().append("circle")
      .attr("class", "dot")
      .attr("r", 2)
  points.transition().duration(750)
      .attr("cx", function(d){return that.x(moment({"year": d.date}).zone("-6:00"))})
      .attr("cy", function(d){return that.y(d.count)})
  points.on("mouseover", tip.show)
    .on("mouseout", tip.hide)

  points.exit().remove()


}

