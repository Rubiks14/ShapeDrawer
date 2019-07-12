/*jshint esversion: 6 */

(function() {
    "use strict"
    
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
        editor.canvas.onclick = editor.processMouseClick;
        editor.resize();
    
        window.onresize = editor.resize;
            
        const squareButton = document.getElementById(SHAPES.RECTANGLE);
        const circleButton = document.getElementById(SHAPES.CIRCLE);
        const triangleButton = document.getElementById(SHAPES.TRIANGLE);
        const selectButton = document.getElementById(TOOLS.SELECT_BUTTON);
        const deleteButton = document.getElementById(TOOLS.DELETE_BUTTON);
        const clearButton = document.getElementById(TOOLS.CLEAR_BUTTON);
    
        squareButton.onclick = editor.setNewShape(SHAPES.RECTANGLE);
        circleButton.onclick = editor.setNewShape(SHAPES.CIRCLE);
        triangleButton.onclick = editor.setNewShape(SHAPES.TRIANGLE);
        selectButton.onclick =  editor.toggleMode(MODES.SELECT_MODE);
        deleteButton.onclick = editor.toggleMode(MODES.DELETE_MODE);
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
        }
        //(TODO) hook this up to the editor for modifying the currently selected shape
        // setLocation = (x, y) => {
        //     this.x = x;
        //     this.y = y;
        // };
        // setColor = (color) => {
        //     this.color = color;
        // };

        createShapePath = () => {
            if (this.type === "") {
                return null;
            }
            const shape = new Path2D();
            const halfWidth = this.width / 2;
            const halfHeight = this.height / 2;
        
            if (this.type === SHAPES.RECTANGLE) {
                shape.rect(this.x - halfWidth, this.y - halfHeight, this.width, this.height);
            } else if (this.type === SHAPES.CIRCLE) {
                shape.arc(this.x , this.y, halfWidth, 0, Math.PI * 2);
            } else if (this.type === SHAPES.TRIANGLE) {
                shape.moveTo(this.x, this.y - halfHeight);
                shape.lineTo(this.x - halfWidth, this.y + halfHeight);
                shape.lineTo(this.x + halfWidth , this.y + halfHeight);
            }
            this.shapePath = shape;
        };
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
        }
        resize = () => {
            // These numbers are used for sizing the canvas to a width and height
            // that fits well in the page and allows for the sidebar on the right
            // (TODO) Edit this to set to the body width/height instead of the
            // window width/height. This may resolve the stretching issue when the
            // window height is reduced.
            const PageWidthEighty = window.innerWidth * 0.8;
            const PageHeightNinetyFive = window.innerHeight * 0.95;
            //this.ctx.save();
            this.canvas.width = PageWidthEighty;
            this.canvas.height = PageHeightNinetyFive;
            //this.ctx.restore();
            this.draw();
        };
        /**
         * @param {string} shapeId
         */
        setNewShape(shapeId) {
            let editor = this;
            return function() {
                editor.newShapeType = shapeId;
            };
        };
        processMouseClick = (eventObject) => {
            const canvasMousePosition = offsetMouseToCanvas(this.canvas, eventObject.pageX, eventObject.pageY);
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
        selectShape = (mousePosition) => {
            if (this.shapes.length < 1) {
                return;
            }
            // clear the selected shape if there is one.
            this.selectedShape = null;
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
        createShape = (position, color, width, height) => {
            if (this.newShapeType === "") {
                return;
            }
            const shape = new Shape(this.newShapeType, color, position.x, position.y, width, height);
            shape.createShapePath();
            this.shapes.push(shape);
            this.selectedShape = null;
        };
        toggleMode = (mode) => {
        const editor = this;
        return function() {
            const defaultMode = MODES.DRAW_MODE;
            editor.mode = (editor.mode !== mode) ? mode : defaultMode;
        };
        };
        deleteShape = () => {
            if (this.selectedShape !== null) {
                this.shapes.pop();
                this.selectedShape = null;
            }
            this.draw();
        };
        clearCanvas = () => {
            if ( confirm("Are you sure you want to clear the canvas?") ) {
                this.shapes.splice(0, this.shapes.length);
                this.draw();
            }
        };
        draw = () => {
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
    
    function offsetMouseToCanvas(canvas, mouseX, mouseY){
        const canvasX = canvas.offsetLeft;
        const canvasY = canvas.offsetTop;
        return {
            x: mouseX - canvasX,
            y: mouseY - canvasY,
        };
    }
})();