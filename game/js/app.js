// -------------------------------
//     Declare Global Variables
// -------------------------------

//The canvas and context track the drawing area
const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

//The game object stores all objects in the game and functions for generating and drawing them
const game = {
	monsters: [],
	mHeight: 12,
	mWidth: 12,
	mhits: 2,      //monster hit points
	mspeed: 0.5,
	objects: [],   //walls and columns
	players: [],
	bullets: [],
	generateMonsters(amount,speed) {
		let h = this.mHeight;
		let w = this.mWidth;
		let monster = {};
		for (let i = 1; i <= amount; i++) {
			//speed - pixels to move about 60 times per second
			//x1 - x coordinate of the top left corner of the monster
			//y1 - y coordinate of the top left corner of the monster
			//width - width of the monster
			//height - height of the monster
			//hits - hit points for the monster
			monster = new Monster((i-1),this.mspeed,(canvas.width - w*2),(canvas.height/(amount+1)*i - h/2),w,h,this.mhits);
			this.monsters.push(monster);

			//Start moving the monsters
			//each of the monsters will clear out the canvas and then redraw it when they are done moving
			//requestAnimationFrame(monster.move.bind(monster));
		}
		requestAnimationFrame(this.move.bind(this));
	},
	generatePlayers(amount) {
		for (let i = 0; i < amount; i++) {
			//player number
			//x1 - starting x value for the top left corner of the player
			//y1 - starting y value for the top left corner of the player
			//width - width of the player
			//height - height of the player
			this.players.push(new Player((i+1),10,(canvas.height/(amount+1)*(i+1)-5),10,10));
		}
	},
	checkCollision(obj) {
		//for an object, check if it's inside any of the other objects in the game
		//if it is, return the object it is inside of
		for (let player of this.players) {
			if (isInside(obj,player)) {
				return player;
			}
		}
		for (let object of this.objects) {
			if (isInside(obj,object)) {
				return object;
			}
		}
		for (let monster of this.monsters) {
			if (isInside(obj,monster)) {
				return monster;
			}
		}
		for (let bullet of this.bullets) {
			if (isInside(bullet,obj)) {
				return bullet;
			}
		}
		return null;
	},
	draw() {
		//draw all of the objects in the game

		//draw the walls and columns on the map
		this.drawMap();

		//draw the players
		for (let player of this.players) {
			player.draw();
		}

		//draw the monsters
		for (let monster of this.monsters) {
			monster.draw();
		}

		//draw bullets that have been fired
		for (let bullet of this.bullets) {
			bullet.draw();
		}
	},
	move() {
		//clear the canvas
		ctx.clearRect(0,0,canvas.width,canvas.height);

		//the player won if all of the monsters are dead
		if (this.monsters.length === 0) return winGame();

		//end the game if the players lost
		if (this.over) return gameOver();

		//move the monsters
		for (let monster of this.monsters) {
			monster.move();
		}

		//move bullets that have been fired
		for (let bullet of this.bullets) {
			bullet.move();
		}

		//redraw everything
		this.draw();

		requestAnimationFrame(this.move.bind(this));
	},
	drawMap() {
		ctx.beginPath();
		ctx.strokeStyle = "#000000";
		ctx.fillStyle = "#FFF";

		//calculate sizing unit for the objects based on the canvas size
		let rectToWall = canvas.height/13;

		//draw four rectangles in the corners
		drawMainRect(rectToWall,rectToWall,rectToWall*3,rectToWall*2);

		drawMainRect(rectToWall,rectToWall*10,rectToWall*3,rectToWall*2);

		drawMainRect(rectToWall*9,rectToWall,rectToWall*3,rectToWall*2);

		drawMainRect(rectToWall*9,rectToWall*10,rectToWall*3,rectToWall*2);

		ctx.closePath();


		//draw two diamonds of columns in the center of the map
		let num = 0;
		let x = 0;
		let back = false;
		let offset = 0;
		let radius = 10;
		//the number of rows of columns
		let numCol = 7;
		//the large diamond will have its top point at some height
		let yBegin = rectToWall*3;
		//the large diamond will have its bottom point at some height
		let yEnd = rectToWall*10;
		//this will be the distance between rows
		let yIter = (yEnd - yBegin)/(numCol-1);

		for (let y = yBegin; y <= yEnd; y += yIter) {
			//y from the loop picks the row
			if (num === Math.ceil(numCol/2)) {
				back = true;
			}

			if(back) {
				num--;
			}
			else {
				num++;
			}

			//create the columns at evenly spaced x values along the row
			for (let i = 1; i <= num; i++) {

				x = (canvas.width)/(num+1)*i

				drawMainColumn(x,y,radius);
			}
		}
	}
}

// ------------------------
//          Classes
// ------------------------

class Player {
	constructor(name,x1,y1,width,height) {
		//start with a weapon that does 1 damage
		this.weapon = new Weapon(1);
		this.name = name;
		this.width = width;
		this.height = height;
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = width+x1;
		this.y2 = height+y1;
		this.dir = null;
		this.speed = 6;
	}
	move(keyCode) {
		let coll = {};

		//The keyCode will have the direction to go based on the key press
		
		if (keyCode === null) {
			return
		}

		//moving right. Other keystrokes will be handled similarly
		if (keyCode === "right") {
			//move the player
			this.x1+=this.speed;
			this.x2+=this.speed;

			//update the player's direction
			this.dir = "right";
			this.weapon.dir = "right";

			//check to see if moving caused the player to collide with anything
			coll = game.checkCollision(this);
			
			//if there was a collision, move the player back to the edge of the object they collided with
			if (coll) {
				//if they collided with a monster, then game over
				if (coll.type === "monster") {
					game.over = true;
					return;
				}
				this.x1=coll.x1-this.width;
				this.x2=coll.x1;
			}

			//if they left the screen then move them back inside
			if (this.x1 < 0) {
				this.x1 = 0;
				this.x2 = this.width;
			}
			if (this.x2 > canvas.width) {
				this.x2 = canvas.width;
				this.x1 = canvas.width - this.width;
			}
		}
		if (keyCode === "left") {
			this.x1-=this.speed;
			this.x2-=this.speed;
			this.dir = "left";
			this.weapon.dir = "left";
		
			coll = game.checkCollision(this);
			
			if (coll) {
				if (coll.type === "monster") {
					game.over = true;
					return;
				}
				this.x1=coll.x2;
				this.x2=coll.x2+this.width;
			}

			if (this.x1 < 0) {
				this.x1 = 0;
				this.x2 = this.width;
			}
			if (this.x2 > canvas.width) {
				this.x2 = canvas.width;
				this.x1 = canvas.width - this.width;
			}
		}
		else if (keyCode === "down") {
			this.y1+=this.speed;
			this.y2+=this.speed;
			this.dir = "down";
			this.weapon.dir = "down";

			coll = game.checkCollision(this);
				
			if (coll) {
				if (coll.type === "monster") {
					game.over = true;
					return;
				}
				this.y1=coll.y1-this.height;
				this.y2=coll.y1;
			}

			if (this.y1 < 0) {
				this.y1 = 0;
				this.y2 = this.height;
			}
			if (this.y2 > canvas.height) {
				this.y2 = canvas.height;
				this.y1 = canvas.height - this.height;
			}
		}
		else if (keyCode === "up") {
			this.y1-=this.speed;
			this.y2-=this.speed;
			this.dir = "up";
			this.weapon.dir = "up";
			coll = game.checkCollision(this);
			
			if (coll) {
				if (coll.type === "monster") {
					game.over = true;
					return;
				}
				this.y1=coll.y2;
				this.y2=coll.y2+this.height;
			}

			if (this.y1 < 0) {
				this.y1 = 0;
				this.y2 = this.height;
			}
			if (this.y2 > canvas.height) {
				this.y2 = canvas.height;
				this.y1 = canvas.height - this.height;
			}

		}
	}
	draw() {
		//draw the player

		//begin drawing
		ctx.beginPath();

		//set the color to black
		ctx.fillStyle = "#000000";

		//set the dimensions of the player's rectangle
		ctx.rect(this.x1,this.y1,this.width,this.height);

		//fill the rectangle
		ctx.fill();

		//update the player's weapon's location and dimensions
		this.upWeapDir()

		//draw the weapon
		this.weapon.draw();
	}
	upWeapDir() {
		//update the direction and location of a weapon in relation to a player
		//the weapon is a line which is why we have a length instead of a 
		//width and a height

		if (this.weapon.dir === "right") {
			this.weapon.x1 = this.x2 - this.weapon.length/2;
			this.weapon.y1 = this.y2;
			this.weapon.x2 = this.x2 + this.weapon.length/2;
			this.weapon.y2 = this.y2;
		}
		else if (this.weapon.dir === "left") {
			this.weapon.x1 = this.x1 - this.weapon.length/2;
			this.weapon.y1 = this.y1;
			this.weapon.x2 = this.x1 + this.weapon.length/2;
			this.weapon.y2 = this.y1;
		}
		else if (this.weapon.dir === "up") {
			this.weapon.x1 = this.x2;
			this.weapon.y1 = this.y1 - this.weapon.length/2;
			this.weapon.x2 = this.x2;
			this.weapon.y2 = this.y1 + this.weapon.length/2;
		}
		else {
			this.weapon.x1 = this.x1;
			this.weapon.y1 = this.y2 - this.weapon.length/2;
			this.weapon.x2 = this.x1;
			this.weapon.y2 = this.y2 + this.weapon.length/2;
		}
	}
}

class Weapon {
	constructor(damage) {
		this.damage = damage;
		this.length = 5;
		this.dir = "right";
	}
	draw() {
		//draw the weapon
		ctx.beginPath()
		//move to the start of the line
		ctx.moveTo(this.x1,this.y1);
		//sketch to the second point of the line
		ctx.lineTo(this.x2,this.y2);
		//set the color to red
		ctx.strokeStyle = "#f00";
		//create the line
		ctx.stroke();
		ctx.closePath();
	}
	fire() {
		//fire in the direction of the weapon
		if (this.dir === "right") {
			//create a bullet starting at the tip of the weapon
			//the bullet will have the same damage as the weapon
			new Bullet(this.x2,this.y1,"right",this.damage);
		}
		else if (this.dir === "left") {
			new Bullet((this.x1-1),this.y1,"left",this.damage);
		}
		else if (this.dir === "up") {
			new Bullet(this.x1,(this.y1-1),"up",this.damage);
		}
		else {
			new Bullet(this.x2,this.y2,"down",this.damage);
		}
	}
}

class Bullet {
	constructor(x1,y1,dir,damage) {
		//set size and position
		this.width = 2;
		this.height = 2;
		this.x1 = x1;
		this.x2 = x1 + this.width;
		this.y1 = y1;
		this.y2 = y1 + this.height;

		this.dir = dir;
		//bullets will move 10 pixels per screen refresh
		this.speed = 10;
		this.damage = damage;
		this.type = "bullet";

		//add the bullet to the game
		game.bullets.push(this);
	}
	move() {
		let coll = {};

		//handle moving right (other directions will be handled similarly)
		if (this.dir === "right") {

			//move
			this.x1+=this.speed;
			this.x2+=this.speed;

			//check for a collision with anything in the game
			coll = game.checkCollision(this);

			//if there is a collision or the bullet leaves the canvas,
			//remove the bullet from the game
			if (coll || this.x1 <= 0 || this.x2 >= canvas.width) {
				//if it hit a monster, then have the monster take damage
				if (coll && coll.type === "monster") {
					coll.takeDamage(this);
				}
				//remove the bullet
				this.remove();
				return;
			}
		}
		if (this.dir === "left") {
			this.x1-=this.speed;
			this.x2-=this.speed;
		
			coll = game.checkCollision(this);
			
			if (coll || this.x1 <= 0 || this.x2 >= canvas.width) {
				if (coll && coll.type === "monster") {
					coll.takeDamage(this);
				}
				this.remove();
				return;
			}
		}
		else if (this.dir === "down") {
			this.y1+=this.speed;
			this.y2+=this.speed;

			coll = game.checkCollision(this);
				
			if (coll || this.y1 <= 0 || this.y2 >= canvas.height) {
				if (coll && coll.type === "monster") {
					coll.takeDamage(this);
				}
				this.remove();
				return;
			}
		}
		else if (this.dir === "up") {
			this.y1-=this.speed;
			this.y2-=this.speed;

			coll = game.checkCollision(this);
			
			if (coll || this.y1 <= 0 || this.y2 >= canvas.height) {
				if (coll && coll.type === "monster") {
					coll.takeDamage(this);
				}
				this.remove();
				return;
			}
		}
	}
	draw() {
		//draw the bullet
		ctx.beginPath()
		ctx.rect(this.x1,this.y1,this.width,this.height);
		//make it black
		ctx.fillStyle = "#000";
		ctx.fill();
	}
	remove() {
		//remove the bullet from the game's array of bullets
		game.bullets = game.bullets.filter(((elem) => {
			if (elem !== this) return true;
		}).bind(this));
	}
}

class Wall {
	//create an object representation of each wall and column
	//that way other objects in the game will have something to check collisions with
	constructor(x1,y1,x2,y2) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.width = this.x2 - this.x1;
		this.height = this.y2 - this.y1;
	}
}

class Monster {
	constructor(number,speed,x1,y1,width,height,hits) {
		this.number = number;
		this.type = "monster";
		this.speed = speed;

		//set the monster's location
		this.x1 = x1;
		this.y1 = y1;
		this.height = height;
		this.width = width;
		this.x2 = x1 + width;
		this.y2 = y1 + height;

		//amount of damage it can take before dying
		this.hits = hits;
	}
	move() {

		//if this zombie is dead, stop moving it
		if (this.dead) return;

		//determine which player is nearest to the monster
		let player = this.calcNearPlayer();

		//initialize variables
		let coll = {};
		let avObj = {};
		let dir = "";
		let axis = "";

		if (this.x2 < player.x2) {
			this.x1+=this.speed;
			this.x2+=this.speed;
			dir += "right";
			coll = game.checkCollision(this);
			if (coll === player) {
				game.over = true;
				return;
			}
			if (coll) {
				
				if (coll.type === "bullet") {
					this.takeDamage(coll);
					coll.remove();
				}
				//undoing move
				else {
					this.x1=coll.x1-this.width;
					this.x2=coll.x1;
					
					if (coll.type !== "monster") {
						axis = "y";
						avObj = coll;
					}
				}
			}
		}
		else if (this.x1 > player.x1) {
			this.x1-=this.speed;
			this.x2-=this.speed;
			dir += "left";
			coll = game.checkCollision(this);
			if (coll === player) {
				game.over = true;
				return;
			}
			if (coll) {
				if (coll.type === "bullet") {
					this.takeDamage(coll);
					coll.remove();
				}
				else {
					this.x1=coll.x2;
					this.x2=coll.x2+this.width;

					if (coll.type !== "monster") {
						axis = "y";
						avObj = coll;
					}
				}
			}
		}

		if (!axis) {
			if (this.y2 < player.y2) {
				this.y1+=this.speed;
				this.y2+=this.speed;
				dir += " down";
				coll = game.checkCollision(this);
				if (coll === player) {
					game.over = true;
					return;
				}
				if (coll) {
					if (coll.type === "bullet") {
						this.takeDamage(coll);
						coll.remove();
					}
					else {
						this.y1=coll.y1-this.width;
						this.y2=coll.y1;
						if (coll.type !== "monster") {
							axis = "x";
							avObj = coll;
						}
					}
				}
			}
			else if (this.y1 > player.y1) {
				this.y1-=this.speed;
				this.y2-=this.speed;
				dir += " up";
				coll = game.checkCollision(this);
				if (coll === player) {
					game.over = true;
					return;
				}
				if (coll) {
					if (coll.type === "bullet") {
						this.takeDamage(coll);
						coll.remove();
					}
					else {
						this.y1=coll.y2;
						this.y2=coll.y2+this.width;
						if (coll.type !== "monster") {
							axis = "x";
							avObj = coll;
						}
					}
				}
			}
			//try to move around the object that's in the way
			if (axis) {
				moveAround(dir,axis,this,avObj,player);
			}
		}
		//try to move around the object that's in the way
		else {
			moveAround(dir,axis,this,avObj,player);
		}
	}
	draw() {
		ctx.beginPath()
		ctx.rect(this.x1,this.y1,this.width,this.height);
		ctx.fillStyle = "#0f0";
		ctx.fill();
	}
	calcNearPlayer() {
		let prevHyp = Infinity;
		let hyp = 0;
		let nearPlayer = {};

		for (let player of game.players) {
			hyp = calcHyp(this.x1,this.y1,this.width,this.height,player);
			if (hyp < prevHyp) {
				prevHyp = hyp;
				nearPlayer = player;
			}
		}

		return nearPlayer;
	}
	takeDamage(bullet) {
		this.hits-= bullet.damage;
		if (this.hits <= 0) {

			game.monsters = game.monsters.filter(((elem) => {
				if (elem !== this) return true;
			}).bind(this));

			this.dead = true;
		}
	}
}

// -------------------------
// Main Functions
// -------------------------


function shortestDist(obj1,obj2,axis,player,dir) {
	if (axis === "y") {
		if ((obj2.y1 < player.y1 && obj2.y2 > player.y1) || (obj2.y1 < player.y2 && obj2.y2 > player.y2)) {
			return "up";
		}

		if (player.y1 < obj2.y1) {
			return "up";
		}
		else {
			return "down";
		}
	}
	else {
		if ((obj2.x1 > player.x1 && obj2.x2 < player.x1) || (obj2.x1 < player.x2 && obj2.x2 > player.x2)) {
			return "left";
		}
		if(player.x1 < obj2.x1) {
			return "left";
		}
		else {
			return "right";
		}
	}
}

function isInside(obj1,obj2) {
	if (obj1 !== obj2) {

		let wD = (obj1.width - obj2.width)/2;
		if (wD < 0) {
			wD = 0;
		}

		if (obj1.x1 > (obj2.x1 - wD) && obj1.x1 < (obj2.x2 + wD)) {
			if (obj1.y1 > (obj2.y1 - wD) && obj1.y1 < (obj2.y2 + wD)) {
				return true;
			}
			if (obj1.y2 > (obj2.y1 - wD) && obj1.y2 < (obj2.y2 + wD)) {
				return true;
			}
		}
		if (obj1.x2 > (obj2.x1 - wD) && obj1.x2 < (obj2.x2 + wD)) {
			if (obj1.y1 > (obj2.y1 - wD) && obj1.y1 < (obj2.y2 + wD)) {
				return true;
			}
			if (obj1.y2 > (obj2.y1 - wD) && obj1.y2 < (obj2.y2 + wD)) {
				return true;
			}
		}
	}
}

function moveAround(dir,axis,obj1,obj2,player) {
	//obj1 is this
	dir = dir.split(' ');
	shrtDis = shortestDist(obj1,obj2,axis,player,dir);
	
	if (axis === "y") {
		if (dir[1] === "up") {
			if (shrtDis === "up") {
				obj1.y1-=obj1.speed;
				obj1.y2-=obj1.speed;
			}
			else {
				obj1.y1+=2*obj1.speed;
				obj1.y2+=2*obj1.speed;
			}
		}
		else {
			if (shrtDis === "up") {
				obj1.y1-=2*obj1.speed;
				obj1.y2-=2*obj1.speed;
			}
			else {
				obj1.y1+=obj1.speed;
				obj1.y2+=obj1.speed;
			}
		}
	}
	else {
		if (dir[0] === "right") {
			if (shrtDis === "right") {
				obj1.x1+=obj1.speed;
				obj1.x2+=obj1.speed;
			}
			else {
				obj1.x1-=2*obj1.speed;
				obj1.x2-=2*obj1.speed;
			}
		}
		else {
			if (shrtDis === "right") {
				obj1.x1+=2*obj1.speed;
				obj1.x2+=2*obj1.speed;
			}
			else {
				obj1.x1-=obj1.speed;
				obj1.x2-=obj1.speed;
			}
		}
	}
}

function gameOver() {
	ctx.closePath();
	ctx.clearRect(0,0,canvas.width,canvas.height);
	game.over = true;
	ctx.beginPath();
	ctx.fillStyle = "#000000";
	ctx.font = "30px Georgia";
	ctx.fillText("Game over.",265,300);
}

function winGame() {
	ctx.clearRect(0,0,canvas.width,canvas.height);
	game.over = true;
	ctx.beginPath();
	ctx.fillStyle = "#000000";
	ctx.font = "30px Georgia";
	ctx.fillText("You win!",270,300);
}

// ------------------------
// Code to Start the Game
// ------------------------

game.generatePlayers(2)

game.generateMonsters(5);

game.drawMap();

// -------------------------
// Listeners for Key Presses
// -------------------------

$('body').on('keydown',(e) => {
	let key = e.keyCode;
	if (key === 87) {
		game.players[1].move("up");
		game.players[0].move(game.players[0].dir);
	}
	else if (key === 83) {
		game.players[1].move("down");
		game.players[0].move(game.players[0].dir);
	}
	else if (key === 65) {
		game.players[1].move("left");
		game.players[0].move(game.players[0].dir);
	}
	else if (key === 68) {
		game.players[1].move("right");
		game.players[0].move(game.players[0].dir);
	}
	else if (key === 38) {
		game.players[0].move("up");
		game.players[1].move(game.players[1].dir);
	}
	else if (key === 40) {
		game.players[0].move("down");
		game.players[1].move(game.players[1].dir);
	}
	else if (key === 37) {
		game.players[0].move("left");
		game.players[1].move(game.players[1].dir);
	}
	else if (key === 39) {
		game.players[0].move("right");
		game.players[1].move(game.players[1].dir);
	}
	else if (key === 13) {
		game.players[0].weapon.fire();
	}
	else if (key === 192) {
		game.players[1].weapon.fire();
	}

})

$('body').on('keyup',(e) => {
	let key = e.keyCode;
	if (key === 87) {
		game.players[1].dir = null;
	}
	else if (key === 83) {
		game.players[1].dir = null;
	}
	else if (key === 65) {
		game.players[1].dir = null;
	}
	else if (key === 68) {
		game.players[1].dir = null;
	}
	else if (key === 38) {
		game.players[0].dir = null;
	}
	else if (key === 40) {
		game.players[0].dir = null;
	}
	else if (key === 37) {
		game.players[0].dir = null;
	}
	else if (key === 39) {
		game.players[0].dir = null;
	}

})


// -----------------------------------
// Helper Functions
// -----------------------------------

function drawMainRect(x,y,width,height) {
	ctx.rect(x,y,width,height);
	ctx.fill();
	ctx.stroke();

	let x2 = Math.ceil(x+width)+2;
	let y2 = Math.ceil(y+height)+2;
	x = Math.floor(x)-2;
	y = Math.floor(y)-2;
	game.objects.push(new Wall(x,y,x2,y2));
}

function drawMainColumn(x,y,r) {
	ctx.beginPath();

	ctx.arc(x,y,r,0,Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	ctx.closePath();

	let x2 = Math.ceil(x+r)+1;
	let y2 = Math.ceil(y+r)+1;
	x = Math.floor(x-r)-1;
	y = Math.floor(y-r)-1;
	game.objects.push(new Wall(x,y,x2,y2));
}

function calcHyp(x1,y1,width,height,player) {
	let cX = x1+width/2;
	let cY = y1+height/2;
	let pCX = player.x1 + player.width/2;
	let pCY = player.y1 + player.height/2;

	return Math.sqrt(Math.pow(Math.abs(cX - pCX),2)+Math.pow(Math.abs(cY - pCY),2));

}









