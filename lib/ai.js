
function ai_find_closest(nodes, pos, lx, ly){
    var minind = 0;
    var mindist = Math.sqrt(lx*lx + ly*ly);
    for (var i=0; i<nodes.length; i++){
        var x0 = nodes[i].pos.x;
        var y0 = nodes[i].pos.y;

        var dist = Math.sqrt((x0-pos[0])*(x0-pos[0]) + (y0-pos[1])*(y0-pos[1]));

        if (dist < mindist){
            mindist = dist;
            minind = i;
        }
    }

    return nodes[minind];
}

function ai_find_path(start, end, nodes, lx, ly){
    var startnode = ai_find_closest(nodes, start, lx, ly);
    var endnode = ai_find_closest(nodes, end, lx, ly);

    return astar.search(nodes, startnode, endnode, false, astar.manhattan); 
}

var ai_waypoints;
var ai_elem;
var ai_ctx;

var ai_paths;
var ai_next_time;
var ai_monsters;
var offset;

var ai_last_move;
var ai_stuck;

function ai_init(imgd, LX, LY, types, n){
    //console.log("ai_init");
    ai_waypoints = new Graph(imgd, LX, LY);

    ai_elem = document.getElementById('path');
    ai_elem.style.cursor = 'url(' + empty.toDataURL() + ')';

    ai_ctx = ai_elem.getContext('2d');
    ai_ctx.fillStyle = 'rgba(0,0,0,1.0)';
    ai_ctx.clearRect(0, 0, ai_elem.width, ai_elem.height);

    ai_stuck = new Array();
    ai_last_move = new Array();

    ai_paths = new Array();
    ai_next_time = new Array();
    ai_monsters = new Array();
    offset = new Array();

    for (var i=0; i<n; i++){
        if (types[i] == 4){
            ai_monsters.push(i);
            ai_next_time.push(0);
            ai_paths.push([]);
            offset.push(Math.random() * 2*Math.PI);
            ai_last_move.push([0,0,0]);
        }
    }
}

function drawcircle(x,y,r,alpha){
    ai_ctx.beginPath();
    ai_ctx.arc(x,y,r, 0, 2*Math.PI, true);
    ai_ctx.lineWidth = 0;
    ai_ctx.strokeStyle = "#000000";
    ai_ctx.stroke();

    ai_ctx.fillStyle = 'rgba(255, 0, 0,'+alpha+')';
    ai_ctx.fill();
}

function ai_draw(x,y, time){
    ai_ctx.clearRect(0, 0, ai_elem.width, ai_elem.height);
    //for (var i=0; i<ai_monsters.length; i++){
    //    for (var j=0; j<ai_paths[i].length; j++)
    //        drawcircle(ai_paths[i][j].pos.x, ai_paths[i][j].pos.y, 1, 1);
    //}

    for (var i=0; i<ai_monsters.length; i++){
        draw_sprite_rotated(sprite_tracker, x[ai_monsters[i]], y[ai_monsters[i]],
            angle_from_v(vx[ai_monsters[i]], vy[ai_monsters[i]]), 
            Math.sin(time/4.0+offset[i]));
        drawcircle(x[ai_monsters[i]], y[ai_monsters[i]], 2, Math.sin(time/4.0 + offset[i])); 
    }
}

var SPEED = 7.5;

function ai_update(x, y, vx, vy, time, lx, ly){
    for (var i=0; i<ai_monsters.length; i++){
        var mx = x[ai_monsters[i]];
        var my = y[ai_monsters[i]];

        var mvx = vx[ai_monsters[i]];
        var mvy = vy[ai_monsters[i]];
        var vlen = Math.sqrt(mvx*mvx + mvy*mvy);

        var tx = mx-x[0];
        var ty = my-y[0];
        var gdist = Math.sqrt(tx*tx + ty*ty);

        if (ai_stuck[i]){
            if (time - ai_last_move[i][0] > 10)
                ai_stuck[i] = false;

            vx[ai_monsters[i]] = 4*SPEED * (2*Math.random() - 1);
            vy[ai_monsters[i]] = 4*SPEED * (2*Math.random() - 1);
        }
        else {
            if (gdist < 50){
                //console.log("1");
                ai_paths[i] = new Array();
                vx[ai_monsters[i]] = -SPEED * tx / gdist;
                vy[ai_monsters[i]] = -SPEED * ty / gdist;
            } else {
                if (vlen > 1e-4){
                    ai_last_move[i][0] = time;
                    ai_last_move[i][1] = mvx;
                    ai_last_move[i][2] = mvy;
                }

                //console.log("len "+ai_paths[i].length);
                if (ai_paths[i].length > 0){
                    var dx = mx - ai_paths[i][0].x;
                    var dy = my - ai_paths[i][0].y;
                    var dist = Math.sqrt(dx*dx + dy*dy);
                    vx[ai_monsters[i]] = -SPEED * dx/dist;
                    vy[ai_monsters[i]] = -SPEED * dy/dist;

                    if (dist < 0.1){
                        //console.log("shift");
                        ai_paths[i].shift();
                    }
                } else {
                    //console.log("this one");
                    ai_paths[i] = ai_find_path([mx, my], [x[0], y[0]], ai_waypoints.nodes, lx, ly);
                }

                if (time > ai_next_time[i]){
                    //console.log("next time");
                    ai_paths[i] = ai_find_path([mx, my], [x[0], y[0]], ai_waypoints.nodes, lx, ly);
                    ai_next_time[i] = time + gdist / SPEED / 6;
                }

                if ((time - ai_last_move[i][0]) > 1){
                    ai_stuck[i] = true;
                }
            }
        }
    }
}


