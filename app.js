// module aliases

var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite;
var Mouse = Matter.Mouse;
var MouseConstraint = Matter.MouseConstraint;

//Start of stuff for obstacles
let obstacles = {};
let index = 0;
let allObstacles = [];

let DeleteMode = false;

let d = new Date();
let timeOfLastObstacle = Date.now();


const CATEGORY_DRAGGABLE = 0x0002;
let bool1 = false;
//end of stuff for obstacles


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


const socket = io.connect('ws://localhost');



//HOLLLLEEEE AHHAHAHAHAHA
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




//BELOW Is all about obstacles


function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function SpawnObstacle() {
  //First section is for determinging the cooldown time for placing obstacles
  let d = new Date();
  console.log("SpawnObstacle", timeOfLastObstacle,'current time', Date.now());

  console.log("difference",Date.now() - timeOfLastObstacle);



  if (Date.now() - timeOfLastObstacle < 300){ // 0CHANG Number here for how longtime time for obstacle should take to respawn.Milleseconds 1000 per seconds
    console.log("ON Cooldown");
    return;

  }
  console.log("Spawning Obstacle");
  timeOfLastObstacle = Date.now();
  let obstaclePreset = [
    [50,50], //First obstacle preset. Obstacle number 1
    [30,100],
    [70,30],
    [30,70],
    [20,30],
    [40,40],
    [30,100]
  ]
  let ObstacleChoice = getRandomInt(6);
  console.log(ObstacleChoice);
  console.log(ObstacleChoice);
  let savedObstacleChoice = ObstacleChoice

//Creates a draggable box just a normal box
  obstacles["Obstacle" + index] = Bodies.rectangle(300, 300, obstaclePreset[ObstacleChoice][0], obstaclePreset[ObstacleChoice][1], {
    isStatic: false,
    inertia: Infinity,
    id:index,
    collisionFilter: {
      category: CATEGORY_DRAGGABLE
    },
    render: { fillStyle: "pink"}
  });
  console.log("Obstacle number: ",index,"Obstacle Number",ObstacleChoice,"Size Width",obstaclePreset[ObstacleChoice][0],"size Length",obstaclePreset[ObstacleChoice][1]);
  allObstacles.push(obstacles["Obstacle"+index])//add to array of obstacles
  Composite.add(engine.world, obstacles["Obstacle" + index])
  index++;
  // Make the object static after dragging
}
Matter.Events.on(mouseConstraint, "enddrag", function(event) {
  if (allObstacles.includes(event.body) && !event.body.isStatic && !DeleteMode) {
    Matter.Body.setStatic(event.body, true);
    event.body.render.fillStyle = 'grey'; // once an object is active you must refrence it a different way than Matter.body
    const width = event.body.bounds.max.x - event.body.bounds.min.x;
    const length =event.body.bounds.max.y - event.body.bounds.min.y;
    socket.emit("createObstacle",event.body.position.x,event.body.position.y,width,length);// Send the draggable box information to the server
    console.log("Sending Data to server to duplicate on server and other clients Length: ",width,length);
  }
  console.log("Yes Enddrag is running");
  if (allObstacles.includes(event.body) && !event.body.isStatic && DeleteMode) {
    let indexToRemove = allObstacles.indexOf(event.body);
    console.log("DeleteObstacle",allObstacles.indexOf(event.body));
    socket.emit("removeObstacle",indexToRemove);
    Composite.remove(engine.world, event.body);
    for (let i = 0; i < allObstacles.length; i++) {
      // console.log("here")
      // console.log(allObstacles[i]);
      Matter.Body.setStatic(allObstacles[i], true);
      allObstacles[i].render.fillStyle = 'grey';
    }
  }
  DeleteMode = false;
});

//BELOW IS FOR DELETING OBSTACLES
//event.body.bounds.max.x - event.body.bounds.min.x
function DeleteObstacle() {
  console.log("DeletingObstacle","Obstacles I can delete: ",allObstacles);
  DeleteMode = true;
  for (let i = 0; i < allObstacles.length; i++) {
    //console.log("here")
    //console.log(allObstacles[i]);
    Matter.Body.setStatic(allObstacles[i], false);
    allObstacles[i].render.fillStyle = 'pink';
  }

}










canvas.addEventListener('click', function (e) { //on click, gets the mouse X and Y relative to boxA and adds a force
  if (mouseConstraint.body) { //this determines if a body is currently being moved by the mouse constraint if so exit click event
    return;
  }
  pushBall(e)
});

let t = new Date();
let timeOfLastPut = t.getSeconds();
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
  /*
  console.log(myBall.velocity.x, myBall.velocity.y);
  if (players[socket.id].stopped) {
    socket.emit('click', pos, force, socket.id);
    players[socket.id].stopped = false;
  }

   */


  console.log("SpawnObstacle");
  console.log("current time: ",Date.now());
  console.log("time difference FOR LAST PUT",Date.now()-timeOfLastPut);
  if (Date.now() - timeOfLastPut < 1500 ){ // CHANG Number here for how longtime time for obstacle should take to respawn. MIlliseconds 1000 per second
    console.log("leavingFunction");
    return;

  }
  timeOfLastPut = Date.now();
  socket.emit('click', pos, force, socket.id);
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




socket.on('createPlayer', function (name, sock, x, y, color,objIndex) {
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
  index = objIndex;
  console.log("INDES IS NOW: ", index);
});

//Code BELOW will update client Obstacle array with server obstacle array:
socket.on('sendingArrayOfObstacles', (obstaclePass) => {
  let obstaclePass1 = JSON.parse(obstaclePass);
  allObstacles.push(obstaclePass);
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


socket.on('obstacleIndex++',(sock) => {
  console.log("obstacleIndexIncreasingPrimaryKey");
  index++;
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






socket.on('createObstacle', (x2,y2,Width,Hight,isStatic) =>{
  console.log("Recieved Obstacle CREATING Length: ", Width,"hight", Hight);
  obstacles["Obstacle" + index] = Bodies.rectangle(x2, y2,Width,Hight, {
    isStatic: true,
    inertia: Infinity,
    collisionFilter: {
      category: CATEGORY_DRAGGABLE
    },
    render: { fillStyle: "grey"}
  });

  if (isStatic){
    Composite.add(engine.world,obstacles["Obstacle" + index]);
  }
  allObstacles.push(obstacles["Obstacle"+index])//add to array of obstacles
  console.log("Obstacle Number: ", index,"what allObstacles looks like: ", allObstacles)
  //index++;
});

//check


socket.on('removeObstacle', (indexToRemove) => {
  console.log("removing obstacle",indexToRemove,allObstacles,"Does it exist: ",allObstacles[indexToRemove]);
  Composite.remove(engine.world,allObstacles[indexToRemove]);
  console.log("Obstacle Number: ", index,"what allObstacles looks like: ", allObstacles)
});



/*
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
*/

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