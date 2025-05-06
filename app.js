// module aliases
var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
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
    background: "rgb(34,61,34)",
    wireframes: false // <-- important
  }
});
tmpcol = "rgb(69,103,66)"
/*
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true,
  render:{
    fillStyle: tmpcol
  }});

var g1 = Bodies.rectangle(800, 400, 30, 600, { isStatic: true,
  render:{
    fillStyle: tmpcol
  }});
var g2 = Bodies.rectangle(400, 450, 30, 355, { isStatic: true,
  render:{
    fillStyle: tmpcol
  }});
var g3 = Bodies.rectangle(400, 400, 500, 30, { isStatic: true,
  render:{
    fillStyle: tmpcol
  }});
var g4 = Bodies.rectangle(400, 100, 850, 30, { isStatic: true,
  render:{
    fillStyle: tmpcol
  }});
var g6 = Bodies.rectangle(0, 300, 30, 600, { isStatic: true,
  render:{
    fillStyle: tmpcol
  }});
var g5 = Bodies.circle(400, 125, 30, { isStatic: true,
  render:{
    fillStyle: tmpcol
  }});

Composite.add(engine.world, [ground,g1,g2,g3,g4,g5,g6]);


 */
const socket = io.connect('ws://localhost');



//so that the hole is visible on the frontend
socket.on("createHole",(x,y)=>{
  var hole = Bodies.circle(x, y, 19, {
    isStatic: true,
    isSensor: true,
    render: {
      fillStyle: "black"
    }
  });
  Composite.add(engine.world, hole);
});


// run the renderer
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

canvas.addEventListener('click', function (e) { //on click, gets the mouse X and Y relative to boxA and adds a force
  /*
  if (mapMode) {
    tmpVerts.push({ x: e.clientX, y: e.clientY });
    c1 = Matter.Bodies.circle(e.clientX, e.clientY, 25 / 2, { isStatic: true });
    Composite.add(engine.world, c1);
    tmpCircles.push(c1);
  }
  else {
  pushBall(e) }
   */
  pushBall(e)
});

function pushBall(e) {
  myBall = players[socket.id].ballObj
  bounds = canvas.getBoundingClientRect();
  relX = e.clientX - bounds.left - myBall.position.x;
  relY = e.clientY - bounds.top - myBall.position.y;
  console.log(relX, relY);
  relX = Matter.Common.clamp(relX, -300, 300);
  relY = Matter.Common.clamp(relY, -300, 300);

  pos = Matter.Vector.create(myBall.position.x, myBall.position.y);
  force = Matter.Vector.create(-relX / 4000, -relY / 4000);

  console.log(myBall.velocity.x, myBall.velocity.y);
  if (players[socket.id].stopped) {
    socket.emit('click', pos, force, socket.id);
    players[socket.id].stopped = false;
  }
  //Matter.Body.applyForce(myBall, pos, force);
}

players = {

};

const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('room');
const name = urlParams.get('nick');
const color = window.location.hash;
socket.emit("newPlayer", room, name, color);
//socket.emit("requestMap");       so that when you reload it will request the map state

class Player {
  constructor(name, color, ballObj) {
    this.name = name;
    this.color = color;
    this.ballObj = ballObj;
    this.stopped = true;
  }
}

socket.on('createPlayer', function (name, sock, x, y, color) {
  if (players[sock] == undefined) {
    players[sock] = new Player(name, color,
      Bodies.circle(x, y, 14, {
        render: {
          fillStyle: color,
          strokeStyle: 'blue',
          lineWidth: 3
        },
        frictionAir: 0.05,
        restitution: 0.8
      }));
    Composite.add(engine.world, players[sock].ballObj);
  }
});

socket.on('updateAll', (x, y, velx, vely, sock) => {
  if (players[sock] == undefined) {
    socket.emit("requestPlayer", sock, room);
  } else {
    if (players[sock].ballObj.position.x - x < 0.01 && players[sock].ballObj.position.y - y < 0.01) {
      players[sock].stopped = true;
    }
    Matter.Body.setPosition(players[sock].ballObj, Matter.Vector.create(x, y));
  }
});

socket.on('removePlayer', (sock) => {
  Composite.remove(engine.world, players[sock].ballObj);
  console.log('user disconnected');
  delete players[sock]
});

// in the event that a player makes it into the hole
socket.on('playerScored', (sock) => {
  if (sock === socket.id) {
    console.log('Player ${sock} scored!');
  }
});

socket.on()

//code interpreted from https://stackoverflow.com/questions/58507514/matter-js-hollow-circle-body
const Body = Matter.Body;
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

  return ret;
}

socket.on("mapSegment", (verts) => {
    //console.log(verts);
    verts = JSON.parse(verts);
    console.log(verts);
    for(i = 0; i < verts.length; i++) {
      //console.log(verts[i]);
      newMap = createMap(0, 0, verts[i], 25, {isStatic: true}, "rgb(23,143,25)");
      Composite.add(engine.world, newMap)
    }

});
