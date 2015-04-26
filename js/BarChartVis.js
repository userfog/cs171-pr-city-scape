BarChartVis = function (_parentElement, _eventHandler, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    // defines constants
    this.margin = {top: 20, right: 20, bottom: 30, left: 20},
    this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
    this.height = 400 - this.margin.top - this.margin.bottom;
}

BarChartVis.prototype.initVis = function (_data){
    if(!_data){
      return;
    }
    else{
      delete _data["undefined"];
      this.data = _data;
      this.displayData = _data;
    }

    this.parentElement.selectAll("*").remove();
    var that = this;
    // constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // creates axis and scales
    this.y = d3.scale.linear()
      .range([this.height, 0]);

    this.x = d3.scale.ordinal()
      .rangeRoundBands([0, this.width], .1);

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left");

    // updates axis
    this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + that.height + ")")


    this.svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + that.margin.left + ", 0)")
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Arrests / Crime");

    this.valueline = d3.svg.line()
    .x(function(d) { return that.x(d.key)*1.07 + 1.5; })
    .y(function(d) { return that.y(that.avg); });

    // call the update method
    this.updateVis();
}


/**
 * the drawing function - should use the D3 selection, enter, exit
 */
BarChartVis.prototype.updateVis = function(){

    var that = this;

    that.displayData = that.data.filter(function(d){return d.values.arrest_ratio != -1});

    that.avg = d3.mean(that.displayData, function(d){
      return d.values.arrest_ratio;
    });

    var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      var formatPercent = d3.format(".2%");
      return "<strong>Arrest Percentage:</strong> <span style='color:red'>" + formatPercent(+d.values.arrest_ratio) + "</span>";
    });

    this.svg.call(tip);


    // updates scales
    this.x.domain(Object.keys(that.displayData));
    this.y.domain(d3.extent(Object.keys(that.displayData).map(function(d){
      return that.data[d].values.arrest_ratio;}
    )));

    this.svg.select(".x")
          .call(that.xAxis);
    this.svg.select(".y")
          .call(that.yAxis);
    // updates graph
    var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    this.svg.select(".x").selectAll("text")
    .text(function(d,i){
      return month[d]; 
    })
     .style("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -3)
    .attr("x", -4)
    // Data join
    var bar = this.svg.selectAll(".bar")
      .data(this.displayData);

    // Append new bar groups, if required
    var bar_enter = bar.enter().append("g");

    // Append a rect and a text only for the Enter set (new g)
    bar_enter.append("rect")
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

    // // Add click interactivity
    // bar_enter.on("click", function(d, i) {
    // });


    // Remove the extra bars
    bar.exit()
      .remove();

    // Update all inner rects and texts (both update and enter sets)

    bar.selectAll("rect")
      .attr("x", function(d){
        return that.x(d.key); })
      .attr("y", function(d) { 
        return that.y(d.values.arrest_ratio); })
      .attr("height", function(d,i){
        return that.height - that.y(d.values.arrest_ratio);})
      .transition()
      .attr("width", that.x.rangeBand());

        // Add attributes (position) to all bars
    bar
      .attr("class", function(d){
        return "bar ";
      })
      .transition();

    // Add the valueline path.
    that.svg.append("path")
        .attr("class", "avg_line")
        .attr("d", that.valueline(that.displayData));
}




