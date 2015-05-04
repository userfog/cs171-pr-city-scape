BarChartVis = function (_parentElement, _eventHandler, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    // defines constants
    this.margin = {top: 25, right: 20, bottom: 30, left: 30},
    this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
    this.height = 200- this.margin.top - this.margin.bottom;
}


BarChartVis.prototype.setDisplayData = function(that, community_area){
  if(that.community_area == "Total"){
    that.displayData = that.data.map(function(d){
      return {"key": d.key, "values": {"arrest_ratio": d3.mean(d.values, function(d){
        return d.values.arrest_ratio;
      })}}
    })
  } else {
    that.displayData = that.data.map(function(d){
      var cm = community_area
      var vs = (d.values[cm]) ? d.values[cm].values.arrest_ratio : 0;
      return {"key": d.key, "values": {"arrest_ratio": vs }}
    })
  }
}

BarChartVis.prototype.initData = function (_data, community_area, color){
  delete _data["undefined"];

  this.data = _data;

  this.color = color;
  this.community_area = community_area;

  this.setDisplayData(this,community_area);

  this.grandAvg = d3.mean(this.data, function(d){
      return d3.mean(d.values, function(d){
        return d.values.arrest_ratio;
      });
    })

  this.localAvg = d3.mean(this.displayData, function(d){
    return d.values.arrest_ratio;
  })

  // // 
  // that.displayData = that.data.filter(function(d){return d.values.arrest_ratio != -1});
 this.initVis();
}

BarChartVis.prototype.updateDisplay = function(that, community_area, color){
  this.color = color;
  this.community_area = community_area;
  that.setDisplayData(that, community_area);
  that.updateVis();
}


BarChartVis.prototype.initVis = function (){
    this.parentElement.selectAll("*").remove();
    var that = this;
    // constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + that.margin.left + "," + this.margin.top + ")");

    // creates axis and scales
    this.y = d3.scale.linear()
      .range([this.height, 0]);

    this.x = d3.scale.ordinal()
      .rangeRoundBands([0, this.width], .5);

    // updates scales
    this.x.domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    this.y.domain([0, 1]); 

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left");

    this.svg.append("text")
        .attr("x", (that.width / 2))             
        .attr("y", 0 - (that.margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text("Arrest % vs Months");

    // updates axis
    this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + that.height + ")")


    this.svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + 0 + ", 0)")
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("x", -200)
      .attr("dy", ".71em")

    this.localAvgLine = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { 
      return that.x(d); 
    });

    this.grandAvgLine = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { 
      return that.x(d); 
    }).y(function(d) { 
      return that.y(that.grandAvg); 
    }); 

    this.tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        var formatPercent = d3.format(".2%");
        return "<strong>Arrest Percentage:</strong> <span style='color:red'>" + formatPercent(+d.values.arrest_ratio) + "</span>";
      });

    // call the update method
    this.updateVis();
}


/**
 * the drawing function - should use the D3 selection, enter, exit
 */
BarChartVis.prototype.updateVis = function(){
    d3.select("#barVis").selectAll(".legend").remove()
    d3.select("#barVis").selectAll("rect").remove()
    d3.select("#barVis").selectAll(".line").remove()

    var that = this;

    this.svg.call(that.tip);

    that.avg = d3.mean(that.displayData, function(d){
      return d.values.arrest_ratio
    })

    that.localAvgLine.y(function(d) { 
      return that.y(that.avg); 
    }); 


    // updates graph
    var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    that.xAxis.ticks(d3.time.months, 12);

    this.svg.select(".x")
          .call(that.xAxis);
    this.svg.select(".y")
          .call(that.yAxis);


    this.svg.select(".x").selectAll("text")
    .text(function(d,i){
      return month[d]; 
    })
     .style("text-anchor", "end")
    .attr("transform", "rotate(-75)")
    .attr("y", -3)
    .attr("x", -10)

    var bar = this.svg.selectAll("rect")
        .data(this.displayData)

    bar.exit().remove();

    bar.enter()
    .append("rect")
      .attr("class", "bar")
      .attr("x", function(d){
        return that.x(parseInt(d.key));})
      .attr("y", function(d) { 
        return that.y(d.values.arrest_ratio); })
      .attr("height", function(d,i){
        return that.height - that.y(d.values.arrest_ratio);})
      .style("fill", this.color)
      .transition()
      .attr("width", that.x.rangeBand())

    bar.on('mouseover', that.tip.show)
      .on('mouseout', that.tip.hide);

  this.svg.append("path")
      .datum(d3.range(12))
      .attr("d", that.localAvgLine)
      .attr("class", "line")
      .attr("data-legend", function(){return "Local Avg: " + (that.avg*100).toFixed("2")})
      .attr("data-legend-icon", function(){return "line"})
      .style("stroke", "red")
      .style("stroke-width", 1.5)
      

  this.svg.append("path")
      .datum(d3.range(12))
      .attr("d", that.grandAvgLine)
      .attr("class", "line")
      .attr("data-legend", function(){return "Global Avg: " + (that.grandAvg*100).toFixed("2")})
      .attr("data-legend-icon", function(){return "line"})
      .style("stroke", "black")
      .style("stroke-width", 1.5)
      

  d3.selectAll("#barLeg").remove();
  legend = this.svg.append("g")
    .attr("class","legend")
    .attr("transform","translate(50,30)")
    .style("font-size","12px")
    .call(d3.legend)


}




