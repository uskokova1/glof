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
    background: "rgb(34,61,34)",
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
addEventListener("resize", (event) => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
canvas.style.left = '0px';
canvas.style.top = '0px';

mode = "Edit";

mouse = Matter.Mouse.create(render.canvas);
mouseConstraint = Matter.MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false
    }
  }
});
render.mouse = mouse;

Composite.add(engine.world, mouseConstraint);
segIndex = 0;
document.getElementById("edit").addEventListener("click", function () {
  console.log(circles);
  if (segments[segIndex] == null) {
    exitMapMode();
  }
  circles[segIndex] = tmpCircles;
  console.log(circles[segIndex]);
  mode = "Edit";
});
document.getElementById("create").addEventListener("click", function () {
  console.log(circles);
  for (let i = 0; i < tmpCircles.length; i++) {
    tmpCircles[i].render.fillStyle = "black";
  }
  while (circles[segIndex] != null) {
    segIndex++;
  }

  mode = "Create";
  tmpVerts = [];
  tmpCircles = [];
});
document.getElementById("cycle").addEventListener("click", function () {
  console.log(circles);
  circles[segIndex] = tmpCircles;
  segIndex++;
  if (circles[segIndex] == undefined) {
    segIndex = 0;
  }
  for (let i = 0; i < tmpCircles.length; i++) {
    tmpCircles[i].render.fillStyle = "black";
  }
  console.log(segIndex);
  tmpCircles = circles[segIndex];
  for (let i = 0; i < tmpCircles.length; i++) {
    tmpCircles[i].render.fillStyle = "white";
  }
});

document.getElementById("delete").addEventListener("click", function () {
  Composite.remove(engine.world, segments[segIndex]);
  for (let i = 0; i < tmpCircles.length; i++) {
    Composite.remove(engine.world, tmpCircles[i]);
  }
  segments = segments.splice(segIndex, 1);
  circles = circles.splice(segIndex, 1);
  console.log(circles);
  segIndex++;
});


circles = [];
segments = [];

Matter.Events.on(mouseConstraint, "enddrag", () => {
  console.log(segments);
  console.log(segIndex);
  Composite.remove(engine.world, segments[segIndex]);
  exitMapMode();
});


canvas.addEventListener('click', function (e) { //on click, gets the mouse X and Y relative to boxA and adds a force
  if (mode == "Create") {
    //Composite.remove(mouseConstraint);
    tmpVerts.push({ x: mouse.position.x, y: mouse.position.y });
    c1 = Matter.Bodies.circle(mouse.position.x, mouse.position.y, 25 / 2, { frictionAir: 1 });
    Composite.add(engine.world, c1);
    tmpCircles.push(c1);
  }
});
spawn = Bodies.circle(170, 620, 25);
spawn.render.fillStyle = "white";
spawn.frictionAir = 1;
Composite.add(engine.world, spawn);
hole = Bodies.circle(130, 670, 15);
hole.render.fillStyle = "red";
hole.frictionAir = 1;
Composite.add(engine.world, hole);

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


tmpVerts = [];
tmpCircles = [];
function exitMapMode() {
  tmpVerts = [];
  for (let i = 0; i < tmpCircles.length; i++) {
    tmpVerts[i] = { x: tmpCircles[i].position.x, y: tmpCircles[i].position.y };
    //Composite.remove(engine.world, tmpCircles[i]);
  }
  console.log(tmpVerts);
  newMap = createMap(0, 0, tmpVerts, 25, { isStatic: true }, "rgb(23,143,25)");
  segments[segIndex] = newMap;
  Composite.add(engine.world, newMap)

  //tmpVerts = []
}

ajax = new XMLHttpRequest();
const socket = io.connect(window.location.host);

document.getElementById("upload").addEventListener("click", function (event) {
  mapname = document.getElementById("name").value;

  ajax.open("POST", "/sql");
  ajax.send("SELECT * FROM maps where mapName=\""+mapname+"\";");

});

ajax.onload = function () {
  console.log(ajax.responseText);
  if(ajax.responseText != "[]"){
    document.getElementById("name").value = "name taken :P"
  } else {
    mapTable = "insert into maps(mapName,lenSegs,spawnPos,holePos) values (\"" + mapname + "\",\"[";
    for (let i = 0; i < circles.length; i++) {
      insertValsString = "\"" + mapname + "\",";
      insertString = "insert into SegWith" + circles[i].length + "(MapOwner,";
      createString = "create table if not exists SegWith" + circles[i].length + "(MapOwner varchar(50),";
      for (let j = 0; j < circles[i].length; j++) {
        insertString += "x" + j + "," + "y" + j + ",";
        insertValsString += circles[i][j].position.x + "," + circles[i][j].position.y + ",";
        createString += "x" + j + " float," + "y" + j + " float,";
      }
      insertString = insertString.substring(0, insertString.length - 1);
      insertValsString = insertValsString.substring(0, insertValsString.length - 1);
      createString = createString.substring(0, createString.length - 1);
      insertValsString += ");"
      insertString += ") values (" + insertValsString;
      createString += ");"

      socket.emit("uploadMap", createString,insertString);

      mapTable += circles[i].length + ",";
    }
    mapTable = mapTable.substring(0, mapTable.length - 1);
    mapTable += "]\", ";

    spawn.position.x = Math.round(spawn.position.x);
    spawn.position.y = Math.round(spawn.position.y);
    hole.position.x = Math.round(hole.position.x);
    hole.position.y = Math.round(hole.position.y);

    mapTable += "\"[" + spawn.position.x + "," + spawn.position.y + "]\",";
    mapTable += "\"[" + hole.position.x + "," + hole.position.y + "]\");";
    socket.emit("sqlcmd", mapTable);

    console.log(mapTable);
  }
}

scrollDist = 500;
xlook = 0;
ylook = 0;
addEventListener("mousemove", function(e){
  if(e.buttons === 2){
    canvas.style.cursor = "grab";
    xlook += e.movementX;
    ylook += e.movementY;

    Render.lookAt(render, {
          min:{x: scrollDist-xlook,y: scrollDist-ylook},
          max:{x: scrollDist-xlook,y: scrollDist-ylook}
        },
        {
          x: scrollDist,
          y: scrollDist
        }
    );
  }
  else{
    canvas.style.cursor = "default";
  }
})
addEventListener("mousewheel", function(event) {
  //console.log(scrollDist);
  if (event.wheelDelta >= 0) {
    scrollDist -= 20;
  }
  else {
    scrollDist += 20;
  }
  Render.lookAt(render, {
    min:{x: scrollDist-xlook,y: scrollDist-ylook},
    max:{x: scrollDist-xlook,y: scrollDist-ylook}
  },{
    x: scrollDist,
    y: scrollDist
  });
});