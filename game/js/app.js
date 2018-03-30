const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

function drawMap() {
	ctx.beginPath();
	ctx.strokeStyle = "#000000";
	ctx.fillStyle = "#FFF";

	let rectToWall = canvas.height/13;

	drawMainRect(rectToWall,rectToWall,rectToWall*3,rectToWall*2);

	drawMainRect(rectToWall,rectToWall*10,rectToWall*3,rectToWall*2);

	drawMainRect(rectToWall*9,rectToWall,rectToWall*3,rectToWall*2);

	drawMainRect(rectToWall*9,rectToWall*10,rectToWall*3,rectToWall*2);

	ctx.closePath();

	let num = 0;
	let x = 0;
	let back = false;
	let offset = 0;
	let radius = 10;
	let yBegin = rectToWall*3;
	let yEnd = rectToWall*10;
	let yIter = (yEnd - yBegin)/6;

	for (let y = yBegin; y <= yEnd; y += yIter) {
		if (num === 4) {
			back = true;
		}

		if(back) {
			num--;
		}
		else {
			num++;
		}

		for (let i = 1; i <= num; i++) {

			x = (canvas.width)/(num+1)*i

			drawMainColumn(x,y,radius);
		}
	}

}

function drawMainRect(x,y,width,height) {
	ctx.rect(x,y,width,height);
	ctx.fill();
	ctx.stroke();
}

function drawMainColumn(x,y,r) {
	ctx.beginPath();

	ctx.arc(x,y,r,0,Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	ctx.closePath();
}

class Player {
	constructor(name,x1,y1,width,height) {
		this.weapon = new Weapon(1);
		this.name = name;
		this.width = width;
		this.height = height;
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = this.width+this.x1;
		this.y2 = this.height+this.y1;
		this.dir = "right";
	}
	move() {

	}
	draw() {
		ctx.beginPath();
		ctx.fillStyle = "#000000";
		//ctx.strokeStyle = "#000000";
		ctx.rect(this.x1,this.y1,this.width,this.height);
		ctx.fill();
		//ctx.stroke();
		this.upWeapDir()
		this.weapon.draw();
	}
	upWeapDir() {
		if (this.dir === "right") {
			this.weapon.x1 = this.x2 - this.weapon.length/2;
			this.weapon.y1 = this.y2;
			this.weapon.x2 = this.x2 + this.weapon.length/2;
			this.weapon.y2 = this.y2;
		}
		else if (this.dir === "left") {
			this.weapon.x1 = this.x1 - this.weapon.length/2;
			this.weapon.y1 = this.y1;
			this.weapon.x2 = this.x1 + this.weapon.length/2;
			this.weapon.y2 = this.y1;
		}
		else if (this.dir === "up") {
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
	}
	draw() {
		ctx.beginPath()
		ctx.moveTo(this.x1,this.y1);
		ctx.lineTo(this.x2,this.y2);
		ctx.strokeStyle = "#f00";
		ctx.stroke();
		ctx.closePath();
	}
}

class Monster {
	constructor(speed,x1,y1,width,height) {
		this.speed = speed;
		this.x1 = x1;
		this.y1 = y1;
		this.height = height;
		this.width = width;
	}
	move() {

	}
	draw(x,y) {

	}
}

const monsterFactory = {
	monsters: [],
	generateMonsters(amount,speed) {
		for (let i = 1; i <= amount; i++) {
			monsters.push(new Monster(speed,10,10));
			monsters[i].draw((canvas.width - monsters[i].width),(canvas.height/monsters[i].height*i));
		}
	}
}

const Player1 = new Player('1',10,canvas.height/2-20,10,10);
Player1.draw();

const Player2 = new Player('2',10,canvas.height/2+20,10,10);
Player2.draw();

//monsterFactory.generateMonsters(1,1);

drawMap();

