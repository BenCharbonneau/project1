const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');

function drawMap() {
	ctx.beginPath();
	ctx.strokeStyle = "#000000";
	ctx.fillStyle = "#FFF";

	drawMainRect(50,50,150,100);

	drawMainRect(50,500,150,100);

	drawMainRect(450,50,150,100);

	drawMainRect(450,500,150,100);

	ctx.closePath();

	let num = 0;
	let x = 0;
	let back = false;
	let offset = 0;
	let radius = 10;

	for (let y = 150; y <= 500; y += (58+1/3)) {
		if (num === 4) {
			back = true;
		}

		if(back) {
			num--;
		}
		else {
			num++;
		}

		console.log(num);
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

function drawMonster(x,y) {

}

function drawPlayer(x,y) {

}

drawMap();

