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
  myBall = players[socket.id]
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

socket.on('init', function(x,y,sock) {
  if (!players[sock]) {
    players[sock] = Bodies.circle(x, y, 20, {
      render: {
        fillStyle: 'white',
        strokeStyle: 'blue',
        lineWidth: 3
      },
      frictionAir:0.05,
      restitution:0.8
    });
    Composite.add(engine.world, players[sock]);
  }
    //Composite.add(engine.world,players[sock]);
    //console.log(players)
});
socket.on('updateAll', (x,y,velx,vely,sock)=>{
  //console.log(JSON.parse(data))
  //playerStats = JSON.parse(data)
  //for (const [sock, player] of Object.entries(playerStats)){
    /*
    if(sock == socket.id) {
      socket.emit('updateSelf',
          players[socket.id].position.x,
              players[socket.id].position.y,
              players[socket.id].velocity.x,
              players[socket.id].velocity.y);
    }else{*/
      if (!players[sock]) {
        players[sock] = Bodies.circle(x, y, 20, {
          render: {
            fillStyle: 'white',
            strokeStyle: 'blue',
            lineWidth: 3
          },
          frictionAir:0.05,
          restitution:0.8
        });
        Composite.add(engine.world, players[sock]);
        }
      players[sock].position.x = x;
      players[sock].position.y = y;
  players[sock].velocity.x = velx;
  players[sock].velocity.y = vely;
  //console.log(players)
      //}
  //}
});

// setInterval(() => {
//   //console.log(players[socket.id]);
//     socket.emit('updateSelf', (
//         players[socket.id].position.x,
//           players[socket.id].position.y,
//           players[socket.id].velocity.x,
//           players[socket.id].velocity.y));
// }, 16.666);
