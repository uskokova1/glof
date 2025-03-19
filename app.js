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
// create two boxes and a ground
var boxA = Bodies.circle(400, 200, 20, {
  render: {
    fillStyle: 'red',
    strokeStyle: 'blue',
    lineWidth: 3
  }
});
var boxB = Bodies.circle(450, 50, 20, {
  render: {
    fillStyle: 'white',
    strokeStyle: 'blue',
    lineWidth: 3
  }
});
boxA.frictionAir = 0.05;
boxB.frictionAir = 0.05;
boxA.restitution = 0.8;
boxB.restitution = 0.8;
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });


// add all of the bodies to the world
Composite.add(engine.world, [boxA, boxB, ground]);
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
  bounds = canvas.getBoundingClientRect();
  relX = e.clientX - bounds.left - boxA.position.x;
  relY = e.clientY - bounds.top - boxA.position.y;
  console.log(relX, relY);
  pos = Matter.Vector.create(boxA.position.x, boxA.position.y);
  force = Matter.Vector.create(-relX / 2000, -relY / 2000);
  Matter.Body.applyForce(boxA, pos, force);
});



