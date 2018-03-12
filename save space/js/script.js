var game = new Phaser.Game(1920, 1080, Phaser.AUTO, 'Projet Space', { preload: preload, create: create }, true);


const BACKGROUND_COLOR = 0xEEEEEE;

const DROP_SURFACE_COLOR = 0xBBBBBB;
//width and height of the drop surface rectangle
const DROP_SURFACE_WIDTH = 240;
const DROP_SURFACE_HEIGHT = 60;
//width and height around the drop surface rectangle for which the drop is still valid
const DROP_SURFACE_WIDTH_OVERFLOW = DROP_SURFACE_WIDTH/3;
const DROP_SURFACE_HEIGHT_OVERFLOW = DROP_SURFACE_HEIGHT/3;

const DRAGGABLE_TEXT_HEIGHT = 32;
const DRAGGABLE_TEXT_FONT = DRAGGABLE_TEXT_HEIGHT.toString() + "px Courier";
//const DRAGGABLE_TEXT_FONT = DRAGGABLE_TEXT_HEIGHT.toString() + "px Revalia";

const DRAGGABLE_TEXT_FILL = "#19cb65";
//const DRAGGABLE_TEXT_FIXED_FILL = "#DDDD00";

const TEXT_SPEED = 1;//25;

var draggableTexts = [];
var dropSurfaces = [];

var questionID = 0;

function preload() {
	game.load.image('title_text', 'assets/title/title_text.png');
	game.load.image('title_back', 'assets/title/title_back.png');
	game.load.image('title_window', 'assets/title/title_window.png');
	game.load.image('button_play', 'assets/title/button_play.png');

	game.load.image('play_back', 'assets/play/play_back.png');
	game.load.image('play_window', 'assets/play/play_window.png');

	game.load.image('space_junk', 'assets/images/space_junk.jpg');

	game.load.image('validationButton', 'validation_button.png');

	game.load.json('lesson', 'json/lesson.json');
	game.load.json('dragAndDrop', 'json/drag&drop.json');
}

function create() {
	game.scale.scaleMode = Phaser.ScaleManager.aspectRatio;
	game.scale.pageAlignHorizontally = true;
	game.scale.pageAlignVertically = true;
	game.scale.setShowAll();
	game.scale.refresh();

	//createPlayScene();
	createTitleScene();
}

function update() {
	game.scale.setShowAll();
	game.scale.refresh();
}

function createTitleScene() {
	title_back = game.add.image(0, 0, 'title_back');
	title_text = game.add.image(359, 50, 'title_text');
	title_window = game.add.image(510, 260, 'title_window');
	title_jouer = game.add.image(597, 360, 'button_play');

	title_jouer.inputEnabled = true;
	title_jouer.events.onInputDown.add(titleToPlayTransition, this);
}

function destroyTitleScene() {
	title_back.destroy();
	title_text.destroy();
	title_window.destroy();
	title_jouer.destroy();
}

function titleToPlayTransition() {
	destroyTitleScene();
	createPlayScene();
}

function createPlayScene() {
	play_back = game.add.image(0, 0, 'play_back');
	play_window = game.add.image(20, 0, 'play_window');

	play_graphics = game.add.graphics(0, 0);

	//createGapFillQuestion();
	createLesson();
	//createDragAndDropQuestion();
	/*button = game.add.sprite(930, 590, 'validationButton');
	button.anchor.set(0.5, 0.5);
	button.inputEnabled = true;
	button.events.onInputDown.add(checkDragAndDropAnswers, this);*/
}

//
/*
	LESSON
	  FUNCTIONS
*/
//

function createLesson() {
	lesson = game.cache.getJSON('lesson');

	pageID = 0;
	textID = 0;
	lineID = 0;
	typewriteText(textID);
	console.log('Un texte a été construit.');

	//img = game.add.image(1200, 170, 'space_junk');
	img = game.add.image(400, 600, 'space_junk');
	img.scale.setTo(.5, .5);
}

function typewriteText(textID) {
	//write new line
	if (lineID < lesson[pageID][textID].content.length) {
		typewriteLine(lesson[pageID][textID].x, lesson[pageID][textID].y+lineID*40, lesson[pageID][textID].content[lineID], textID);
		console.log('Une ligne a été construite.');
	}
	else {
		if (textID < lesson[pageID].length-1) {
			lineID = 0;
			textID++;
			typewriteText(textID);sy
			console.log('Un texte a été construit.');
			game.paused = true;
			game.time.events.add(Phaser.Timer.SECOND * 1, unpause, this);
		}
	}
}

function unpause(){
	game.paused = false;
}

function typewriteLine(x, y, fullText, textID) {
	var currentTextIndex = 0;
	var currentText = fullText[currentTextIndex];
	typewriteLetter(x, y, fullText, currentText, currentTextIndex, textID);
	console.log('Une lettre a été construite.');
}

function typewriteLetter(x, y, fullText, currentText, currentTextIndex, textID) {
	var currentTextIndex = currentTextIndex+1;
	var currentText = currentText + fullText[currentTextIndex];

	game.add.text(x, y, currentText, { font: DRAGGABLE_TEXT_FONT, fill: DRAGGABLE_TEXT_FILL, align: "center" });
	if (currentTextIndex < fullText.length-1) {
		game.time.events.add(TEXT_SPEED, typewriteLetter, this, x, y, fullText, currentText, currentTextIndex, textID);
	}
	else {
		lineID++;
		typewriteText(textID);
		console.log('Un texte a été construit.');
	}
}

//
/*
	DRAG AND DROP
	  FUNCTIONS
*/
//

function createDragAndDropQuestion() {
	dragAndDrop = game.cache.getJSON('dragAndDrop');

	game.add.text(dragAndDrop[0].sentence.x, dragAndDrop[0].sentence.y, dragAndDrop[0].sentence.content, { font: DRAGGABLE_TEXT_FONT, fill: DRAGGABLE_TEXT_FILL, align: "center" });

	createDraggableTexts(0);
	createDropSurfaces(0);

	//adds event listeners
	for (i in draggableTexts) {
		draggableTexts[i].events.onDragStart.add(unfixDraggableText);
		draggableTexts[i].events.onDragStop.add(checkDropSurfaces);
	}
}

//calls the creation of all draggable texts as defined in drag&drop.json
function createDraggableTexts() {
	for (i in dragAndDrop[questionID].draggableText) {
		var draggableText = dragAndDrop[questionID].draggableText[i];
		createDraggableText(draggableText);
	}
}

//creates a draggable text and adds it to the draggableTexts array
//sets the text property textID to the corresponding draggableText ID from drag&drop.json
function createDraggableText(draggableText) {
	var text = game.add.text(draggableText.x, draggableText.y, draggableText.content, { font: DRAGGABLE_TEXT_FONT, fill: DRAGGABLE_TEXT_FILL, align: "center" });
	text.anchor.set(0.5, 0.5);
	text.inputEnabled = true;
	text.input.enableDrag();

	for (i in dragAndDrop[questionID].draggableText) {
		if (dragAndDrop[questionID].draggableText[i] == draggableText) {
			text.textID = i;
		}
	}

	draggableTexts.push(text);
}

//calls the creation of all drop surfaces as defined in drag&drop.json
//calls the drawing of each of those drop surfaces
function createDropSurfaces() {
	for (i in dragAndDrop[questionID].draggableText) {
		var dropSurface = dragAndDrop[questionID].dropSurface[i];
		createDropSurface(dropSurface);
		drawDropSurface(dropSurface); //comment to disable drop surfaces rectangles
	}
}

//creates a drop surface and adds it to the dropSurfaces array
function createDropSurface(dropSurface) {
	var dropSurfaceRect = new Phaser.Rectangle(dropSurface.x-DROP_SURFACE_WIDTH_OVERFLOW/2, dropSurface.y-DROP_SURFACE_HEIGHT_OVERFLOW/2, DROP_SURFACE_WIDTH + DROP_SURFACE_WIDTH_OVERFLOW, DROP_SURFACE_HEIGHT + DROP_SURFACE_HEIGHT_OVERFLOW);
	dropSurfaces.push(dropSurfaceRect);
}

//draws a drop surface rectangle
function drawDropSurface(dropSurface) {
	play_graphics.beginFill(DROP_SURFACE_COLOR);
	play_graphics.drawRect(dropSurface.x, dropSurface.y, DROP_SURFACE_WIDTH, DROP_SURFACE_HEIGHT);
	play_graphics.endFill();
}

//check draggable text drop position against all drop surfaces
function checkDropSurfaces(sprite, pointer) {
	for (i in dropSurfaces) {
		if ((pointer.x > dropSurfaces[i].x && pointer.x < dropSurfaces[i].x+dropSurfaces[i].width) && (pointer.y > dropSurfaces[i].y && pointer.y < dropSurfaces[i].y+dropSurfaces[i].height)) {
			var dropSurface = dragAndDrop[questionID].dropSurface[i];
			if (dropSurface.textID != null) {
				resetDraggableText(dropSurface.textID);
				unfixDraggableText(draggableTexts[dropSurface.textID]);
			}
			fixDraggableText(sprite, dropSurfaces[i].x, dropSurfaces[i].y, dropSurfaces[i].width, dropSurfaces[i].height, i);
			return;
		}
	}
}

//fix a draggable text at the center of the drop surface it was dropped on
function fixDraggableText(sprite, x, y, width, height, surfaceID) {
	sprite.x = x+width/2;
	sprite.y = y+height/2;
	//sprite.fill = DRAGGABLE_TEXT_FIXED_FILL;
	dragAndDrop[questionID].dropSurface[surfaceID].textID = sprite.textID;
}

//unfix a draggable text from a drop surface
function unfixDraggableText(sprite) {
	//sprite.fill = DRAGGABLE_TEXT_FILL;
	for (i in dragAndDrop[questionID].dropSurface) {
		var dropSurface = dragAndDrop[questionID].dropSurface[i];
		if (dropSurface.textID == sprite.textID) {
			dropSurface.textID = null;
			break;
		}
	}
}

//resets a draggable text to its initial position
function resetDraggableText(id) {
	draggableTexts[id].x = dragAndDrop[questionID].draggableText[id].x;
	draggableTexts[id].y = dragAndDrop[questionID].draggableText[id].y;
}

function checkDragAndDropAnswers() {
	for (i in dragAndDrop[questionID].dropSurface) {
		if (dragAndDrop[questionID].dropSurface[i].textID != i) {
			console.log("false");
			return false;
		}
	}
	console.log("true");
	return true;
}

function changeDragAndDropAnswersColor() {
	for (i in dragAndDrop[questionID].dropSurface) {
		if (dragAndDrop[questionID].dropSurface[i].textID == i) {
			drag
		}
	}
}

//
/*
	GAP FILL
	  FUNCTIONS
*/
//

function createGapFillQuestion() {
	//gapFill = game.cache.getJSON('gapFill');

	var txtTrouJSON = {0:"Missing    ",1:" doit ",2:"Missing  ",3:" faire, ",4:"Missing      ",5:"."};
	var i = 0
	txtTrouJSON[i].length = 0;
	while (txtTrouJSON[i] != undefined){
	  txtTrouJSON[i].length += 1;
	  i ++;
	}
	txtTrouJSON.length = 6;
	var txtTrou = "";
	var state = 0;
	var motsPourTxtTrou = {"Missing1":"Théo","Missing2":"le","Missing3":"Romain"};

	  //Launching physics system (ARCADE)
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.stage.backgroundColor = "#4488AA";
  //Setting world width and height
  // game.world.width = worldWidth;
  // game.world.height = worldHeight;
for (var i = 0; i < txtTrouJSON.length ; i++){
  if (!~txtTrouJSON[i].indexOf('Missing')){
    txtTrou += txtTrouJSON[i];
  }
  else{
    var x = document.createElement("TEXTAREA");
    x.id = "Missing"+i;
    x.placeholder="Remplis";
    document.body.appendChild(x);
    txtTrou += txtTrouJSON[i].replace('Missing','');
    //console.log(x.id);
  }
}

var text = game.add.text(380, 180, txtTrou, { font: DRAGGABLE_TEXT_FONT, fill: DRAGGABLE_TEXT_FILL, align: "center" });
}
