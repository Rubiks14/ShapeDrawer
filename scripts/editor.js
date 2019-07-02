'use strict'

const MODES = {
    DRAW_MODE: 0,
    SELECT_MODE: 1,
    DELETE_MODE: 2,
};

window.onload = function() {
    let editor = new Editor("shapePlacer");
    editor.canvas.addEventListener("click", editor.processMouseClick);
    editor.resize();

    window.onresize = editor.resize;
        
    let squareButton = document.getElementById("rectangle");
    let circleButton = document.getElementById("circle");
    let triangleButton = document.getElementById("triangle");
    let selectButton = document.querySelector("#select");
    let deleteButton = document.querySelector("#delete");
    let clearButton = document.querySelector("#clear");

    squareButton.onclick = editor.setNewShape;
    circleButton.onclick = editor.setNewShape;
    triangleButton.onclick = editor.setNewShape;
    selectButton.onclick = editor.toggleSelect;
    deleteButton.onclick = editor.toggleDelete;
    clearButton.onclick = editor.clearCanvas;
};


function Shape(type, color = "#000", x = 0, y = 0, width = 10, height = null) {

    if (type === null) {
        console.error("You must pass a type of shape into the function (e.g. Square, Triangle, Circle)");
        return null;
    }

    if (height === null) {
        height = width;
    }

    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.shapePath = createShapePath(this);

    this.setLocation = (x, y) => {
        this.x = x;
        this.y = y;
    };

    this.setColor = (color) => {
        this.color = color;
    };
}

function Editor(elementName) {
    this.canvas = document.getElementById(elementName);
    if (!this.canvas.getContext) {
        console.error("Canvas is not supported or no canvas object found");
        return null;
    }
    this.ctx = this.canvas.getContext("2d");
    this.shapes = [];

    this.newShapeType = "";
    this.selectedShape = null;
    this.mode = MODES.DRAW_MODE;


    this.resize = () => {
        this.ctx.save();
        this.canvas.width = window.innerWidth * .8;
        this.canvas.height =  window.innerHeight * .95;
        this.ctx.restore();
        this.draw();
    };

    this.setNewShape = (event) => {
        this.newShapeType = event.target.id;
    };

    this.processMouseClick = (event) => {
        let colorPicker = document.querySelector("#colorPicker");
        let width = document.querySelector("#width");
        let height = document.querySelector("#height");

        let canvasMousePosition = offsetMouseToCanvas(this.canvas, event);
        if (this.mode === MODES.SELECT_MODE) {
            this.selectShape(canvasMousePosition);
        } else if (this.mode === MODES.DELETE_MODE) {
            this.selectShape(canvasMousePosition);
            this.deleteShape();
        } else if (this.mode === MODES.DRAW_MODE) {
            this.createShape(canvasMousePosition, colorPicker.value, width.value, height.value);
        }
        this.draw();
    };

    this.selectShape = (mouse) => {
        if (this.shapes.length < 0) return;

        for (let i = this.shapes.length - 1; i >= 0; i--) {
            console.log(this.shapes[i]);
            if ( this.ctx.isPointInPath(this.shapes[i].shapePath, mouse.x, mouse.y ) ) {
                let temp = this.shapes[i];
                this.shapes.splice(i, 1);
                this.shapes.push(temp);
                this.selectedShape = temp;
                console.log(this.selectedShape);
                return;
            }
        }
    };

    this.createShape = (position, color, width, height) => {
        if (this.newShapeType === "") {
            return;
        }

        let shape = new Shape(this.newShapeType, color, 
                                position.x, position.y, width, height);
        this.shapes.push(shape);
        this.selectedShape = null;
        console.log(this.shapes);
    };

    this.toggleSelect = () => {
        if (this.mode !== MODES.SELECT_MODE) {
            this.mode = MODES.SELECT_MODE;
        } else {
            this.mode = MODES.DRAW_MODE;
        }
    };

    this.toggleDelete = () => {
        if (this.mode !== MODES.DELETE_MODE) {
            this.mode = MODES.DELETE_MODE;
        } else {
            this.mode = MODES.DRAW_MODE;
        }
    };

    this.deleteShape = () => {
        if (this.selectedShape !== null) {
            this.shapes.pop();
            this.selectedShape = null;
        }
        this.draw();
    };

    this.clearCanvas = () => {
        this.shapes.splice(0, this.shapes.length);
        this.draw();
    };

    this.draw = () => {
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.shapes.length < 1){
            return;
        }
        this.shapes.forEach((shape) => {
            this.ctx.save();
            this.ctx.fillStyle = shape.color;
            this.ctx.fill(shape.shapePath);
            this.ctx.restore();
        });
    };
}

function createShapePath(shapeData) {
    if (shapeData.type === "") {
        return null;
    }
    let shape = new Path2D();
    if (shapeData.type === "rectangle") {
        shape.rect(shapeData.x - (shapeData.width / 2), shapeData.y - (shapeData.height / 2), shapeData.width, shapeData.height);
    } else if (shapeData.type === "circle") {
        shape.arc(shapeData.x , shapeData.y, shapeData.width / 2, 0, Math.PI * 2);
    } else if (shapeData.type === "triangle") {
        shape.moveTo(shapeData.x, shapeData.y - (shapeData.height / 2));
        shape.lineTo(shapeData.x - (shapeData.width / 2), shapeData.y + shapeData.height / 2);
        shape.lineTo(shapeData.x + shapeData.width / 2 , shapeData.y + shapeData.height / 2);
    }
    return shape;
}

function offsetMouseToCanvas(canvas, event){
    let canvasX = canvas.offsetLeft;
    let canvasY = canvas.offsetTop;
    return {
        x: event.pageX - canvasX,
        y: event.pageY - canvasY,
    }
}