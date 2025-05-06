// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite;

// create an engine
var engine = Engine.create();
engine.gravity.y = 0


// create a renderer
var render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        background: "rgb(118,155,118)",
        wireframes: false // <-- important
    }
});

Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);

//mouseCons = Matter.MouseConstraint.create(engine)     Composite.add add mouse for it to work

canvas = document.querySelector("canvas")
canvas.style.position = 'absolute';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.zIndex = '-5';


const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('room');
const name = urlParams.get('nick');
let color = window.location.hash;
host = false;
const socket = io.connect('ws://localhost');
socket.on('connect', ()=>{
    if(!room){
        host = true;
        code = socket.id.substring(socket.id.length - 4, socket.id.length);
        socket.emit("NewGame", code);
    }else{
        code = room;
    }
    socket.emit('joinRoom', code);
    document.getElementById("code").innerHTML = code;
});

document.getElementById("start").addEventListener("click", function() {
    if(currMap){
    if(host){
        ajax.open("GET", "/start?code="+code);
        ajax.send();
        //socket.emit("startGame", code);
        const color = window.location.hash;
        window.location.replace("frontend.html?mapName="+currMap+"&nick="+name+"&room="+code+"&color="+color);
    }
    }
});
socket.on('startGame', ()=>{
    console.log("Game started");
    const color = window.location.hash;
    window.location.replace("frontend.html?nick="+name+"&room="+code+"&color="+color);
});


mapObj = null
hole = null
spawn = null
ajax = new XMLHttpRequest();
ajax.open('POST', '/sql');
ajax.send("select mapName from maps");
maplist = document.getElementById('maps');
console.log(maplist);
loaded = 0;
ajax.addEventListener("loadend", ()=>{
    maps = JSON.parse(ajax.responseText);
    console.log(maps);
    console.log(maps.length);
    if(maps.length > loaded){
        for(i = 0; i < maps.length; i++){
            maplist.innerHTML +=
                "<li id = \'"+ maps[i].mapName+ "\' onClick=clickedMap(this.id)>"
                +maps[i].mapName+
                "</li>";
            loaded++;
        }
    }
    else{
        map = maps[0]
        //console.log(map);

        socket.emit("iwantalltheverts", map.mapName, JSON.parse(map.lenSegs));

        spawn = JSON.parse(map.spawnPos);
        hole = JSON.parse(map.holePos);

        spawn = Bodies.circle(spawn[0], spawn[1], 25);
        spawn.render.fillStyle = "white";
        Composite.add(engine.world, spawn);
        hole = Bodies.circle(hole[0], hole[1], 15);
        hole.render.fillStyle = "red";
        Composite.add(engine.world, hole);
    }
});

function clickedMap(mapName){
    if(host){
        currMap = mapName;
        if(hole) {
            Composite.remove(engine.world, [hole, spawn]);
            for(i = 0; i < segments.length; i++){
                Composite.remove(engine.world, segments[i]);
            }
            segments = [];
        }
        ajax.open('POST', '/sql');
        //console.log(mapName)
        ajax.send("select * from maps where mapName=\""+mapName.toString()+"\";");
    }
}
segments = [];
socket.on("hereyougo", (verts) =>{
    tmpVerts = [];
    verts = JSON.parse(verts);
    console.log(verts);
    for(j = 0; j < verts.length; j++){
        for(i = 0; verts[j]["x"+i] != null; i++){
            tmpVerts[i] = {x:verts[j]["x"+i],y:verts[j]["y"+i]};
        }
        mapObj = createMap(0,0,tmpVerts,25,{ isStatic: true }, "rgb(23,143,25)");
        segments.push(mapObj);
        Composite.add(engine.world, mapObj);
    }
});


function createMap(x, y, verts, width, options, col) {
    const parts = [];
    for (let i = 1; i < verts.length; i++) {
        m = (verts[i - 1].y - verts[i].y) / (verts[i - 1].x - verts[i].x); //slope
        normal = -1 / m; //perpendicular line of slope
        angle = Math.atan(normal); //angle of normal in radians

        const body = Bodies.fromVertices((verts[i - 1].x + verts[i].x) / 2, (verts[i - 1].y + verts[i].y) / 2, [
            { x: verts[i - 1].x, y: verts[i - 1].y },
            { x: verts[i - 1].x + width * Math.cos(angle), y: verts[i - 1].y + width * Math.sin(angle) },
            { x: verts[i].x + width * Math.cos(angle), y: verts[i].y + width * Math.sin(angle) },
            { x: verts[i].x, y: verts[i].y }
        ], {
            render: {
                fillStyle: col
            }
        });
        parts.push(body);
    }
    //catches the last edge :P
    m = (verts[verts.length - 1].y - verts[0].y) / (verts[verts.length - 1].x - verts[0].x);
    normal = -1 / m;
    angle = Math.atan(normal);
    const body = Bodies.fromVertices((verts[0].x + verts[verts.length - 1].x) / 2, (verts[0].y + verts[verts.length - 1].y) / 2, [
        { x: verts[0].x, y: verts[0].y },
        { x: verts[0].x + width * Math.cos(angle), y: verts[0].y + width * Math.sin(angle) },
        { x: verts[verts.length - 1].x + width * Math.cos(angle), y: verts[verts.length - 1].y + width * Math.sin(angle) },
        { x: verts[verts.length - 1].x, y: verts[verts.length - 1].y }
    ], {
        render: {
            fillStyle: col
        }
    });
    parts.push(body);

    const ret = Body.create(options);
    Body.setParts(ret, parts);
    Body.translate(ret, { x: x, y: y });
    ret.collisionFilter = {
        'group': -1,
        'category': 2,
        'mask': 0,
    };
    return ret;
}