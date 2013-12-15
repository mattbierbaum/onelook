var ai_waypoints;
var ai_next_lookup_time;
var ai_path;

function node(index, pos, neigh){
    this._index = index;
    this._pos = pos;
    this._neigh = neigh;
}

function path(indices, cost, dist){
    this._cost = cost;
    this._indices = indices;
    this._dist = dist;
}

function ai_build_graph(img, lx, ly){
    var index = 0;
    ai_waypoints = new Array();

    for (var i=0; i<lx; i++){
        for (var j=0; j<ly; j++){
             var d = 4*Math.floor(i) + 4*LX*Math.floor(j);
            if (img[d] == 250 && img[d+1] == 250 && img[d+2] == 250){
                ai_waypoints.push(new node(index, [i,j], new Array()));
                index += 1;
            }
        }
    }

    for (var i=0; i<ai_waypoints.length; i++){
        for (var j=i+1; j<ai_waypoints.length; j++){
            var x0 = ai_waypoints[i]._pos[0];
            var x1 = ai_waypoints[j]._pos[0];
            var y0 = ai_waypoints[i]._pos[1];
            var y1 = ai_waypoints[j]._pos[1];

            var dist = Math.sqrt((x0-x1)*(x0-x1) + (y0-y1)*(y0-y1));
            if (dist < 50) {
                ai_waypoints[i]._neigh.push([j, dist]);
                ai_waypoints[j]._neigh.push([i, dist]);
            }
        }
    }
}

function ai_sorted_index_min(list, element){
    var imin = 0;
    var imax = list.length-1;

    while (imin < imax){
        var mid = imin + (imax - imin)/2;

        if (list[imid].cost < element)
            imin = imid + 1;
        else
            imax = imid;
    }

    if (imax < imin) return 0;

    if (list[imin].cost < element)
        return imin;
    return imin + 1;
}

function ai_path(start, end, lx, ly){
    var open = new Array();
    var closed = new Array();

    var minind = 0;
    var mindist = Math.sqrt(lx*lx + ly*ly); 
    for (var i=0 i<ai_waypoints.length; i++){
        var x0 = ai_waypoints[i]._pos[0];
        var y0 = ai_waypoints[i]._pos[1];
        var dist = Math.sqrt((x0-start[0])*(x0-start[0]) + (x1-start[1])*(x1-start[1]));

        if (dist < mindist){
            mindist = dist;
            minind = i;
        }
    }

    open.push(new path(new Array([minind]), 0, mindist));

    while (open.length > 0 && open[0].dist > 50){
        var current = open.shift();

    }

}



