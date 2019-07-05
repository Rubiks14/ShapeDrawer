(function() {
'use strict'

const MODES = Object.freeze({
    DRAW_MODE: 0,
    SELECT_MODE: 1,
    DELETE_MODE: 2,
});

const SHAPES = Object.freeze({
    RECTANGLE: "rectangle",
    CIRCLE: "circle",
    TRIANGLE: "triangle",
});

const TOOLS = Object.freeze({
    CANVAS: "shapePlacer",
    COLOR_PICKER: "colorPicker",
    WIDTH: "width",
    HEIGHT: "height",
    SELECT_BUTTON: "select",
    DELETE_BUTTON: "delete",
    CLEAR_BUTTON: "clear",
});

window.onload = function() {
    const editor = new Editor(TOOLS.CANVAS);
    editor.canvas.addEventListener("click", editor.processMouseClick);
    editor.resize();

    window.onresize = editor.resize;
        
    const squareButton = document.getElementById(SHAPES.RECTANGLE);
    const circleButton = document.getElementById(SHAPES.CIRCLE);
    const triangleButton = document.getElementById(SHAPES.TRIANGLE);
    const selectButton = document.getElementById(TOOLS.SELECT_BUTTON);
    const deleteButton = document.getElementById(TOOLS.DELETE_BUTTON);
    const clearButton = document.getElementById(TOOLS.CLEAR_BUTTON);

    squareButton.onclick = editor.setNewShape;
    circleButton.onclick = editor.setNewShape;
    triangleButton.onclick = editor.setNewShape;
    selectButton.onclick = editor.toggleSelect;
    deleteButton.onclick = editor.toggleDelete;
    clearButton.onclick = editor.clearCanvas;
};


class Shape {
    constructor(type, color = "#000", x = 0, y = 0, width = 100, height = null) {
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
        this.shapePath = null;
        this.setLocation = (x, y) => {
            this.x = x;
            this.y = y;
        };
        this.setColor = (color) => {
            this.color = color;
        };

        this.createShapePath = () => {
            if (this.type === "") {
                return null;
            }
            const shape = new Path2D();
            const HalfWidth = this.width / 2;
            const HalfHeight = this.height / 2;
        
            if (this.type === SHAPES.RECTANGLE) {
                shape.rect(this.x - HalfWidth, this.y - HalfHeight, this.width, this.height);
            } else if (this.type === SHAPES.CIRCLE) {
                shape.arc(this.x , this.y, HalfWidth, 0, Math.PI * 2);
            } else if (this.type === SHAPES.TRIANGLE) {
                shape.moveTo(this.x, this.y - HalfHeight);
                shape.lineTo(this.x - HalfWidth, this.y + HalfHeight);
                shape.lineTo(this.x + HalfWidth , this.y + HalfHeight);
            }
            this.shapePath = shape;
        };
        this.createShapePath();
    }
}

class Editor {
    constructor(elementName) {
        this.canvas = document.getElementById(elementName);
        if (!this.canvas.getContext) {
            console.error("Canvas is not supported or no canvas object found");
            return null;
        }
        // (TODO) Set up the tools so that they can be used on the selected shape
        this.colorPicker = document.getElementById(TOOLS.COLOR_PICKER);
        this.widthAdjuster = document.getElementById(TOOLS.WIDTH);
        this.heightAdjuster = document.getElementById(TOOLS.HEIGHT);
        this.ctx = this.canvas.getContext("2d");
        this.shapes = [];
        this.newShapeType = "";
        this.selectedShape = null;
        this.mode = MODES.DRAW_MODE;
        this.resize = () => {
            // These numbers are used for sizing the canvas to a width and height
            // that fits well in the page and allows for the sidebar on the right
            // (TODO) Edit this to set to the body width/height instead of the
            // window width/height. This may resolve the stretching issue when the
            // window height is reduced.
            const PageWidthEighty = window.innerWidth * .8;
            const PageHeightNinetyFive = window.innerHeight * .95;
            //this.ctx.save();
            this.canvas.width = PageWidthEighty;
            this.canvas.height = PageHeightNinetyFive;
            //this.ctx.restore();
            this.draw();
        };
        this.setNewShape = (eventObject) => {
            this.newShapeType = eventObject.target.id;
        };
        this.processMouseClick = (eventObject) => {
            const canvasMousePosition = offsetMouseToCanvas(this.canvas, eventObject);
            if (this.mode === MODES.SELECT_MODE) {
                this.selectShape(canvasMousePosition);
            }
            else if (this.mode === MODES.DELETE_MODE) {
                this.selectShape(canvasMousePosition);
                this.deleteShape();
            }
            else if (this.mode === MODES.DRAW_MODE) {
                this.createShape(canvasMousePosition, this.colorPicker.value, this.widthAdjuster.value, this.heightAdjuster.value);
            }
            this.draw();
        };
        this.selectShape = (mousePosition) => {
            if (this.shapes.length < 1) {
                return;
            }
            // Loop through the array backwards to select the items on top
            // if an item is selected move it to the top of the canvas and move
            // its data to the back of the array. This allows the canvas order
            // to be changed and also allows for the selected item to be deleted
            // easier.
            for (let i = this.shapes.length - 1; i >= 0; i--) {
                if (this.ctx.isPointInPath(this.shapes[i].shapePath, mousePosition.x, mousePosition.y)) {
                    const temp = this.shapes[i];
                    this.shapes.splice(i, 1);
                    this.shapes.push(temp);
                    this.selectedShape = temp;
                    return;
                }
            }
        };
        this.createShape = (position, color, width, height) => {
            if (this.newShapeType === "") {
                return;
            }
            const shape = new Shape(this.newShapeType, color, position.x, position.y, width, height);
            this.shapes.push(shape);
            this.selectedShape = null;
            console.log(this.shapes);
        };
        this.toggleSelect = () => {
            if (this.mode !== MODES.SELECT_MODE) {
                this.mode = MODES.SELECT_MODE;
            }
            else {
                this.mode = MODES.DRAW_MODE;
            }
        };
        this.toggleDelete = () => {
            if (this.mode !== MODES.DELETE_MODE) {
                this.mode = MODES.DELETE_MODE;
            }
            else {
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
            if (this.shapes.length < 1) {
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
}

function offsetMouseToCanvas(canvas, event){
    const canvasX = canvas.offsetLeft;
    const canvasY = canvas.offsetTop;
    return {
        x: event.pageX - canvasX,
        y: event.pageY - canvasY,
    }
}
})();
