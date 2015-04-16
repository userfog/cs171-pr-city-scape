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

BarChartVis.prototype.initData = function (_data){
  delete _data["undefined"];
  this.data = _data;
  this.displayData = this.data;
  this.initVis();
}

BarChartVis.prototype.initVis = function (){
    var that = this;
    // constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    // creates axis and scales
    this.y = d3.scale.linear()
      .range([0, this.height]);

    this.x = d3.scale.ordinal()
      .rangeRoundBands([0, this.width], .1);

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .ticks(6)
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

    // call the update method
    this.updateVis();
}


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
BarChartVis.prototype.wrangleData= function(_filterFunction){

    // displayData should hold the data whiche is visualized
    this.displayData = this.filterAndAggregate(_filterFunction);

    //// you might be able to pass some options,
    //// if you don't pass options -- set the default options
    //// the default is: var options = {filter: function(){return true;} }
    //var options = _options || {filter: function(){return true;}};
}


/**
 * the drawing function - should use the D3 selection, enter, exit
 */
BarChartVis.prototype.updateVis = function(){

    var that = this;

    // updates scales
    this.x.domain(Object.keys(that.data));
    this.y.domain(d3.extent(Object.keys(that.data).map(function(d){
      return that.data[d].arrest_ratio;}
    )));

    this.svg.select(".x")
          .call(that.xAxis);
    this.svg.select(".y")
          .call(that.yAxis);
    // updates graph

    // Data join
    var bar = this.svg.selectAll(".bar")
      .data(Object.keys(this.data).map(function(d){
      return [d, that.data[d].arrest_ratio];
    }));

    // Append new bar groups, if required
    var bar_enter = bar.enter().append("g");

    // Append a rect and a text only for the Enter set (new g)
    bar_enter.append("rect");
    bar_enter.append("text");

    // // Add click interactivity
    // bar_enter.on("click", function(d, i) {
    // });

    // Add attributes (position) to all bars
    bar
      .attr("class", function(d){
        return "bar " + d[0];
      })
      .transition()
      .attr("transform", function(d, i) { 
        return "translate("+ that.x(d[0]) + "," + 0 + ")"; })

    // Remove the extra bars
    bar.exit()
      .remove();

    // Update all inner rects and texts (both update and enter sets)

    bar.selectAll("rect")
      .attr("x", 0)
      .attr("y", function(d) { return that.y(d[1]); })
      .attr("height", function(d,i){return that.height - that.y(d[1]);})
      .style("fill", "steelblue")
      .transition()
      .attr("width", that.x.rangeBand());

    // bar.selectAll("text")
    //   .transition()
    //   .attr("y", function(d,i) { return that.y(d[1]) + (that.doesLabelFit(d[1], that.metaData["priorities"][""+d[0]]["item-title"]) ? -3 : 5); })
    //   .attr("x", function(d,i) { return that.x.rangeBand() / 2; })
    //   .text(function(d, i) { return that.metaData["priorities"][""+d[0]]["item-title"]; })
    //   .attr("class", "type-label")
    //   .attr("dy", ".35em");
}


/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
BarChartVis.prototype.onSelectionChange = function (selectionStart, selectionEnd){

    // TODO: call wrangle function

    this.updateVis();
}


/**
 * Helper function that figures if there is sufficient space
 * to fit a label inside its bar in a bar chart
 */
BarChartVis.prototype.doesLabelFit = function(count, datum, label) {
  var pixel_per_character = 6;  // obviously a (rough) approximation

  return datum.length * pixel_per_character < this.y(count);
}

/**
 * The aggregate function that creates the counts for each age for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
BarChartVis.prototype.filterAndAggregate = function(_filter){


    //Dear JS hipster, a more hip variant of this construct would be:
    var filter = _filter || function(){return true;}

    var that = this;

    // create an array of values for age 0-100
    var res = d3.range(16).map(function () {
        return 0;
    });

    this.data.filter(filter)
        .forEach(function(d){
            d.prios.forEach(function(j,i){
                res[i] += j;
            });
        });    
    return res;
}




