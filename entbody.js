// all of the global variables for dynamics
var x=[];
var y=[];
var vx=[];
var vy=[];
var fx=[];
var fy=[];
var r=[];
var ivor=[];
var ivoravg;

var flick_goal = 30.;
var flick_speed = 5e-4;
var flick_noise = 6e3;
var flick = flick_goal;
var flick_min = 30;
var flick_max = 1e8;
var flick_dark = 1.0;


// sizes
var LX = 640;
var LY = 400;

var INITX = [70,70,140,330,300,150,330,450,330];
var INITY = [350,150,100,200,240,50,200,300,300];
var type = [1,2,2,2,2,3,3,3,3];
var n = 9;
// guy = 1 / sleeping = 2 / walking = 3

var radius = 5.0;
var R = 2*radius;
var gdt = 0.05;
var time = 0;

// Monster params
var monster_cutoff2 = 4*radius*radius;
var walking_speed = 4e2;
var sleeper_r2 = 30.*30.;
var sleeper_force_mag = 0.2;
var sleeper_max_v2 = 4*4;



// the variables we change
var epsilon = 100;
var noise   = 0.0;

// some other constants that are 1
var damp   = 0.3;

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

// items
var num_light_bomb = 1e2;
var num_crumb = 1e2;
var crumb_radius = 2.0;
var crumb_flick_goal = 20.0;

var crumbx = [];
var crumby = [];
var crumbflick = [];

function rgb(r,g,b) {
    return 'rgb('+r+','+g+','+b+')';
}

var pangle = Math.atan2(-1, 0);

var audio_curr;
var audio_playing;
var audio_next_time;
var audio_list;

var audio_danger = false;
var audio_effects;
var togglemusic = false;
var playmusic = true;
var music;
var lightswitch;

var NLAVA = 30;
var audio_lava_list;

var NSTEPS = 4;
var audio_steps;
var step_size = radius*4;
var last_step = [0,0,0];

var audio_crumb;
var audio_lightbomb;

function audio_init(){
    audio_curr = new Array(n);
    audio_playing = new Array(n);
    audio_next_time = new Array(n);
    audio_list = new Array(n);

    audio_effects = [[], [], 
        [
            'sounds/monster_deep1.mp3',
            'sounds/monster_deep2.mp3',
            'sounds/monster_deep3.mp3',
        ], 
        [
            'sounds/monster_growl1.mp3',
            'sounds/monster_growl2.mp3',
            'sounds/monster_growl3.mp3',
            'sounds/monster_growl4.mp3',
            'sounds/monster_growl5.mp3',
        ], 
        [
            'sounds/monster_deep1.mp3',
            'sounds/monster_deep2.mp3',
            'sounds/monster_deep3.mp3',
            'sounds/monster_growl3.mp3',
            'sounds/monster_growl4.mp3',
            'sounds/monster_growl5.mp3',
        ]
        ];

    for (var i=1; i<n; i++){
        audio_list[i] = new Array();
        for (var j=0; j<audio_effects[type[i]].length; j++){
            audio_list[i].push(new Howl(
                {urls: [audio_effects[type[i]][j]],
                 onend: (function(i) {
                     return function(){
                        var relx = x[i] - x[0]; 
                        var rely = y[i] - y[i];
                        var dist = relx*relx + rely*rely;
                        audio_playing[i] = 0;
                        audio_next_time[i] = Math.min(
                            time + Math.sqrt(dist*Math.random()),
                            30);
                        audio_curr[i] = Math.floor(
                            audio_effects[type[i]].length*Math.random()
                        );
                    };
                   })(i)
                }
            ));
        }
        audio_playing[i] = 0;
        audio_next_time[i] = 0;
        audio_curr[i] = 0;
    }


    audio_steps = new Array(NSTEPS);
    for (var i=0; i<NSTEPS; i++){
        audio_steps[i] = new Howl({
            urls: ['sounds/step_'+(i+1)+".mp3"],
            autoplay: false,
            loop: false,
            volume: 0.15,
        });
    }

    music = new Howl({
        urls: ['sounds/music_slow.mp3'],
        autoplay: false,
        loop: true,
        volume: 0.25,
        buffer: true,
        onend: function() {}
    });
    music.play();

    lightswitch = new Howl({
        urls: ['sounds/lightswitch.mp3'],
        autoplay: false,
        loop: false
    });
    lightswitch.play();

    audio_crumb = new Howl({
        urls: ['sounds/crumb.mp3'],
        autoplay: false,
        loop: false
    });
    audio_lightbomb = new Howl({
        urls: ['sounds/lightbomb.mp3'],
        autoplay: false,
        loop: false
    });
}


function audio_lava_points(img){
    audio_lava_list = new Array();

    while (audio_lava_list.length < NLAVA){
        tx = Math.floor(LX*Math.random());
        ty = Math.floor(LY*Math.random());
        if (is_level_lava(tx, ty))
            audio_lava_list.push([tx, ty, new Howl({
                    urls: ['sounds/lava2.mp3'],
                    autoplay: true,
                    loop: true,
                    volume: 0.0,
                    buffer: true,
                })
            ]);
    }
}

function pause_lava(){
    for (var i=0; i<NLAVA; i++){
        audio_lava_list[i][2].pause();
    }
}

function unpause_lava(){
    for (var i=0; i<NLAVA; i++){
        audio_lava_list[i][2].play();
    }
}

function audio_sound_relative(){
    for (var i=1; i<n; i++){
        if (audio_playing[i]){
            var relx = x[i] - x[0];
            var rely = y[i] - y[0];

            var dist2 = relx*relx + rely*rely;
            var rangle = Math.atan2(rely, relx);

            audio_list[i][audio_curr[i]].pos3d(-0.5*Math.sin(pangle-rangle), 0, 0);
            audio_list[i][audio_curr[i]].volume(16*(radius*radius / dist2));
        }
    }
}

function audio_sound_update(){
    if (togglemusic){
        if (playmusic){
            playmusic = false;
            music.pause();
        } else {
            playmusic = true;
            music.play();
        }
        togglemusic = false;
    }

    for (var i=1; i<n; i++){
        if (time > audio_next_time[i] && audio_playing[i] == 0){
            audio_playing[i] = 1;
            audio_list[i][audio_curr[i]].play();
        }
    }

    for (var i=0; i<audio_lava_list.length; i++){
        var relx = audio_lava_list[i][0] - x[0];
        var rely = audio_lava_list[i][1] - y[0];

        var dist2 = relx*relx + rely*rely;
        var rangle = Math.atan2(rely, relx);

        audio_lava_list[i][2].pos3d(-0.5*Math.sin(pangle-rangle), 0, 0);
        audio_lava_list[i][2].volume(3*(radius*radius / dist2));
    }
}

var img;
var levelcanvas;
var levelctx;
var imgd;

function init_level() {
  /// initialize the level layer
  levelcanvas = document.getElementById('level');
  levelctx = levelcanvas.getContext('2d');
  img = document.getElementById('testlevel');
  levelctx.drawImage(img,0,0);
  imgd = levelctx.getImageData(0,0,LX,LY).data;
  audio_lava_points(imgd);
}


function load_level() {
  // Load the level onto the canvas
  levelctx.drawImage(img,0,0);
}

function game_over() {
    // Game is over
    update_pause();
    alert('GAME OVER');
    init_empty();
    x[0] = INITX[0];
    y[0] = INITY[0];
    vx[0] = 0.;
    vy[0] = 0.;
    fx[0] = 0.;
    fy[0] = 0.;
    keys[0] = keys[1] = keys[2] = keys[3] = 0;
    setTimeout(update_pause,10);
}

function game_won() {
    alert("You won!");
}

function is_level_wall(xx,yy) {
  var i = 4*Math.floor(xx) + 4*LX*Math.floor(yy);
  if (imgd[i] == 0 && imgd[i+1] ==0 && imgd[i+2] == 0) {
      return true;
  }
  return false;
}

function is_level_lava(xx,yy) {
  var i = 4*Math.floor(xx) + 4*LX*Math.floor(yy);
  if (imgd[i] == 255 && imgd[i+1] ==0 && imgd[i+2] == 0) {
      return true;
  }
  return false;
}

function is_monster(xx,yy) {
    for (var i=1; i<n; i++) {
       if ((x[i]-x[0])*(x[i]-x[0])+(y[i]-y[0])*(y[i]-y[0]) < monster_cutoff2) {
           return true;
       }
    }
    return false;
}

function is_game_over(xx,yy) {
    if (is_level_lava(xx,yy)) return true;
    if (is_monster(xx,yy)) return true;
    return false;
}

function is_game_won(xx,yy) {
  var i = 4*Math.floor(xx) + 4*LX*Math.floor(yy);
  if (imgd[i] == 95 && imgd[i+1] == 0 && imgd[i+2] == 255) {
      return true;
  }
  return false;
}

// ITEMS

function use_light_bomb() {
    if (num_light_bomb > 0) {
        flick = 0.5*1./flick_speed;
        num_light_bomb -= 1;
    }
    audio_lightbomb.play();
}


function use_crumb() {
    if (num_crumb > 0) {
        crumbx.push(x[0]);
        crumby.push(y[0]);
        crumbflick.push(crumb_flick_goal);
        num_crumb -= 1;
    }
    audio_crumb.play();
}


function update(){
    audio_sound_update();
    audio_sound_relative();

    time += gdt;
    for (var i=0; i<n; i++) {
        fx[i] = 0.0; 
        fy[i] = 0.0;

        // damping
        var vlen = (vx[i]*vx[i] + vy[i]*vy[i]);
        if (vlen > 1e-6 && type[i] != 3){
            fx[i] += -damp*vlen*vx[i]/vlen;
            fy[i] += -damp*vlen*vy[i]/vlen;
        }

        // if it is our guy
        if (type[i] == 1){
            if (keys[0] == 1) {fy[i] -= 5.0;}
            if (keys[1] == 1) {fy[i] += 5.0;}
            if (keys[2] == 1) {fx[i] -= 5.0;}
            if (keys[3] == 1) {fx[i] += 5.0;}
        }

        // if it is a walking monster
        if (type[i] == 3 && vlen < 1e-1) {
            fx[i] += walking_speed*(2*Math.random()-1)*(2*Math.random()-1)*(2*Math.random()-1);
            fy[i] += walking_speed*(2*Math.random()-1)*(2*Math.random()-1)*(2*Math.random()-1);
        }

        // if it is a sleeper
        if (type[i] == 2) {
            // check to see if we are in range
            if ((x[i]-x[0])*(x[i]-x[0])+(y[i]-y[0])*(y[i]-y[0]) < sleeper_r2) {
                // give it a force towards the guy
                fx[i] = -sleeper_force_mag * (x[i] - x[0]);
                fy[i] = -sleeper_force_mag * (y[i] - y[0]);
                
                var vlen = (vx[i]*vx[i] + vy[i]*vy[i]);
                if (vlen > sleeper_max_v2) {
                    vx[i] = sleeper_max_v2/vlen * vx[i];
                    vy[i] = sleeper_max_v2/vlen * vy[i];
                }
            }
        }
    }

    var laststep = Math.sqrt((last_step[0] - x[0])*(last_step[0] - x[0]) +
                (last_step[1] - y[0])*(last_step[1] - y[0]));
    if (laststep > step_size){
        audio_steps[last_step[2]].play();
        last_step[0] = x[0];
        last_step[1] = y[0];
        last_step[2] = (last_step[2]+1) % NSTEPS;
    }

    // Do the time step integration
    for (var i=0; i<n; i++){
        vx[i] += fx[i] * gdt;
        vy[i] += fy[i] * gdt;

        var vmax = 30.0;
        if (vx[i] > vmax)  vx[i] = vmax;
        if (vx[i] < -vmax) vx[i] = -vmax;
        if (vy[i] > vmax)  vy[i] = vmax;
        if (vy[i] < -vmax) vy[i] = -vmax;

        x[i] += vx[i] * gdt;
        y[i] += vy[i] * gdt;
        
        if (is_level_wall(x[i],y[i])) {
            x[i] -= vx[i] * gdt;
            y[i] -= vy[i] * gdt;
            vx[i] = 0;
            vy[i] = 0;
        }
    
        if (x[i] >= LX){x[i] = 2*LX-x[i]; vx[i] *= -1;}
        if (x[i] < 0)  {x[i] = -x[i];     vx[i] *= -1;}
        if (y[i] >= LY){y[i] = 2*LY-y[i]; vy[i] *= -1;}
        if (y[i] < 0)  {y[i] = -y[i];     vy[i] *= -1;}

    }

    if (is_game_over(x[0],y[0])) {
        game_over();
    }
    if (is_game_won(x[0],y[0])) {
        game_won();
    }
}

function draw_all(x, y, r, LX, LY, ctx, ctx2) {
    load_level();

    for (var i=0; i<x.length; i++) {
        var indx = Math.floor(x[i]/LX);
        var indy = Math.floor(y[i]/LY);
        ctx.beginPath();
        ctx.arc(x[i], y[i], r[i], 0, 2*Math.PI, true);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";
        ctx.stroke();

        var cr,cg,cb;
        if (type[i] == 1){
            // our guy
            cr = 250;
            cg = 0;
            cb = 0;
        } else if (type[i] == 2) {
            // sleeping
            cr = 0;
            cg = 255;
            cb = 255;
        } else {
            cr = 255;
            cg = 255;
            cb = 0;
        }
        ctx.fillStyle = rgb(cr,cg,cb);
        ctx.fill();
    }

    // draw text
    ctx3.clearRect(0,0,LX,LY);
    ctx3.fillStyle = rgb(255,255,255);
    ctx3.fillText("lightbombs:" + num_light_bomb + ' crumbs:' + num_crumb, 5, LY-5);

    flick = flick + flick_speed * (flick * ( flick_goal - flick) + flick_noise * (2*Math.random()-1)*(2*Math.random()-1)*(2*Math.random()-1));

    flick = Math.min(flick, flick_max);
    flick = Math.max(flick, flick_min);

    ctx2.globalCompositeOperation = 'source-over';
    ctx2.fillStyle = rgb(0,0,0);
    ctx2.fillRect(0,0,LX,LY);
    draw_gauss(flick, x[0], y[0]);
    draw_crumbs();
    ctx2.globalCompositeOperation = 'source-over';
}


function draw_gauss(flick,xx,yy) {
    ctx2.globalCompositeOperation = 'destination-out';
    var radgrad = ctx2.createRadialGradient(xx, yy, 0, xx, yy, flick);
    radgrad.addColorStop(0, 'rgba(0,0,0,1.0)');
    // GRADIENT
    radgrad.addColorStop(0.5, 'rgba(0,0,0,0.5)');
    radgrad.addColorStop(1, 'rgba(0,0,0,0.0)');
    ctx2.fillStyle = radgrad;
    ctx2.fillRect(xx-flick-1,yy-flick-1,2*flick+2,2*flick+2);
}

function draw_crumbs() {
    for (var i=0; i<crumbx.length; i++) {
        crumbflick[i] = crumbflick[i] + flick_speed * (crumbflick[i] * ( crumb_flick_goal - crumbflick[i]) + flick_noise * (2*Math.random()-1)*(2*Math.random()-1)*(2*Math.random()-1));
        draw_gauss(crumbflick[i], crumbx[i], crumby[i]);
        ctx2.globalCompositeOperation = 'source-over';
        ctx2.fillStyle = rgb(0,255,0);
        ctx2.beginPath();
        ctx2.arc(crumbx[i], crumby[i], crumb_radius, 0, 2*Math.PI, true);
        ctx2.lineWidth = 1;
        ctx2.strokeStyle = "#00FF00";
        ctx2.stroke();
        ctx2.fill();
    }
}

function init_empty(){
    r = [];
    x = [];
    y = [];
    vx = [];
    vy = [];

    for (var i=0; i<n; i++) {
        r.push(radius);
        x.push(INITX[i]);
        y.push(INITY[i]);
        vx.push(0.0);
        vy.push(0.0);
        fx.push(0.0);
        fy.push(0.0);
    }

    crumbx = [];
    crumby = [];
    crumbflick = [];
}


function update_pause(){
    if (dodraw == true){
        dodraw = false;
        music.pause();
        pause_lava();
    } else {
        requestAnimationFrame(tick, c);
        dodraw = true;
        music.play();
        unpause_lava();
    }
}

/*===============================================================================
    initialization and drawing 
================================================================================*/
var tick = function(T) {
    if (dodraw == true) {
        ctx.fillStyle = 'rgba(200,200,200,0.0)';
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillRect(0,0,c.width,c.height);
        ctx2.fillStyle = 'rgba(0,0,0,0.0)';
        ctx2.clearRect(0, 0, c.width, c.height);
        ctx2.fillRect(0,0,c.width,c.height);
        draw_all(x, y, r, LX, LY, ctx, ctx2);
        for (var i=0; i<frameskip; i++){
            frame++;
            update();
        }
 
        requestAnimationFrame(tick, c);
    }
};


var init = function() {
    // create the canvas element
    empty = document.createElement('canvas');
    empty.width = empty.height = 1;
    c = document.getElementById('canvas');
    c2 = document.getElementById('light');
    c3 = document.getElementById('text');
    c.style.cursor = 'url('+empty.toDataURL()+')';
    c2.style.cursor = 'url('+empty.toDataURL()+')';
    c3.style.cursor = 'url('+empty.toDataURL()+')';
    ctx = c.getContext('2d');
    ctx2 = c2.getContext('2d');
    ctx3 = c3.getContext('2d');

    audio_init();
    init_empty();
    init_level();

    document.body.addEventListener('keyup', function(ev) {
        if (ev.keyCode == 87){ keys[0] = 0; } //up
        if (ev.keyCode == 83){ keys[1] = 0; } //down
        if (ev.keyCode == 65){ keys[2] = 0; } //left
        if (ev.keyCode == 68){ keys[3] = 0; } //right
        if (ev.keyCode == 32){ ev.preventDefault(); update_pause(); } //space is pause
        if (ev.keyCode == 66){ playsound(); }
        if (ev.keyCode == 77){ togglemusic = true; }
        if (ev.keyCode == 49){ use_light_bomb(); }
        if (ev.keyCode == 50){ use_crumb(); }
        // else { console.log(ev.keyCode) }
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
      // window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps)
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
              window.setTimeout( callback, 32 ); /*1000 / 60 );*/
      };
    } )();
}
}

