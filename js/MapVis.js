
// view-source:http://www.nytimes.com/interactive/2013/01/02/us/chicago-killings.html?_r=0
MapVis = function(_parentElement, _data, _demographicData, _income, _socrataModel, _eventHandler){
  this.parentElement = _parentElement;
  this.data = _data;
  this.demographicData = _demographicData;
  this.incomeData = _income;
  this.socrataModel = _socrataModel;
  this.eventHandler = _eventHandler;
  this.displayData = d3.map();

  this.customLabels = {
    "ARMOUR SQUARE": {offset: [0,-10]},
    "AUSTIN": {offset: [8,0]},
    "BEVERLY": {offset: [0, 10]},
    "BRIDGEPORT": {offset: [0, -5]},
    "BURNSIDE": {hide: 1},
    "EAST GARFIELD PARK": {hide: 1},
    "ENGLEWOOD": {offset: [-20,0]},
    "FULLER PARK": {hide: 1},
    "GARFIELD RIDGE": {offset: [0, 10]},
    "HEGEWISCH": {offset: [-10, 20]},
    "KENWOOD": {hide: 1},
    "OHARE": {offset: [-25,-10]},
    "PULLMAN": {hide: 1},
    "WEST ENGLEWOOD": {hide: 1},
    "WEST GARFIELD PARK": {offset: [20,0], name: "GARFIELD PARK"},
    "WEST PULLMAN": {offset: [0,-5]}
  };

  // defines constants
  this.margin = {top: 20, right: 0, bottom: 0, left: 0},
  this.width = 450 - this.margin.left - this.margin.right,
  this.height = 850 - this.margin.top - this.margin.bottom;
  this.color = d3.scale.linear()
    .range(["#eee", "blue"]);
  this.initVis();
}

MapVis.prototype.initVis = function() {

  var that = this;

  this.projection = d3.geo.albers()
    .rotate([87.73, 0])
    .center([0, 42.0433])
    .scale(85000)
    .translate([this.width / 2, 0]);

  this.path = d3.geo.path()
    .projection(this.projection);


  this.svg = this.parentElement.append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
  .append("g")
    .attr("transform", "translate(10,"+that.margin.top+")");

  var blocksById = {},
      blockGroups = topojson.feature(this.data, this.data.objects.blockGroups),
      communityAreas = topojson.feature(this.data, this.data.objects.communityAreas);

  this.communityAreas = this.svg.selectAll("path")
    .data(topojson.feature(this.data, this.data.objects.communityAreas).features)
    .enter().append("path")
    .attr("class", function(d){
      return "communityareas " + areasMap[d.properties.name.toLowerCase()];
    })
    .attr("d", this.path);

  this.communityLabels = this.svg.selectAll(".communityareas-label")
      .data(communityAreas.features.filter(function(d) {
        var l = that.customLabels[d.properties.name] || {};
        d.properties.hide = l.hide || false;
        d.properties.dx = l.offset ? l.offset[0] : 0;
        d.properties.dy = l.offset ? l.offset[1] : 0;
        if (l.name) d.properties.name = l.name;
        return !d.properties.hide;
      }))
    .enter().append("g")
      .attr("class", "communityareas-label")
      .attr("transform", function(d) {
        var c = that.path.centroid(d);
        return "translate(" + [c[0] + d.properties.dx, c[1] + d.properties.dy] + ")";
      });

  /*this.communityLabels.selectAll("text")
    .data(function(d) {
          var words = d.properties.name.split(" ");
          return words.map(function(d) { return {word: d, count: words.length}; });
        })
    .enter().append("text") 
      .attr("class", "communityareas-dropshadow")
      .attr("dy", function(d, i) { return (i - d.count / 2 + .7) + "em"; })
      .text(function(d){ return d.word; }) */

  this.communityLabels.selectAll(".communityareas-name")
      .data(function(d) {
        var words = d.properties.name.split(" ");
        return words.map(function(d) { return {word: d, count: words.length}; });
      })
    .enter().append("text")
      .attr("class", "communityareas-name")
      .attr("dy", function(d, i) { return (i - d.count / 2 + .7) + "em"; })
      .text(function(d) { return d.word; });

    this.communityAreas
    .on("mouseover", function(d){
        var table_demographics = that.demographicData.filter(function(e){
          return getId(d) == e.community_area;
        });

        var table_income = that.incomeData.filter(function(e){
          return getId(d) == e.community_area;
        });


        d3.select("#quantity")
        .html("<br><br><strong>Quantity</strong>" + "<br>" +that.displayData.get(getId(d)));

        that.table(d.properties.name, table_demographics);
        that.income_table(d.properties.name, table_income);

        d3.select(this).style("stroke", "black").style("stroke-width", 1.2)
        $(that.eventHandler).trigger("communityAreaChanged", [[getId(d), that.colorRange]])

    }).on("mouseout", function(){

      that.table("Total", that.demographicData);
      that.income_table("Total", that.incomeData);

      d3.select(this).style("stroke-width", 0.1)

      var mean = d3.sum(d3.range(1,78), function(d){
        return that.displayData.get(d)
      })/77;

      d3.select("#quantity")
        .html("<br><br><strong>Quantity</strong>" + "<br>" + d3.format(".02f")(mean))

      $(that.eventHandler).trigger("communityAreaChanged", [["Total", that.colorRange]]);
      
    });

    this.communityLabels
    .on("mouseover", function(d){
        var table_demographics = that.demographicData.filter(function(e){
          return getId(d) == e.community_area;
        });
        that.table(d.properties.name, table_demographics);
        $(that.eventHandler).trigger("communityAreaChanged", [[getId(d), that.colorRange]])
        // d3.select("._"+getId(d)).style("stroke", "black").style("stroke-width", 1.2);
    }).on("mouseout", function(){
      that.table("Total", that.demographicData);
      
      $(that.eventHandler).trigger("communityAreaChanged", [["Total", that.colorRange]]);
      // d3.select("._"+getId(d)).style("stroke-width", 0.1)
    });


    this.incomeTable = d3.select("#tableIncome").append("table"), 
    incomeThead = this.incomeTable.append("thead")
      .attr("class", "thead");


    incomeThead.append("tr").selectAll("th")
      .data(["", "2006-2010"]).enter()
      .append("th")
      .text(function(d){return d});

    this.incomeTbody = this.incomeTable.append("tbody").attr("id", "incomeTableBody");


    this.tableHtml = d3.select("#tableDemographics").append("table"), 
    thead = this.tableHtml.append("thead")
      .attr("class", "thead");

    thead.append("tr").selectAll("th")
      .data(["Demographics", "2000","2010"]).enter()
      .append("th")
      .text(function(d){return d});

    this.tbody = this.tableHtml.append("tbody").attr("id", "tableBody");

    that.table("Total", that.demographicData);

    that.income_table("Total", that.incomeData);

}

MapVis.prototype.income_table = function (name, table_income){
  var counts = {}
    function aggregate(){
      var total = {}
      table_income.map(function(d){
        for(var property in d){
            if(property != "Community Name" && property != "community_area")
              if(d[property] != "n/a"){
                counts[property + "_count"] = counts[property + "_count"] + 1 || 1;
                total[property] = total[property] + parseInt(d[property]) || parseInt(d[property])
              }
        }
      });
      return total;
  }
  var cap = this.incomeTable.select("caption");
  if(!cap[0][0]){
    this.incomeTable.append("caption")
    .html("Household Income")
    .style("text-align", "right");
  } 

  this.incomeTbody.selectAll("*").remove()

  if(name == "Total"){
    table_income = aggregate();
  } else{
    table_income = table_income[0];
  }

  var rows = this.incomeTbody.selectAll("tr.table_row")
  .data(Object.keys(table_income).filter(function(d){
      return d != "Community Name" && d != "community_area";
  }))
  .enter()
  .append("tr").attr("class", "table_row");

  var cells = rows.selectAll("td")
  .data(function(row) {
      return d3.range(2).map(function(column, i) {
          function getValue(){
            if(name != "Total"){
              return table_income[row];
            }
            else{
              return table_income[row]/counts[row+"_count"];
            }
          }
          if(i==0){
            if(row == "Average")
              return row;
            else
              return ""; 
          }
          if(row == "Total Households"){
            return d3.format(".0f")(getValue());
          }else{
            return d3.format("$.2f")(getValue());
          }
      });
  })
  .enter()
  .append("td")
  .text(function(d) { return d; });
}

MapVis.prototype.choropleth = function(mapping, color){
  var that = this;
  that.colorRange = color || that.colorRange;

  that.displayData = mapping;
  var values = d3.range(78).map(function(d){return mapping.get(d)}).filter(function(d,i){
      return typeof d == "number" && d != NaN;
  });
  var quantiles = [];
  quantiles.push(d3.min(values));
  // quantiles.push(d3.mean(values).toFixed());
  quantiles.push(d3.max(values));

  var depth = state.crime_filters.length;
  that.color.domain(d3.extent(values)).range(["#eee", that.colorRange]);

  this.svg.selectAll(".communityareas")
  .style("stroke", "black")
  .style("stroke-width", 0.1)
  .transition().duration(750)
  .style("fill", function(d){
    var valid = mapping.get(areasMap[d.properties.name.toLowerCase()]);
    if(valid != undefined)
      return that.color(valid)
    else
      return "white"
  });

  //Adding legend for our Choropleth
  d3.selectAll("#myLegend").remove();

  var ls_w = 20, ls_h = 120;
  var legend = this.svg.append("g")
    .attr("id", "myLegend")
    .attr("transform", "translate(" + 0 + "," + 5 + ")");


  legend.append("text")
  .attr("x", 10)
  .attr("y", that.height/2.2 - (ls_h+10))
  .text("Quantity Of Crimes");

  var gradient = legend.append("svg:linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");

  gradient.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", that.colorRange)
    .attr("stop-opacity", 1);

  gradient.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", "#eee")
    .attr("stop-opacity", 1);

  legend.append("rect")
    .attr("x", 20)
    .attr("y", that.height/2.2-ls_h)
    .attr("width", ls_w)
    .attr("height", ls_h+30)
    .style("fill", "url(#gradient)")

  legend.append("g")
    .selectAll("legend_el")
    .data(quantiles.sort(d3.ascending)).enter()
    .append("text")
    .attr("x", 50)
    .attr("y", function(d, i){ 
      return (!i) ? 400 : 270
    })
    .text(function(d, i){  
      return d;
    });
}


MapVis.prototype.table = function (name, table_demographics){

  function aggregate(){
    return d3.nest()
    .key(function (d) { return d.year })
    .rollup(function (values){
      var total = {};
      values.map(function(d){
        for(var property in d){
          if(property != "year" && property != "community_area")
            total[property] = total[property] + parseInt(d[property]) || parseInt(d[property])
        }  
      });
      return total;
    }).entries(table_demographics)
  }

  var cap = this.tableHtml.select("caption");
  if(!cap[0][0]){
    this.tableHtml.append("caption").html(name)
  } else{
    cap.html(name);
  }

  this.tbody.selectAll("*").remove()

  if(name == "Total"){
    table_demographics = aggregate().map(function(d){
      d.values.year = d.key;
      return d.values;
    });
  }

  var rows = this.tbody.selectAll("tr.table_row")
  .data(Object.keys(table_demographics[0]).filter(function(d){
      return d != "year" && d != "community_area";
  }))
  .enter()
  .append("tr").attr("class", "table_row");

  var cells = rows.selectAll("td")
  .data(function(row) {
      return d3.range(3).map(function(column, i) {
          if(i==0){
            return row;
          }
          if(row != "Total")
            return d3.format("%.02")(table_demographics[i-1][row]/table_demographics[i-1]["Total"]);
          else
            return table_demographics[i-1][row];
      });
  })
  .enter()
  .append("td")
  .text(function(d) { return d; });
}