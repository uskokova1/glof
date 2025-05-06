// module aliases

var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite;
var Mouse = Matter.Mouse;
var MouseConstraint = Matter.MouseConstraint;




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


//BELOW Is all about obstacles
const CATEGORY_DRAGGABLE = 0x0002;

function SpawnObstacle() {
  let obstaclePreset = [
    [50,50], //First obstacle preset. Obstacle number 1
    [50,50]
  ]
//Creates a draggable box just a normal box
  let draggableBox = Bodies.rectangle(300, 300, obstaclePreset[0][0], obstaclePreset[0][1], {
    isStatic: false,
    inertia: Infinity,
    collisionFilter: {
      category: CATEGORY_DRAGGABLE
    },
    render: { fillStyle: "pink"}
  });
  Composite.add(engine.world, draggableBox)

  // Make the object static after dragging
  Matter.Events.on(mouseConstraint, "enddrag", function(event) {
    if (event.body === draggableBox) {
      Matter.Body.setStatic(draggableBox, true);
      draggableBox.render.fillStyle = 'grey'; // once an object is active you must refrence it a different way than Matter.body
      socket.emit("createObstacle",draggableBox.position.x,draggableBox.position.y,obstaclePreset[0][0],obstaclePreset[0][1]);// Send the draggable box information to the server
    }
  });


}




// makes the mouse renderer used to track mouse and then drag objects
var mouse = Mouse.create(render.canvas);
//mouse.pixelRatio = 2; //Changes the coordinates for high res displays just in case
var mouseConstraint = MouseConstraint.create(engine,{
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visable: true }
    },
    collisionFilter: {
      mask: CATEGORY_DRAGGABLE
    }
});

Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;






tmpcol = "rgb(69,103,66)"




//HOLLLLEEEE AHHAHAHAHAHA
//so that the hole is visible on the frontend
var hole = Bodies.circle(900, 500, 19, {
  isStatic: true,
  isSensor: true,
  render: {
    fillStyle: "black"
  }
});
Composite.add(engine.world, hole);







// add all of the bodies to the world
//Composite.add(engine.world, ground);
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
  /*
  if(players[socket.id].stopped){
    socket.emit('click', pos, force, socket.id);
    players[socket.id].stopped = false;
  }

   */


  socket.emit('click', pos, force, socket.id);
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


let obstacles = {}
let index = 1
socket.on('createObstacle', (x2,y2,Width,Hight) =>{
  console.log("Recieved Obstacle CREATING")
  obstacles["Obstacle" + index] = Matter.Bodies.rectangle(x2,y2,Width,Hight, {
    isStatic: true,
    render: { fillStyle: "grey"}
  });
  Composite.add(engine.world,obstacles["Obstacle" + index]);
  index++;
});




socket.on('CreateWall', (x2,y2,Length,Width) =>{
  console.log("Building Wall");
  let wall = Bodies.rectangle(x2, y2, Length, Width, { isStatic: true,
  render:{
    fillStyle: tmpcol
  }})
  Composite.add(engine.world,wall);
});

socket.on('ImportWall', (x2,y2,Length,Width) =>{
  console.log("Building Wall");
  let wall = Bodies.rectangle(x2, y2, Length, Width, { isStatic: true,
    render:{
      fillStyle: tmpcol
    }})
  Composite.add(engine.world,wall);
});

