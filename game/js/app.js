// -------------------------------
//     Declare Global Variables
// -------------------------------

//The canvas and context track the drawing area
const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

const availableWeapons = ['"uzi",1,10,30,2,10,canvas.width/2,120,false',
						'"shotgun",3,2,10,3.5,11,canvas.width/4,50,false',
						'"rocket",10,1,3,5,17,canvas.width,6,true'];

// ------------------------
//          Classes
// ------------------------

class Game {
	constructor() {
		this.monsters = [];
		this.mHeight = 12;
		this.mWidth = 12;
		this.mHits = 2;      //monster hit points
		this.mNum = 3;
		this.mSpeed = 0.5;
		this.bossW = 16;
		this.bossH = 16;
		this.bossS = 0.7;
		this.bossHit = 5;
		this.objects = [];   //walls and columns
		this.players = [];
		this.bullets = [];
		this.weapons = [];
		this.explosions = [];
		this.round = 1;
	}
	generateMonsters(speed) {
		let amount = this.mNum;
		let h = this.mHeight;
		let w = this.mWidth;
		let monster = {};
		let row = 2;
		for (let i = 1; i <= this.mNum; i++) {
			if (i%5 === 0) {
				row+=2;
			}
			//speed - pixels to move about 60 times per second
			//x1 - x coordinate of the top left corner of the monster
			//y1 - y coordinate of the top left corner of the monster
			//width - width of the monster
			//height - height of the monster
			//hits - hit points for the monster
			monster = new Monster(this.mSpeed,(canvas.width + w*row),(canvas.height/(amount+1)*i - h/2),w,h,this.mHits,"#0f0");
			this.monsters.push(monster);

			//Start moving the monsters
			//each of the monsters will clear out the canvas and then redraw it when they are done moving
			//requestAnimationFrame(monster.move.bind(monster));
		}
		requestAnimationFrame(this.move.bind(this));
	}
	generatePlayers(amount) {
		for (let i = 0; i < amount; i++) {
			//player number
			//x1 - starting x value for the top left corner of the player
			//y1 - starting y value for the top left corner of the player
			//width - width of the player
			//height - height of the player
			this.players.push(new Player((i+1),10,(canvas.height/(amount+1)*(i+1)-5),10,10));
		}
	}
	generateWeapons() {
		clearTimeout(game.wTime);
		game.weapons = [];
		let wX = 0; //weapon x
		let wY = 0; //weapon y
		let weapon = {};
		for (let i = 0; i < 5; i++) {
			wX = canvas.width/26
			if (i === 1 || i === 3) {
				wX += (canvas.height/26)*24;
			} 
			wY = canvas.height/26;
			if (i >= 3) {
				wY += canvas.height*24/26;
			}

			let coordStr = ','+wX+','+wY+')'
			eval("weapon = new Weapon(" + availableWeapons[i%availableWeapons.length] + coordStr);

			if (weapon.name === "rocket") {
				if (game.round%5 === 0) {
					weapon.x1 = (canvas.width - weapon.length)/2;
					weapon.y1 = (canvas.height - weapon.thickness)/2;
					weapon.x2 = weapon.x1 + weapon.width;
					weapon.y2 = weapon.y1 + weapon.height;

					this.weapons.push(weapon);
				}
			}
			else {
				this.weapons.push(weapon);
			}
		}
		game.wTime = setTimeout(this.generateWeapons.bind(this),60000);
	}
	buffMonsters() {
		this.mHits++;
		this.bossHit+=2;
		this.mNum += 3*this.round;
		if (this.round%5 === 0) {
			this.mSpeed += 0.1;
			for (let i = 0; i < this.round/5; i++) {
				this.monsters.push(new Monster(this.bossS,canvas.width/2,((i%2)*canvas.height-((-1)*(i%2))*20),this.bossW,this.bossH,this.bossHit,"#f00"));
			}
		}
	}
	checkCollision(obj) {
		//for an object, check if it's inside any of the other objects in the game
		//if it is, return the object it is inside of
		
		if (obj.type !== "weapon") {
			for (let player of this.players) {
				if (isInside(obj,player)) {
					return player;
				}
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

		if (obj.type === "monster") {
			for (let bullet of this.bullets) {
				if (isInside(obj,bullet)) {
					return bullet;
				}
			}

			for (let explosion of this.explosions) {
				if (isInside(obj,explosion)) {
					return explosion;
				}
			}
		}

		if (obj.type === "player") {
			for (let weapon of this.weapons) {
				if (isInside(obj,weapon)) {
					return weapon;
				}
			}
		}

		return null;
	}
	draw() {
		//draw all of the objects in the game
		
		//draw explosions
		for (let explosion of this.explosions) {
			explosion.draw();
		}

		//draw the walls and columns on the map
		this.drawMap();

		//draw bullets that have been fired
		for (let bullet of this.bullets) {
			bullet.draw();
		}

		//draw weapons
		for (let weapon of this.weapons) {
			weapon.draw();
		}

		//draw the players
		for (let player of this.players) {
			player.draw();
		}

		//draw the monsters
		for (let monster of this.monsters) {
			monster.draw();
		}
	}
	move() {
		//clear the canvas
		ctx.clearRect(0,0,canvas.width,canvas.height);

		//the player won if all of the monsters are dead
		if (this.monsters.length === 0) return winGame();

		//end the game if the players lost
		if (this.over) return gameOver();
		
		//move the players
		for (let player of this.players) {
			player.move();
		}

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
	}
	drawMap() {
		game.objects = [];
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

class Player {
	constructor(name,x1,y1,width,height) {
		//start with a weapon that does 1 damage
		this.weapon = new Weapon("pistol",1,2,Infinity,2,5,canvas.width/2,Infinity,0,0);
		this.name = name;
		this.type = "player";
		this.width = width;
		this.height = height;
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = width+x1;
		this.y2 = height+y1;
		this.dir = null;
		this.prevDir = "right";
		this.speed = 1.5;
		this.inventory = [this.weapon];
	}
	move() {
		let coll = {};
		let wColl = {};

		//The direction to go based on the last key press
		let dir = this.dir; 

		if (dir === null) {
			return;
		}

		//moving right. Other keystrokes will be handled similarly
		if (dir === "right") {
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
				if (coll.type === "weapon") {
					this.pickUpWeapon(coll);
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

			//update the player's weapon's location and dimensions
			this.upWeapDir();

			wColl = game.checkCollision(this.weapon);
			if (wColl) {
				if (wColl.y1 >= this.y2) {
					this.y2 = wColl.y1 - this.weapon.thickness*0.75;
					this.y1 = this.y2 - this.height;
				}
			}
		}
		if (dir === "left") {
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
				if (coll.type === "weapon") {
					this.pickUpWeapon(coll);
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

			//update the player's weapon's location and dimensions
			this.upWeapDir();
			wColl = game.checkCollision(this.weapon);

			if (wColl) {
				if (wColl.y2 <= this.y1) {
					this.y1 = wColl.y2 + this.weapon.thickness*0.75;
					this.y2 = this.y1 + this.height;
				}
			}
		}
		else if (dir === "down") {
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
				if (coll.type === "weapon") {
					this.pickUpWeapon(coll);
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

			//update the player's weapon's location and dimensions
			this.upWeapDir();
			wColl = game.checkCollision(this.weapon);

			if (wColl) {
				if (wColl.x2 <= this.x1) {
					this.x1 = wColl.x2 + this.weapon.thickness*0.75;
					this.x2 = this.x1 + this.width;
				}
			}
		}
		else if (dir === "up") {
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
				if (coll.type === "weapon") {
					this.pickUpWeapon(coll);
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

			//update the player's weapon's location and dimensions
			this.upWeapDir();
			wColl = game.checkCollision(this.weapon);

			if (wColl) {
				if (wColl.x1 >= this.x2) {
					this.x2 = wColl.x1 - this.weapon.thickness*0.75;
					this.x1 = this.x2 - this.width;
				}
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

		//update the location of the weapon
		this.upWeapDir();

		//draw the weapon
		this.weapon.draw();
	}
	upWeapDir() {
		//update the direction and location of a weapon in relation to a player
		//the weapon is a line which is why we have a length instead of a 
		//width and a height

		if (this.weapon.dir === "right") {
			this.weapon.x1 = this.x2 - this.weapon.length/2;
			this.weapon.y1 = this.y2 - this.weapon.thickness/4;
			this.weapon.x2 = this.x2 + this.weapon.length/2;
			this.weapon.y2 = this.y2 + this.weapon.thickness*3/4;
		}
		else if (this.weapon.dir === "left") {
			this.weapon.x1 = this.x1 - this.weapon.length/2;
			this.weapon.y1 = this.y1 - this.weapon.thickness*3/4;
			this.weapon.x2 = this.x1 + this.weapon.length/2;
			this.weapon.y2 = this.y1 + this.weapon.thickness/4;
		}
		else if (this.weapon.dir === "up") {
			this.weapon.x1 = this.x2 - this.weapon.thickness/4;
			this.weapon.y1 = this.y1 - this.weapon.length/2;
			this.weapon.x2 = this.x2 + this.weapon.thickness*3/4;
			this.weapon.y2 = this.y1 + this.weapon.length/2;
		}
		else {
			this.weapon.x1 = this.x1 - this.weapon.thickness*3/4;
			this.weapon.y1 = this.y2 - this.weapon.length/2;
			this.weapon.x2 = this.x1 + this.weapon.thickness/4;
			this.weapon.y2 = this.y2 + this.weapon.length/2;
		}
	}
	pickUpWeapon(weapon) {
		for (let weap of this.inventory) {
			if (weap.name === weapon.name) {
				weap.ammo += weapon.ammo;
				if (weap.ammo > weap.maxAmmo) {
					weap.ammo = weap.maxAmmo;
				}
				weapon.remove();
				return;
			}
		}

		this.inventory.push(weapon);
		weapon.remove();
	}
	cycleWeapon() {
		let index = this.inventory.indexOf(this.weapon) + 1;
		if (index > this.inventory.length-1) {
			index = 0;
		}
		this.weapon = this.inventory[index];
		this.weapon.dir = this.prevDir;
	}
}

class Weapon {
	constructor(name,damage,firerate,ammo,thickness=1,length=5,range,maxAmmo,explosive,x1,y1) {
		this.name = name;
		this.type = "weapon";
		this.damage = damage;
		this.length = length;
		this.dir = "right";
		this.fr = firerate;
		this.firing = false;
		this.ammo = ammo;
		this.maxAmmo = maxAmmo;
		this.range = range;
		this.exp = explosive;

		//size and position
		this.width = length;
		this.height = thickness;
		this.thickness = thickness;
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x1 + this.width;
		this.y2 = y1 + this.height;
		
	}
	draw() {
		//draw the weapon
		ctx.beginPath()
		ctx.rect(this.x1,this.y1,this.x2-this.x1,this.y2-this.y1);
		ctx.fillStyle = "#f00";
		ctx.fill();
		ctx.closePath();
		ctx.lineWidth = 1;
	}
	fire() {
		//tell the game that this weapon is firing a bullet
		//and don't allow the weapon to fire if it's already firing
		if (this.firing) {
			return;
		}

		if (this.ammo === 0) {
			return;
		}

		this.firing = true;
		this.ammo--;

		//fire in the direction of the weapon
		if (this.dir === "right") {
			//create a bullet starting at the tip of the weapon
			//the bullet will have the same damage as the weapon
			new Bullet(this.x2,this.y1,"right",this.damage,this.thickness,this.range,this.exp);
		}
		else if (this.dir === "left") {
			new Bullet((this.x1-this.thickness-1),this.y1,"left",this.damage,this.thickness,this.range,this.exp);
		}
		else if (this.dir === "up") {
			new Bullet(this.x1,(this.y1-this.thickness-1),"up",this.damage,this.thickness,this.range,this.exp);
		}
		else {
			new Bullet(this.x2,this.y2,"down",this.damage,this.thickness,this.range,this.exp);
		}

		//stop firing after an amount of time (1 second divided by the firerate)
		setTimeout(() => {
			this.firing = false;
		},(1000/this.fr));
	}
	remove() {
		//remove the weapon from the game's array of weapons
		//Its movement will be handled by the player now
		game.weapons = game.weapons.filter(((elem) => {
			if (elem !== this) return true;
		}).bind(this));
	}
}

class Bullet {
	constructor(x1,y1,dir,damage,width,range,explosive) {
		//set size and position
		if (width < 2) {
			width = 2;
		}
		this.width = width;
		this.height = width;
		this.x1 = x1;
		this.x2 = x1 + this.width;
		this.y1 = y1;
		this.y2 = y1 + this.height;

		this.dir = dir;
		this.range = range;
		this.startX = x1;
		this.startY = y1;
		
		//bullets will move 10 pixels per screen refresh
		this.speed = 10;
		this.damage = damage;
		this.type = "bullet";
		this.exp = explosive;

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
			if (coll || this.x1 <= 0 || this.x2 >= canvas.width || this.x2 >= this.startX+this.range) {
				
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
			
			if (coll || this.x1 <= 0 || this.x2 >= canvas.width || this.x1 <= this.startX-this.range) {
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
				
			if (coll || this.y1 <= 0 || this.y2 >= canvas.height || this.y2 >= this.startY+this.range) {
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
			
			if (coll || this.y1 <= 0 || this.y2 >= canvas.height || this.y1 <= this.startY-this.range) {
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
		if (this.exp) {
			this.explode();
		}
		//remove the bullet from the game's array of bullets
		game.bullets = game.bullets.filter(((elem) => {
			if (elem !== this) return true;
		}).bind(this));
	}
	explode() {
		new Explosion(this.damage,this.x1+this.width/2,this.y1+this.height/2);
	}
}

class Explosion {
	constructor(damage,x1,y1) {
		this.damage = damage;
		this.size = 30;
		this.x1 = x1 - this.size/2;
		this.y1 = y1 - this.size/2;
		this.x2 = this.x1 + this.size;
		this.y2 = this.y1 + this.size;
		this.color = "#FFA500";
		this.type = "explosion";

		this.int = setInterval(this.toggleColor.bind(this),200);
		game.explosions.push(this);
		setTimeout(this.remove.bind(this),1000);
	}
	draw() {
		//draw the bullet
		ctx.beginPath()
		ctx.rect(this.x1,this.y1,this.size,this.size);
		//make it black
		ctx.fillStyle = this.color;
		ctx.fill();
	}
	toggleColor() {
		if (this.color === "#FFA500") {
			this.color = "#DDDDDD";
		}
		else {
			this.color = "#FFA500";
		}
	}
	remove() {
		clearInterval(this.int);

		//remove the explosion from the game's array of explosions
		game.explosions = game.explosions.filter(((elem) => {
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
	constructor(speed,x1,y1,width,height,hits,color) {
		this.type = "monster";
		this.speed = speed;
		this.color = color;

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
		let type = "";

		//if the monster is to the player's left then move right
		if (this.x2 < player.x2) {
			//do the move to the right
			this.x1+=this.speed;
			this.x2+=this.speed;
			dir += "right";

			//check to see if moving right caused a collision
			//coll is the object that was collided with
			coll = game.checkCollision(this);

			//if there was a collision
			if (coll) {
				
				type = coll.type;
				
				//if the monster collided with a player, then they lost
				if (type === "player") {
					game.over = true;
					return;
				}

				//if the collision was with a bullet, take damage
				if (type === "bullet" || type === "explosion") {
					this.takeDamage(coll);

					//remove the bullet from the game
					if (type === "bullet") {
						coll.remove();
					}
				}

				//undo the move that caused the collision
				else {
					this.x1=coll.x1-this.width;
					this.x2=coll.x1;
					
					//if you didn't collide with a monster,
					//prepare to move around the object you collided with
					if (type !== "monster") {
						axis = "y";
						avObj = coll;
					}
				}
			}
		}
		//else if to the player's right, move left
		else if (this.x1 > player.x1) {
			this.x1-=this.speed;
			this.x2-=this.speed;
			dir += "left";
			coll = game.checkCollision(this);
			
			if (coll) {
				type = coll.type;

				if (type === "player") {
					game.over = true;
					return;
				}

				if (type === "bullet" || type === "explosion") {
					this.takeDamage(coll);
					if (type === "bullet") {
						coll.remove();
					}
				}
				else {
					this.x1=coll.x2;
					this.x2=coll.x2+this.width;

					if (type !== "monster") {
						axis = "y";
						avObj = coll;
					}
				}
			}
		}
		//if we are above the player, move up 
		if (this.y2 < player.y2) {
			this.y1+=this.speed;
			this.y2+=this.speed;
			dir += " down";

			coll = game.checkCollision(this);

			if (coll) {
				type = coll.type;

				if (type === "player") {
					game.over = true;
					return;
				}

				if (type === "bullet" || type === "explosion") {
					this.takeDamage(coll);
					if (type === "bullet") {
						coll.remove();
					}
				}
				else {
					this.y1=coll.y1-this.width;
					this.y2=coll.y1;

					if (type !== "monster") {
						axis = "x";
						avObj = coll;
					}
				}
			}
		}
		//if we're below the player, move up
		else if (this.y1 > player.y1) {
			this.y1-=this.speed;
			this.y2-=this.speed;
			dir += " up";

			coll = game.checkCollision(this);
			
			if (coll) {
				type = coll.type;

				if (type === "player") {
					game.over = true;
					return;
				}

				if (type === "bullet" || type === "explosion") {
					this.takeDamage(coll);
					if (type === "bullet") {
						coll.remove();
					}
				}
				else {
					this.y1=coll.y2;
					this.y2=coll.y2+this.width;

					if (type !== "monster") {
						axis = "x";
						avObj = coll;
					}
				}
			}
		}

		//if axis was set, then there was a collision
		//make a move around the object that's in the way
		if (axis) {
			moveAround(dir,axis,this,avObj,player);
		}
	}
	draw() {
		//draw a rectangle for the monster
		ctx.beginPath()
		ctx.rect(this.x1,this.y1,this.width,this.height);
		//make them green
		ctx.fillStyle = this.color;
		ctx.fill();
	}
	calcNearPlayer() {
		//calculate the nearest player

		//initialize variables
		let prevHyp = Infinity;
		let hyp = 0;
		let nearPlayer = {};

		//loop through the players and
		//calculate the hypotenuse between the monster and the player
		//the player with the smallest hypotenuse is saved in nearPlayer
		for (let player of game.players) {
			hyp = calcHyp(this.x1,this.y1,this.width,this.height,player);
			if (hyp < prevHyp) {
				prevHyp = hyp;
				nearPlayer = player;
			}
		}

		//return the player with the smallest hypotenuse
		return nearPlayer;
	}
	takeDamage(obj) {
		//take damage from a bullet
		this.hits-= obj.damage;

		//if hit points are zero, remove the zombie from the game
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

function isInside(obj1,obj2) {
	//checks to see if obj1 has collided with obj2
	//obj1 is the object that moved

	//if obj1 and obj2 are the same object then don't check
	if (obj1 !== obj2) {

		for (let x = obj1.x1; x <= obj1.x2; x++) {
			//if the moving object's x value is within the other object's x range
			if (x > obj2.x1 && x < obj2.x2) {
				//and the moving object's y values are within the other object's y range
				//then return true
				for (let y = obj1.y1; y <= obj1.y2; y++) {
					if (y > obj2.y1 && y < obj2.y2) {
						return true;
					}
				}
			}
		}
	}
}

function moveAround(dir,axis,obj1,obj2,player) {
	//move an object around another object that it collided with
	//obj1 - the moving object
	//axis - comes from the move function. It's the opposite axis from the collision axis.
	//If the collision happens while moving on the x axis then y will be passed in.

	//the direction is stored like "right down" so split it into ["right","down"]
	dir = dir.split(' ');

	//calculate the shortest distance around the object and toward the player
	shrtDis = shortestDist(obj1,obj2,axis,player,dir);
	
	//If the y axis is free to be moved on
	if (axis === "y") {
		//If they were moving up
		if (dir[1] === "up") {
			//then just make one more move in that direction
			if (shrtDis === "up") {
				obj1.y1-=obj1.speed;
				obj1.y2-=obj1.speed;
			}
			//otherwise, undo the move on the free axis
			//then do one more move in the correct direction
			//for a total of two moves
			else {
				obj1.y1+=2*obj1.speed;
				obj1.y2+=2*obj1.speed;
			}
		}
		//If they were moving down
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
	//If the x axis is free for movement
	else {
		//If they were moving right on the free axis
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
		//if they were moving left on the free axis
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

function shortestDist(obj1,obj2,axis,player,dir) {
	//calculate the shortest distance around an object and toward a player

	//if the y axis is free for movement
	if (axis === "y") {
		//if the player is behind the object, then go toward the nearest side of the object
		if ((obj2.y1 < player.y1 && obj2.y2 > player.y1) || (obj2.y1 < player.y2 && obj2.y2 > player.y2)) {
			
			if ((obj1.y1-obj2.y1) > (obj2.y2-obj1.y2)) {
				return "down";
			}
			else {
				return "up";
			}
			//return "up";
		}

		//if the player is above the object, go up
		if (player.y1 < obj2.y1) {
			return "up";
		}

		//if the player is below the object, go down
		else {
			return "down";
		}
	}
	//if the x axis is free for movement
	else {
		//if the player is behind the object, then go toward the nearest side of the object
		if ((obj2.x1 > player.x1 && obj2.x2 < player.x1) || (obj2.x1 < player.x2 && obj2.x2 > player.x2)) {
			
			if ((obj1.x1-obj2.x1) > (obj2.x2-obj1.x2)) {
				return "right";
			}
			else {
				return "left";
			}
			//return "left";
		}
		//if the player is left of the object, go left
		if(player.x1 < obj2.x1) {
			return "left";
		}
		//if the player is right of the object, go right
		else {
			return "right";
		}
	}
}

function gameOver() {
	//end the game with a loss

	//game.over will tell the game to stop moving
	game.over = true;

	//write "Game over." to the canvas
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.beginPath();
	ctx.fillStyle = "#000000";
	ctx.font = "30px Georgia";
	ctx.fillText("Game over.",265,300);	

	playAgain();
}

function winGame() {
	
	if (game.round === 10) {
		
		//write "You win!" to the canvas
		ctx.clearRect(0,0,canvas.width,canvas.height);
		ctx.beginPath();
		ctx.fillStyle = "#000000";
		ctx.font = "30px Georgia";
		ctx.fillText("You win!",270,300);

		playAgain();

		//end the game with a win
	}
	else {
		game.round++;
	
		game.buffMonsters();

		game.generateMonsters();
		game.generateWeapons();
	}
}

function playAgain() {
	//game.over will tell the game to stop moving
	game.over = true;
	clearTimeout(game.wTime);

	ctx.beginPath();
	ctx.fillStyle = "#000000";
	ctx.font = "30px Georgia";
	ctx.fillText("Hit Enter to play again",190,350);

	$('body').on('keydown',(e) => {
		if (e.keyCode === 13) {
			$('body').off();
			$('#container div').off();
			newGame();
			$('#container div').toggleClass('hidden');
			$('h1').toggleClass('hidden');
			$('#help').toggleClass('hidden');
			$('#map').toggleClass('hidden');
		}
	})	
}

function newGame() {
	game = new Game();

	$('#container div').on('click',(e) => {
		let players = 2;

		if ($(e.currentTarget).text() === "1 Player") {
			players = 1;
		}

		$('#container div').toggleClass('hidden');
		$('h1').toggleClass('hidden');
		$('#help').toggleClass('hidden');

		$('#map').toggleClass('hidden');
		//generate 2 players
		game.generatePlayers(players);

		//generate 3 monsters and start everything moving
		game.generateMonsters();

		//generate weapons
		game.generateWeapons();
	})

	$('nav div').on('click',(e) => {
		let section = $(e.currentTarget).text().toLowerCase();
		let helpSects = $('#content p');
		let sect;
		for (let i = 0; i < helpSects.length; i++) {
			sect = helpSects.eq(i);
			if (sect.attr('id') === section) {
				sect.removeClass('hidden');
			}
			else {
				if (!(sect.hasClass('hidden'))) {
					sect.addClass('hidden');
				}
			}
		}
	})


	// -------------------------
	// Listeners for Key Presses
	// -------------------------

	$('body').on('keydown',(e) => {
		//this is listening for key presses from the players
		//if they pressed one of the accepted keys then it will
		//change their direction or fire their weapon

		let key = e.keyCode;
		if (key === 87) {
			game.players[1].dir = "up";
		}
		else if (key === 83) {
			game.players[1].dir = "down";
		}
		else if (key === 65) {
			game.players[1].dir = "left";
		}
		else if (key === 68) {
			game.players[1].dir = "right";
		}
		else if (key === 38) {
			game.players[0].dir = "up";
		}
		else if (key === 40) {
			game.players[0].dir = "down";
		}
		else if (key === 37) {
			game.players[0].dir = "left";
		}
		else if (key === 39) {
			game.players[0].dir = "right";
		}
		else if (key === 16) {
			game.players[0].weapon.fire();
		}
		else if (key === 81) {
			game.players[1].weapon.fire();
		}
		else if (key === 69) {
			game.players[1].cycleWeapon();
		}
		else if (key === 191) {
			game.players[0].cycleWeapon();
		}

	})

	$('body').on('keyup',(e) => {
		//Listens for players letting go of keys
		//If they lift up off a direction key then I'll stop moving them

		let key = e.keyCode;
		if (key === 87) {
			game.players[1].prevDir = game.players[1].dir;
			game.players[1].dir = null;
		}
		else if (key === 83) {
			game.players[1].prevDir = game.players[1].dir;
			game.players[1].dir = null;
		}
		else if (key === 65) {
			game.players[1].prevDir = game.players[1].dir;
			game.players[1].dir = null;
		}
		else if (key === 68) {
			game.players[1].prevDir = game.players[1].dir;
			game.players[1].dir = null;
		}
		else if (key === 38) {
			game.players[0].prevDir = game.players[0].dir;
			game.players[0].dir = null;
		}
		else if (key === 40) {
			game.players[0].prevDir = game.players[0].dir;
			game.players[0].dir = null;
		}
		else if (key === 37) {
			game.players[0].prevDir = game.players[0].dir;
			game.players[0].dir = null;
		}
		else if (key === 39) {
			game.players[0].prevDir = game.players[0].dir;
			game.players[0].dir = null;
		}
	})
}

// ------------------------
// Code to Start the Game
// ------------------------

//The game object stores all objects in the game and functions for generating and drawing them
let game = {};

newGame();

// -----------------------------------
// Helper Functions
// -----------------------------------

function drawMainRect(x,y,width,height) {
	//draw a rectangle

	ctx.beginPath();
	ctx.rect(x,y,width,height);
	//add a white box
	ctx.fill();
	//add a black border
	ctx.stroke();

	//create an object to represent the rectangle for collision detection
	let x2 = Math.ceil(x+width)+2;
	let y2 = Math.ceil(y+height)+2;
	x = Math.floor(x)-2;
	y = Math.floor(y)-2;
	game.objects.push(new Wall(x,y,x2,y2));
}

function drawMainColumn(x,y,r) {
	ctx.beginPath();

	//draw a white circle with a black border 
	ctx.arc(x,y,r,0,Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	ctx.closePath();

	//create a rectangular object to represent this circle for collision detection
	let x2 = Math.ceil(x+r)+1;
	let y2 = Math.ceil(y+r)+1;
	x = Math.floor(x-r)-1;
	y = Math.floor(y-r)-1;
	game.objects.push(new Wall(x,y,x2,y2));
}

function calcHyp(x1,y1,width,height,player) {
	let cX = x1+width/2; //center x coordinate of the monster
	let cY = y1+height/2; //center y coordinate of the monster
	let pCX = player.x1 + player.width/2; //center x coordinate of the player
	let pCY = player.y1 + player.height/2; //center y coordinate of the player

	//return a^2 + b^2 = c^2 solved for c
	//c will be the distance between the player and the monster
	return Math.sqrt(Math.pow(Math.abs(cX - pCX),2)+Math.pow(Math.abs(cY - pCY),2));

}









