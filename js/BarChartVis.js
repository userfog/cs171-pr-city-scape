BarChartVis = function (_parentElement, _eventHandler, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    // defines constants
    this.margin = {top: 20, right: 50, bottom: 30, left: 50},
    this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
    this.height = 400 - this.margin.top - this.margin.bottom;
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
      return {"key": d.key, "values": {"arrest_ratio": d.values.values[cm]}}
    })
  }
}

BarChartVis.prototype.initData = function (_data, community_area, color){
  delete _data["undefined"];
  if(!this.data)
    this.data = _data;

  this.color = color;
  this.community_area = community_area;

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
 this.setDisplayData(this,community_area);
 this.initVis();
}

BarChartVis.prototype.updateDisplay = function(that, community_area, color){
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
    .x(function(d) { 
      return that.x(d.key); 
    })
    .y(function(d) { 
      return that.y(that.localAvg); 
    }); 


    this.grandAvgLine = d3.svg.line()
    .x(function(d) { 
      return that.x(d.key); 
    })
    .y(function(d) { 
      return that.y(that.grandAvg); 
    }); 

    // call the update method
    this.updateVis();
}


/**
 * the drawing function - should use the D3 selection, enter, exit
 */
BarChartVis.prototype.updateVis = function(){
    delete this.displayData["undefined"];
    var that = this;

    that.avg = d3.mean(that.displayData, function(d){
      return d3.mean(d.values, function(d){
        return d.values.arrest_ratio;
      });
    })

    var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      var formatPercent = d3.format(".2%");
      return "<strong>Arrest Percentage:</strong> <span style='color:red'>" + formatPercent(+d.values.arrest_ratio) + "</span>";
    });

    this.svg.call(tip);

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
    .attr("data-legend", "Hello")

    // Data join
    var bar = this.svg.selectAll(".bar")
      .data(this.displayData);

    // Append new bar groups, if required
    var bar_enter = bar.enter().append("g");

    // Append a rect and a text only for the Enter set (new g)
    bar_enter.append("rect")
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

    // Remove the extra bars
    bar.exit()
      .remove();

    // Update all inner rects and texts (both update and enter sets)

    bar.selectAll("rect")
      .attr("x", function(d){
        return that.x(parseInt(d.key));})
      .attr("y", function(d) { 
        return that.y(d.values.arrest_ratio); })
      .attr("height", function(d,i){
        return that.height - that.y(d.values.arrest_ratio);})
      .style("fill", this.color)
      .transition()
      .attr("width", that.x.rangeBand());

    // Add attributes (position) to all bars
    bar.attr("class", function(d){
        return "bar ";
    }).transition();

  this.svg.append("path")
      .datum(that.displayData)
      .attr("class", "line")
      .attr("data-legend", "Local Avg: " + that.localAvg)
      .attr("data-legend", "line")
      .style("fill", "aquamarine")
      .attr("d", that.localAvgLine);

  this.svg.append("path")
      .datum(that.displayData)
      .attr("class", "line")
      .attr("data-legend", "Global Avg: " + that.grandAvg)
      .attr("data-legend", "line")
      .style("fill", "black")
      .attr("d", that.grandAvgLine);

  d3.selectAll("#barLeg").remove();
  legend = this.svg.append("g")
    .attr("class","legend")
    .attr("transform","translate(50,30)")
    .style("font-size","12px")
    .call(d3.legend)

//   var ls_w = 20, ls_h = 120;
//   var legend = this.svg.append("g")
//     .classed("myLegend", true)
//     .attr("transform", "translate(" + 20 + "," + 0 + ")");

//   legend.append("text")
//   .attr("x", 20)
//   .attr("y", that.height/1.8 - (ls_h+10))
//   .text("Quantity Of Crimes");

//   var gradient = legend.append("svg:linearGradient")
//     .attr("id", "gradient")
//     .attr("x1", "0%")
//     .attr("y1", "0%")
//     .attr("x2", "0%")
//     .attr("y2", "100%")
//     .attr("spreadMethod", "pad");

//   gradient.append("svg:stop")
//     .attr("offset", "0%")
//     .attr("stop-color", that.colorRange)
//     .attr("stop-opacity", 1);

//   gradient.append("svg:stop")
//     .attr("offset", "100%")
//     .attr("stop-color", "#eee")
//     .attr("stop-opacity", 1);

//   legend.append("rect")
//   .attr("x", 20)
//   .attr("y", that.height/1.8-ls_h)
//   .attr("width", ls_w)
//   .attr("height", ls_h+30)
//   .style("fill", "url(#gradient)")

//   legend.append("g")
//   .selectAll("legend_el")
//   .data(quantiles.sort(d3.ascending)).enter()
//   .append("text")
//   .attr("x", 50)
//   .attr("y", function(d, i){ 
//     return 500 - i%3*70
//   })
//   .text(function(d, i){  
//     return d;
//   });


}




