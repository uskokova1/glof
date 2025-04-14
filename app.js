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
    background: "darkslategrey",
    wireframes: false // <-- important
  }
});

var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

//so that the hole is visible on the frontend
var hole = Bodies.circle(600, 300, 15, {
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
  pos = Matter.Vector.create(myBall.position.x, myBall.position.y);
  force = Matter.Vector.create(-relX / 2000, -relY / 2000);
  socket.emit('click', pos, force, socket.id);
  //Matter.Body.applyForce(myBall, pos, force);
});

players={

};

const socket = io('ws://localhost:80');

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
  }
}

socket.on('createPlayer', function(name,sock,x,y,color) {
  if(players[sock] == undefined) {
    players[sock] = new Player(name,color,
        Bodies.circle(x, y, 20, {
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

