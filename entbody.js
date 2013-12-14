// all of the global variables for dynamics
var x=[];
var y=[];
var vx=[];
var vy=[];
var fx=[];
var fy=[];
var r=[];
var type=[];
var ivor=[];
var ivoravg;

var flick_goal = 40;
var flick_speed = 1e-3;
var flick_noise = 6e3;
var flick = flick_goal;

// things we can change
var n = 5;

// neighborlist stuff
var lx, ly;
var size = [0,0];
var NMAX = 50;
var cells = [];
var count = [];

var radius = 1.0;
var R = 2*radius;
var gdt = 0.1;

// the variables we change
var epsilon = 100;
var noise   = 0.0;

// some other constants that are 1
var vhappy = 0.0;
var damp   = 0.3;
var frac   = 0.01;

// display variables
var c;
var ctx;
var empty;
var frame = 0;
var keys = [0,0,0,0];
var frameskip = 2;
var dodraw = true;
var docircle = true;
var showforce = true;

function rgb(r,g,b) {
    return 'rgb('+r+','+g+','+b+')';
}

function update(){
    for (var i=0; i<n; i++) {
        fx[i] = 0.0; 
        fy[i] = 0.0;

        for (var j=0; j<n; j++){
            if (i==j) continue;
            
            var dx = x[j] - x[i];
            var dy = y[j] - y[i];
            var l = Math.sqrt(dx*dx + dy*dy);
            if (l > 1e-6 && l < R){
                var r0 = (r[i]+r[j]);
                var f = (1-l/r0);
                var c0 = -epsilon * f*f * (l<r0);
                fx[i] += c0*dx;
                fy[i] += c0*dy;
            }
        }
        var vlen = (vx[i]*vx[i] + vy[i]*vy[i]);
        if (vlen > 1e-6){
            fx[i] += -damp*vlen*vx[i]/vlen;
            fy[i] += -damp*vlen*vy[i]/vlen;
        }

        if (type[i] == 1){
            if (keys[0] == 1) {fy[i] -= 5.0;}
            if (keys[1] == 1) {fy[i] += 5.0;}
            if (keys[2] == 1) {fx[i] -= 5.0;}
            if (keys[3] == 1) {fx[i] += 5.0;}
        }
    }

    for (var i=0; i<n; i++){
        vx[i] += fx[i] * gdt;
        vy[i] += fy[i] * gdt;

        var vmax = 1.0;
        if (vx[i] > vmax)  vx[i] = vmax;
        if (vx[i] < -vmax) vx[i] = -vmax;
        if (vy[i] > vmax)  vy[i] = vmax;
        if (vy[i] < -vmax) vy[i] = -vmax;

        x[i] += vx[i] * gdt;
        y[i] += vy[i] * gdt;
    
        if (x[i] >= lx){x[i] = 2*lx-x[i]; vx[i] *= -1;}
        if (x[i] < 0)  {x[i] = -x[i];     vx[i] *= -1;}
        if (y[i] >= ly){y[i] = 2*ly-y[i]; vy[i] *= -1;}
        if (y[i] < 0)  {y[i] = -y[i];     vy[i] *= -1;}
    }
}

function draw_all(x, y, r, lx, ly, cw, ch, ctx, ctx2) {
    var sx = cw/lx;
    var sy = ch/ly;
    var ss = Math.sqrt(sx*sy);
    for (var i=0; i<x.length; i++) {
        var indx = Math.floor(x[i]/lx * size[0]);
        var indy = Math.floor(y[i]/ly * size[1]);
        ctx.beginPath();
        ctx.arc(sx*x[i], sy*y[i], ss*r[i], 0, 2*Math.PI, true);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";
        ctx.stroke();

        var cr,cg,cb;
        if (type[i] == 0){
            if (showforce == true){
                cr = 180;
                cg = 180;
                cb = 180;
            } else {
                cr = 50;
                cg = 50;
                cb = 50;
            }
        } else {
            cr = 255;
            cg = 0;
            cb = 0;
        }
        ctx.fillStyle = rgb(cr,cg,cb);
        ctx.fill();
    }

    flick = flick + flick_speed * (flick * ( flick_goal - flick) + flick_noise * (2*Math.random()-1));

    flick = Math.min(flick, 100);
    flick = Math.max(flick, 30);

    var radgrad = ctx.createRadialGradient(sx*x[0], sy*y[0], 0, sx*x[0], sy*y[0], flick);
    radgrad.addColorStop(0, 'rgba(150,0,0,0.0)');
    radgrad.addColorStop(0.5, 'rgba(0,0,0,150)');
    radgrad.addColorStop(1, 'rgba(0,0,0,255)');
    ctx2.fillStyle = radgrad;
    ctx2.fillRect(0,0,c.height,c.width);
}

function init_sidelength(L){
    lx = L;//
    ly = lx;

    /* initialize the neighborlist */
    size[0] = Math.floor(lx / R);
    size[1] = Math.floor(ly / R);
    for (var i=0; i<size[0]*size[1]*NMAX; i++){
        cells[i] = 0;
    }
    for (var i=0; i<size[0]*size[1]; i++){
        count[i] = 0;
    }
}    


function init_empty(){
    r = [];
    x = [];
    y = [];
    vx = [];
    vy = [];
    type = [];

    for (var i=0; i<n; i++) {
        r.push(0.0);
        x.push(0.0);
        y.push(0.0);
        type.push(0);
        vx.push(0.0);
        vy.push(0.0);
        fx.push(0.0);
        fy.push(0.0);
    }
}

function init_circle(){
    for (var i=0; i<n; i++) {
        var tx = lx*Math.random();
        var ty = ly*Math.random();
        var tt = 2*Math.PI*Math.random();

        type[i] = 0;
        r[i] = radius;
        x[i] = tx;
        y[i] = ty;
        var dd = Math.sqrt((tx-lx/2)*(tx-lx/2) + (ty-ly/2)*(ty-ly/2));
        var rad = Math.sqrt(frac*lx*ly/Math.PI);
        if (docircle==true){
            if (frac==0.01){type[0] =1;} 
            else if (frac==1.0) {type[i] = 1;}
            else { if (dd<rad){ type[i] = 1; }else{ type[i] = 0; } }
        } else {
            if (frac==0.01){type[0] =1;} 
            else if (frac==1.0) {type[i] = 1;}
            else { if (Math.random() < frac){ type[i] = 1;} else {type[i]=0;} }
        }
        vx[i] = vhappy*(Math.random()-0.5);
        vy[i] = vhappy*(Math.random()-0.5);
    }
}

function update_pause(){
    if (dodraw == true){
        dodraw = false;
    } else {
        requestAnimationFrame(tick, c);
        dodraw = true;
    }
}

/*===============================================================================
    initialization and drawing 
================================================================================*/
var tick = function(T) {
    if (dodraw == true) {
        ctx.fillStyle = 'rgba(200,200,200,0.2)';
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillRect(0,0,c.width,c.height);
        ctx2.fillStyle = 'rgba(0,0,0,0.0)';
        ctx2.clearRect(0, 0, c.width, c.height);
        ctx2.fillRect(0,0,c.width,c.height);
        for (var i=0; i<frameskip; i++){
            frame++;
            update();
        }
 
        draw_all(x, y, r, lx, ly, c.width, c.height, ctx, ctx2);
        requestAnimationFrame(tick, c);
    }
};


var init = function() {
    // create the canvas element
    empty = document.createElement('canvas');
    empty.width = empty.height = 1;
    c = document.getElementById('canvas');
    c2 = document.getElementById('canvas2');
    c.style.cursor = 'url('+empty.toDataURL()+')';
    c2.style.cursor = 'url('+empty.toDataURL()+')';
    ctx = c.getContext('2d');
    ctx2 = c2.getContext('2d');

    init_empty();
    init_sidelength(50);
    init_circle(frac);

    document.body.addEventListener('keyup', function(ev) {
        if (ev.keyCode == 87){ keys[0] = 0; } //up
        if (ev.keyCode == 83){ keys[1] = 0; } //down
        if (ev.keyCode == 65){ keys[2] = 0; } //left
        if (ev.keyCode == 68){ keys[3] = 0; } //right
        if (ev.keyCode == 32){ ev.preventDefault(); update_pause(); } //space is pause
    }, false);

    document.body.addEventListener('keydown', function(ev) {
        if (ev.keyCode == 87){ keys[0] = 1; } //up
        if (ev.keyCode == 83){ keys[1] = 1; } //down
        if (ev.keyCode == 65){ keys[2] = 1; } //left
        if (ev.keyCode == 68){ keys[3] = 1; } //right
    }, false);

    registerAnimationRequest();
    requestAnimationFrame(tick, c);
};
window.onload = init;


// Provides requestAnimationFrame in a cross browser way.
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
function registerAnimationRequest() {
if ( !window.requestAnimationFrame ) {
    window.requestAnimationFrame = ( function() {
      return window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps)
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
              window.setTimeout( callback, 32 ); /*1000 / 60 );*/
      };
    } )();
}
}

