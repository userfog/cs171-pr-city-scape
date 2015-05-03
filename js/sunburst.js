// view-source:http://www.nytimes.com/interactive/2013/01/02/us/chicago-killings.html?_r=0
Sunburst = function(_parentElement, _eventHandler, _data, _socrataModel){
  this.parentElement = _parentElement;
  this._socrataModel = _socrataModel;

  this.eventHandler = _eventHandler;


  // defines constants
  this.margin = {top: 50, right: 50, bottom: 50, left: 50},
  this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right,
  this.height = 600 - this.margin.top - this.margin.bottom;

  this.depth_to_field = {
    0: "none",
    1: "primary_type",
    2: "description",
    3: "location_description"
  };

  this.initVis();
}

Sunburst.prototype.initData = function (_data, color){
  this.data = _data;
  this.level = this.data;
  this.updateVis();
}

Sunburst.prototype.initVis = function() {
  var that = this;

  this.svg = this.parentElement.append("svg")
    .attr("width", this.width)
    .attr("height", this.height)
    .append("g")
    .attr("transform", "translate(" + that.width / 2 + "," + (that.height / 2) + ")");

  this.radius = Math.min(this.width/2, this.height/2);

  this.x = d3.scale.linear()
      .range([0, 2 * Math.PI]);

  this.y = d3.scale.linear()
      .range([0, this.radius]);

  // this.sunburst_colors = d3.scale.category20();

  this.partition = d3.layout.partition()
      .value(function(d) { return d.values.size; })
      .children(function(d){return d.values;})
      .size([2 * Math.PI, this.radius]);

  this.arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx - .01 / (d.depth + .5); })
    .innerRadius(function(d) { return that.radius / 3 * d.depth; })
    .outerRadius(function(d) { return that.radius / 3 * (d.depth + 1) - 1; });

     //http://bl.ocks.org/Caged/6476579
    this.tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0,0])
    .html(function(d) {
      var txt = d.key.split(".");
      return "<div><strong>{0}</strong><br>Quantity: {1}</di>".format(txt.join(","), d.size);
    });

    this.svg.call(this.tip);

    this.hue = d3.scale.category20();

    this.luminance = d3.scale.sqrt()
        .domain([0, 5])
        .clamp(true)
        .range([20, 90]);

    this.arcTween = function  (b) {
      var i = d3.interpolate(this._current, b);
      this._current = i(0);
      return function(t) {
        return that.arc(i(t));
      };
    }
};

// Sunburst.prototype.findRoot = function(){
//   var that = this;
//   var target = state.crime_filters.map(function(d){return d.value;}).reverse();
//   var tr = that.partition.nodes(this.data);
//   if(!(state.crime_filters == undefined || state.crime_filters.length == 0)){
//       var level = 0;
//       var i = 0;
//       while(true){
//         if(tr[i].key == target[level]){
//           if(level == target.length-1){
//             root = [tr[i]];
//             break;
//           } else {
//             tr = tr[i].values;
//             i = 0;
//             level++;
//           }
//         } else {
//           i++;
//         } 
//       }
//   } else {
//     root = tr;
//   }
//   return root;
// }

Sunburst.prototype.updateVis = function(){
   // Compute the initial layout on the entire tree to sum sizes.
    // Also compute the full name and fill color for each node,
    // and stash the children so they can be restored as we descend.
    var that = this;

    this.svg.selectAll("*").remove();

    that.partition
        .value(function(d) { return d.values.size; })
        .nodes(that.data)
        .forEach(function(d) {
          d._children = d.values;
          d.size = d.value;
          d.key = that.key(d);
          d.fill = that.fill(d);
        });

    // Now redefine the value function to use the previously-computed sum.
    that.partition
        .children(function(d, depth) { return depth < 4 ? d._children : null; })
        .value(function(d) { return d.size; });

    var center = that.svg.append("circle")
        .attr("r", that.radius / 3)
        .style("fill", "#FFCC44")
        .on("click", zoomOut);

    center.append("title")
        .text("zoom out");

    var r = that.findRoot();

    var path = that.svg.selectAll("path")
        .data(r.slice(1));
    path.exit().remove();
    path.enter().append("path")
        .classed("sunChunk", true);

    path.attr("d", that.arc)
        .style("fill", function(d) { 
          return d.fill; })
        .each(function(d) { 
          this._current = that.updateArc(d); })
        .on("click", zoomIn)
        .on("mouseover", this.tip.show)
        .on("mouseout", this.tip.hide);


    function custonClick(p){
      function getFilters(p){
        if(p != undefined){
              var s = p.key.split(".");
              if(s.length == 4)
                return s.slice(1,4).map(function(d,i){return {"key":that.depth_to_field[i+1], "value":d};}).reverse();
              else
                return s.map(function(d,i){return {"key":that.depth_to_field[(i+1)], "value":d};}).reverse();
        } else {
          return state.crime_filters.slice(1,4)
        }
      }
      
      state.set_crime(getFilters(p));
      var color = (p) ? p.fill : "black"
      $(that.eventHandler).trigger("selectionChanged", color);
    }

    function zoomIn(p) {
      if (p.depth > 1) p = p.parent;
      // if (!p.children) return;
      zoom(p, p);
      custonClick(p);
    }

    function zoomOut(p) {
      if(p == undefined){
        custonClick()
        var r = that.findRoot();
        zoom(r[0], r[0].values[1]);
        // that.updateVis();
        return;
      }
      if (!p.parent) return;
      zoom(p.parent, p);
      custonClick(p.parent);
    }

    // Zoom to the specified new root.
    function zoom(root, p) {
      if (document.documentElement.__transition__) return;

      // Rescale outside angles to match the new layout.
      var enterArc,
          exitArc,
          outsideAngle = d3.scale.linear().domain([0, 2 * Math.PI]);

      function insideArc(d) {
        return p.key > d.key
            ? {depth: d.depth - 1, x: 0, dx: 0} : p.key < d.key
            ? {depth: d.depth - 1, x: 2 * Math.PI, dx: 0}
            : {depth: 0, x: 0, dx: 2 * Math.PI};
      }

      function outsideArc(d) {
        return {depth: d.depth + 1, x: outsideAngle(d.x), dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x)};
      }

      center.datum(root);

      // When zooming in, arcs enter from the outside and exit to the inside.
      // Entering outside arcs start from the old layout.
      if (root === p) enterArc = outsideArc, exitArc = insideArc, outsideAngle.range([p.x, p.x + p.dx]);

      path = path.data(that.partition.nodes(root).slice(1), function(d) { return d.key; });

      // When zooming out, arcs enter from the inside and exit to the outside.
      // Exiting outside arcs transition to the new layout.
      if (root !== p) enterArc = insideArc, exitArc = outsideArc, outsideAngle.range([p.x, p.x + p.dx]);

      d3.transition().duration(d3.event.altKey ? 7500 : 750).each(function() {
        path.exit().transition()
            .style("fill-opacity", function(d) { return d.depth === 1 + (root === p) ? 1 : 0; })
            .attrTween("d", function(d) { return that.arcTween.call(this, exitArc(d)); })
            .remove();

        path.enter().append("path")
            .classed("sunChunk", true)
            .style("fill-opacity", function(d) { return d.depth === 2 - (root === p) ? 1 : 0; })
            .style("fill", function(d) { return d.fill; })
            .on("click", zoomIn)
            .each(function(d) { this._current = enterArc(d); });

        path.transition()
            .style("fill-opacity", 1)
            .attrTween("d", function(d) { return that.arcTween.call(this, that.updateArc(d)); });
        path
          .on("mouseover", that.tip.show)
          .on("mouseout", that.tip.hide)
      });
    }

}

Sunburst.prototype.key = function (d) {
  var k = [], p = d;
  while (p.depth) k.push(p.key), p = p.parent;
  return k.reverse().join(".");
}

Sunburst.prototype.fill = function  (d) {
  var p = d;
  while (p.depth > 1) p = p.parent;
  var c = d3.lab(this.hue(p.key));
  c.l = this.luminance(d.depth);
  return c;
}


Sunburst.prototype.updateArc=  function (d) {
  return {depth: d.depth, x: d.x, dx: d.dx};
}


// Sunburst.prototype.updateVis = function(){

//   var that = this;


//   if(this.sunburst_colors.domain().length == 0)
//     this.sunburst_colors.domain(that.data.values.map(function(d){return d.key}).sort())


//   function key(d) {
//     var k = [], p = d;
//     while (p.depth) k.push(p.name), p = p.parent;
//     return k.reverse().join(".");
//   }

//   function fill(d) {
//     var p = d;
//     while (p.depth > 1) p = p.parent;
//     var c = d3.lab(hue(p.name));
//     c.l = luminance(d.sum);
//     return c;
//   }

//   var getColor = function (d){
//       var top = getDepth(d, 1);
//       return (top.key != "Total") ? that.sunburst_colors(top.key) : "#FFCC44";
//   }
//   var getDepth = function (d, height) {
//       var top = d;
//       for(var i = d.depth; i > height; i--){
//         top = top.parent;
//       }
//       return top;
//   }

//   var findRoot = function(){
//     if((!state.crime_filters || state.crime_filters.length == 0))
//           return nodes[0];
//     var index = state.crime_filters.length-1;
//     var i = 1;
//     while(true){
//       if(nodes[i].depth == state.crime_filters.length && node[i].key == state.crime_filters[index].value)
//         return nodes[i];
//       i++;
//     }
//   }

//   function computeTextRotation(d) {
//     return (that.x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
//   }

//   var nodes = that.partition.nodes(that.data)      
//     .forEach(function(d) {
//         d._children = d.values;
//         d.key = key(d);
//         d.fill = fill(d);
//       });;

//   var root = findRoot();

//   var g = that.svg.datum(root).selectAll("g")
//       .data(that.partition.nodes);

//   g.exit().remove("*");

//   g.enter().append("g");

//   g.on("mouseover", this.tip.show)
//   .on("mouseout", this.tip.hide)

//   var path = g.append("path")
//       .attr("d", that.arc)
//       .style("fill", function(d) { return getColor(d); })
//       .style("stroke", "whitesmoke")
//       .style("stroke-width", .3)
//       .on("click", click)
//       .each(that.stash);

//   var text = g.append("text")
//     .attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
//     .attr("x", function(d) { return that.y(d.y); })
//     .attr("dx", "6") // margin
//     .attr("dy", ".35em") // vertical-align
//     .style("font-size", "9px")
//     .text(function(d) {
//       if(d.depth == that.level+1 || that.level == 3)
//         return d.key; 
//     });


//   function click(d){

//     that.level = d.depth; 
//     node = d;
//     path.transition()
//       .duration(500)
//       .attrTween("d", that.arcTweenZoom(d))

//     state.set_crime(getFilters(d, []));
//     $(that.eventHandler).trigger("selectionChanged", getColor(d));
//   }


// };

// // Setup for switching data: stash the old values for transition.
// Sunburst.prototype.stash = function(d) {
//   d.x0 = d.x;
//   d.dx0 = d.dx;
// }

// // When switching data: interpolate the arcs in data space.
// Sunburst.prototype.arcTweenData = function(a, i) {
//   var that = this;
//   var oi = d3.interpolate({x: a.x0, dx: a.dx0}, a);
//   function tween(t) {
//     var b = oi(t);
//     a.x0 = b.x;
//     a.dx0 = b.dx;
//     return that.arc(b);
//   }
//   if (i == 0) {
//    // If we are on the first arc, adjust the x domain to match the root node
//    // at the current zoom level. (We only need to do this once.)
//     var xd = d3.interpolate(that.x.domain(), [node.x, node.x + node.dx]);
//     return function(t) {
//       that.x.domain(xd(t));
//       return tween(t);
//     };
//   } else {
//     return tween;
//   }
// }

// // When zooming: interpolate the scales.
// Sunburst.prototype.arcTweenZoom = function (d) {
//   var that = this;
//   var xd = d3.interpolate(that.x.domain(), [d.x, d.x + d.dx]),
//       yd = d3.interpolate(that.y.domain(), [d.y, 1]),
//       yr = d3.interpolate(that.y.range(), [d.y ? 20 : 0, radius]);
//   return function(d, i) {
//     return i
//         ? function(t) { 
//           return that.arc(d); }
//         : function(t) { 
//           that.x.domain(xd(t)); that.y.domain(yd(t)).range(yr(t)); return that.arc(d); };
//   };
// }




// Sunburst.prototype.updateVis = function (){

//   var that = this;
//   var sunburst_colors = d3.scale.category20().domain(that.data.children.map(function(d){return d.name}).sort());
//   var getColor = function (d){
//     var top = getDepth(d, 1);
//     return (top.name != "Total") ? sunburst_colors(top.name) : "#FFCC44";
//   }
//   var getDepth = function (d, height) {
//       var top = d;
//       for(var i = d.depth; i > height; i--){
//         top = top.parent;
//       }
//       return top;
//   }

//   this.path = that.svg.datum.selectAll("path")
//         .data(that.partition.nodes(this.data));

//   this.path.enter().append("path")
//         .attr("class", "sun-path");

//   this.path.exit().remove()

//   this.path.attr("d", that.arc)
//         .style("stroke", "#eee")
//         .style("stroke-width", ".5")
//         .on("click", click)
//         .on("mouseover", this.tip.show)
//         .on("mouseout", this.tip.hide)


//   this.path.style("fill", getColor);

//       function click(d){
//         function getFilters(d, prev){
//           if(d.depth == 0){
//             return prev;
//           } else {
//             prev.push({"key":that.depth_to_field[d.depth], "value":d.name});
//             return getFilters(d.parent, prev);
//           }
//         }
        
//         that.path.transition()
//         .duration(750)
//         .attrTween("d", that.arcTween(d));
//         state.set_crime(getFilters(d, []));
//         $(that.eventHandler).trigger("selectionChanged", getColor(d));
//       }

//   d3.select(self.frameElement).style("height", this.height + "px");
// }

// // Interpolate the scales!
// Sunburst.prototype.arcTween = function(d) {
//   that = this;
//   var xd = d3.interpolate(that.x.domain(), [d.x, d.x + d.dx]),
//   yd = d3.interpolate(that.y.domain(), [d.y, 1]),
//   yr = d3.interpolate(that.y.range(), [d.y ? 20 : 0, radius]);
//   return function(d, i) {
//     return i
//         ? function(t) { return that.arc(d); }
//         : function(t) { that.x.domain(xd(t)); that.y.domain(yd(t)).range(yr(t)); return that.arc(d); };
//   };
// }



