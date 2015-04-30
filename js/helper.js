var areasMap = {
"rogers park": 1,
"west ridge": 2,
"uptown": 3,
"lincoln square": 4,
"north center": 5,
"lake view": 6,
"lincoln park": 7,
"near north side": 8,
"edison park": 9,
"norwood park": 10,
"jefferson park": 11,
"forest glen": 12,
"north park": 13,
"albany park": 14,
"portage park": 15,
"irving park": 16,
"dunning": 17,
"montclare": 18,
"belmont cragin": 19,
"hermosa": 20,
"avondale": 21,
"logan square": 22,
"humboldt park": 23,
"west town": 24,
"austin": 25,
"west garfield park": 26,
"east garfield park": 27,
"near west side": 28,
"north lawndale": 29,
"south lawndale": 30,
"lower west side": 31,
"loop": 32,
"near south side": 33,
"armour square": 34,
"douglas": 35,
"oakland": 36,
"fuller park": 37,
"grand boulevard": 38,
"kenwood": 39,
"washington park": 40,
"hyde park": 41,
"woodlawn": 42,
"south shore": 43,
"chatham": 44,
"avalon park": 45,
"south chicago": 46,
"burnside": 47,
"calumet heights": 48,
"roseland": 49,
"pullman": 50,
"south deering": 51,
"east side": 52,
"west pullman": 53,
"riverdale": 54,
"hegewisch": 55,
"garfield ridge": 56,
"archer heights": 57,
"brighton park": 58,
"mckinley park": 59,
"bridgeport": 60,
"new city": 61,
"west elsdon": 62,
"gage park": 63,
"clearing": 64,
"west lawn": 65,
"chicago lawn": 66,
"west englewood": 67,
"englewood": 68,
"greater grand crossing": 69,
"ashburn": 70,
"auburn gresham": 71,
"beverly": 72,
"washington heights": 73,
"mount greenwood": 74,
"morgan park": 75,
"ohare": 76,
"o'hare": 76,
"edgewater": 77};


var leap_years = [2004,
2008,
2012,
2016,
2020];

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function getId(d){
    return areasMap[d.properties.name.toLowerCase()]
}

function getReadableDate(d){
  return d.getMonth() + "/" + d.getDate() + "/" + d.getFullYear();
}


function isSame (array1, array2, name){
  var f;
  var compareCrimeFilters = function(element, index) {
      return element.key === array2[index].key && element.value === array2[index].value; 
  }

  var compareTimeFilters = function(element, index){
    return element.getTime() == array2[index].getTime();
  }

  if(name == "time"){
    f = compareTimeFilters;
  } else {
    f = compareCrimeFilters;
  }

  return (array1.length == array2.length) && array1.every(f);
}

function binarySearch(arr, el, compare_fn){
  var m = 0;
  var n = arr.length - 1;
  while(m<=n){
    var k = (m + n) >> 1;
    var cmp = compare_fn(el, arr[k]);
    if (cmp > 0) {
      m = k + 1;
    } else if(cmp < 0) {
      n = k - 1;
    } else {
      return k;
    }
  }
  return -1;
}