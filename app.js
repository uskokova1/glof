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

Composite.add(engine.world, [g1,g2,g3,g4,g5,g6]);


//so that the hole is visible on the frontend
var hole = Bodies.circle(500, 500, 19, {
  isStatic: true,
  isSensor: true,
  render: {
    fillStyle: "black"
  }
});
Composite.add(engine.world, hole);

// add all of the bodies to the world
Composite.add(engine.world, ground);
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

document.addEventListener('click', function (e) { //on click, gets the mouse X and Y relative to boxA and adds a force
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
  if(players[socket.id].stopped){
    socket.emit('click', pos, force, socket.id);
    players[socket.id].stopped = false;
  }
  //Matter.Body.applyForce(myBall, pos, force);
});

players={

};

const socket = io.connect('ws://localhost');

const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('room');
const name = urlParams.get('nick');
const color = urlParams.get('color');
socket.emit("newPlayer", room,name,color);

class Player{
  constructor(name,color,ballObj){
    this.name = name;
    this.color = color;
    this.ballObj = ballObj;
    this.stopped = true;
  }
}

socket.on('createPlayer', function(name,sock,x,y,color) {
  if(players[sock] == undefined) {
    players[sock] = new Player(name,color,
        Bodies.circle(x, y, 14, {
          render: {
            fillStyle: color,
            strokeStyle: 'blue',
            lineWidth: 3
          },
          frictionAir:0.05,
          restitution:0.8
        }));
    Composite.add(engine.world, players[sock].ballObj);
  }
});

socket.on('updateAll', (x,y,velx,vely,sock)=>{
  if (players[sock] == undefined) {
    socket.emit("requestPlayer",sock,room);
  }else {
    if(players[sock].ballObj.position.x - x < 0.01 && players[sock].ballObj.position.y - y  < 0.01) {
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

