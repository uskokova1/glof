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
canvas.style.left = '0px';
canvas.style.top = '0px';

mode = "Create";

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

Composite.add(engine.world, mouseConstraint);
segIndex = 0;
document.getElementById("edit").addEventListener("click", function() {
    if(segments[segIndex] == null){
        exitMapMode();
    }
    circles[segIndex] = tmpCircles;
    console.log(circles[segIndex]);
    mode = "Edit";
});
document.getElementById("create").addEventListener("click", function() {
    segIndex++;
    mode = "Create";
    tmpVerts = [];
    tmpCircles = [];
});
document.getElementById("cycle").addEventListener("click", function() {
    segIndex++;
    if(circles[segIndex] == undefined ) {
        segIndex = 0;
    }
    for(let i = 0; i < tmpCircles.length; i++){
        tmpCircles[i].render.fillStyle = "black";
    }
    console.log(segIndex);
    tmpCircles = circles[segIndex];
    for(let i = 0; i < tmpCircles.length; i++){
        tmpCircles[i].render.fillStyle = "white";
    }
});


circles = [];
segments = [];

Matter.Events.on(mouseConstraint, "enddrag", ()=>{
    console.log(segments);
    console.log(segIndex);
    Composite.remove(engine.world,segments[segIndex]);
    exitMapMode();
});

canvas.addEventListener('click', function (e) { //on click, gets the mouse X and Y relative to boxA and adds a force
    if(mode == "Create"){
        //Composite.remove(mouseConstraint);
        tmpVerts.push({x:e.clientX, y:e.clientY});
        c1 = Matter.Bodies.circle(e.clientX,e.clientY,25/2,{frictionAir:1});
        Composite.add(engine.world, c1);
        tmpCircles.push(c1);
    }
    if(mode == "Edit"){
        Composite.add(engine.world, mouseConstraint);
    }
});


function createMap(x,y, verts, width, options,col) {
    const parts = [];
    for(let i = 1; i < verts.length; i++) {
        m = (verts[i-1].y-verts[i].y)/(verts[i-1].x-verts[i].x); //slope
        normal = -1/m; //perpendicular line of slope
        angle = Math.atan(normal); //angle of normal in radians

        const body = Bodies.fromVertices((verts[i-1].x + verts[i].x)/2,(verts[i-1].y+verts[i].y)/2, [
            { x: verts[i-1].x , y: verts[i-1].y },
            { x: verts[i-1].x +width*Math.cos(angle), y: verts[i-1].y+width*Math.sin(angle) },
            { x: verts[i].x +width*Math.cos(angle), y: verts[i].y+width*Math.sin(angle) },
            { x: verts[i].x , y: verts[i].y }
        ],{render:{
                fillStyle: col
            }});
        parts.push(body);
    }
    //catches the last edge :P
    m = (verts[verts.length-1].y-verts[0].y)/(verts[verts.length-1].x-verts[0].x);
    normal = -1/m;
    angle = Math.atan(normal);
    const body = Bodies.fromVertices((verts[0].x+verts[verts.length-1].x)/2,(verts[0].y+verts[verts.length-1].y)/2, [
        { x: verts[0].x , y: verts[0].y },
        { x: verts[0].x +width*Math.cos(angle), y: verts[0].y+width*Math.sin(angle) },
        { x: verts[verts.length-1].x +width*Math.cos(angle), y: verts[verts.length-1].y+width*Math.sin(angle) },
        { x: verts[verts.length-1].x , y: verts[verts.length-1].y }
    ],{render:{
            fillStyle: col
        }});
    parts.push(body);

    const ret = Body.create(options);
    Body.setParts(ret, parts);
    Body.translate(ret, {x: x, y: y});
    ret.collisionFilter = {
        'group': -1,
        'category': 2,
        'mask': 0,
    };
    return ret;
}


tmpVerts = [];
tmpCircles = [];
function exitMapMode(){
    for(let i = 0; i < tmpCircles.length; i++){
        tmpVerts[i] = {x:tmpCircles[i].position.x, y:tmpCircles[i].position.y};
        //Composite.remove(engine.world, tmpCircles[i]);
    }
    console.log(tmpVerts);
    newMap = createMap(0,0,tmpVerts,25,{isStatic:true},"rgb(23,143,25)");
    segments[segIndex] = newMap;
    Composite.add(engine.world, newMap)

    //tmpVerts = []
}

