const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d')
canvas.width = 800;
canvas.height = 600;

let explosions = [];
let bullets = [];
let enemyBullets = [];
let enemies = [];
let powerups = [];
let powerList = ['penta beam', 'nanobots', 'photon overdrive', 'hyper light drifter', 'risk of rain']
let title = true;
let shotsFired = 0;

let bg = new Image();
bg.src = 'assets/starfield.png'

let player = {
    x: 0,
    y: 500,
    vx: 0,
    vy: 0,
    speed: 5,
    hp: 100,
    damage: 1,
    maxHp: 100,
    src: 'assets/player.png',
    image: new Image(),
    rof: 3, //Rate of fire, in frame ticks
    shootDelay: 0,
    score: 0,
    width: 28,
    height: 21,
    ability: '',
    abilityCool: 0,
    draw: function(){
        ctx.drawImage(this.image, this.x, this.y);
        ctx.fillStyle = '#FF0000'; //Red
        ctx.fillRect(this.x, this.y - 5, this.width, 5);
        ctx.fillStyle = '#00FF00'; //Green
        ctx.fillRect(this.x, this.y - 5, Math.floor(this.width / this.maxHp * this.hp), 5);
    }
}

let keys = {}

player.image.src = player.src;

window.onload = function(){
    if(!localStorage['highScore']) localStorage['highScore'] = 0;
    //localStorage.highScore works too, but be consistent.
    for(let i = 0; i < 25; i++){
        spawnEnemy();
    }
    setTimeout(function(){
        title = false;
    }, 3000)
    gameLoop();
}

function draw(){
    ctx.clearRect(0, 0, 800, 600);
    ctx.drawImage(bg, 0, 0, 800, 600);

    //The order of the for loops matter. 
    //If you want to render the explosions ON TOP of the bullets, put the explosion loop AFTER the bullet loop.
    for(let e of explosions){
        e.render(ctx);
        if(e.i === 9){
            explosions.splice(explosions.indexOf(e), 1)
            e = null;
            delete e;    
        }
    }
    for(let b of bullets){
        b.render(ctx);
        for(let e of enemies){
            if(b.x > e.x && b.x < e.x + e.width && b.y < e.y + e.height && b.y > e.y){ //Check if the bullet is inside the width range of an enemy
                bullets.splice(bullets.indexOf(b), 1)
                b = null;
                delete b;
                e.hp -= player.damage;
                if(e.hp <= 0){ //Leave this as e.hp-- for the first part, point out that they are still alive with no hp, and change it to --e.hp
                    enemies.splice(enemies.indexOf(e), 1)
                    explode(e.x - 48, e.y - 48); //x - (explosion width / 2) + (enemy width / 2)
                    e = null;
                    delete e;
                    player.score += 5;
                }
                break;
            }
        }
        if(b && b.y < -b.image.height){
            bullets.splice(bullets.indexOf(b), 1)
            b = null;
            delete b;
        }
    }
    for(let e of enemies){
        e.render(ctx);
        if(--e.shoot <= 0){
            e.shoot = e.rof;
            let eb = new EnemyBullet(e.x, e.y);
            enemyBullets.push(eb);
        }
    }
    for(let p of powerups){
        p.render(ctx);
        if(player.x + player.width / 2 > p.x && player.x + player.width / 2 < p.x + 20 && player.y + player.height / 2 > p.y && player.y + player.height / 2 < p.y + 20){
            player.ability = p.type;
            player.abilityCool = 200;
            powerups.splice(powerups.indexOf(p), 1)
            p = null;
            delete p;
        }
    }
    for(let eb of enemyBullets){
        eb.render(ctx);
        if(eb.x > player.x && eb.x < player.x + player.width && eb.y > player.y && eb.y < player.y + player.height){
            enemyBullets.splice(enemyBullets.indexOf(eb), 1)
            player.hp -= eb.damage;
            if(player.hp <= 0){
                if(player.score > localStorage['highScore']) localStorage['highScore'] = player.score
                player = null;
                delete player;
                location.reload();
                break;
            }
            eb = null;
            delete eb;
        }
        if(eb && eb.y > canvas.height + eb.image.height){
            enemyBullets.splice(enemyBullets.indexOf(eb), 1)
            eb = null;
            delete eb;
        }
    }
    if(player) player.draw();
    //GUI takes priority.
    ctx.fillStyle = 'white';
    ctx.font = '30px adventure'
    ctx.fillText(`Score: ${player.score}`, 10, 30);
    ctx.fillText(`Shots Fired: ${shotsFired}`, 15, 50);
    ctx.fillText(`High Score: ${localStorage['highScore']}`, 20, 70);
    if(player.abilityCool > 90){
        let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        for(let i = 0; i < 1; i += 0.1){
            gradient.addColorStop('' + i, getRandomColor());
        }
        ctx.font = '65px adventure';
        ctx.fillStyle = gradient;
        ctx.fillText(player.ability, 400 - (ctx.measureText(player.ability).width / 2), 280);
    }
    if(title){
        let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop("0", getRandomColor());
        gradient.addColorStop("0.5", getRandomColor());
        gradient.addColorStop("1.0", getRandomColor());
        ctx.font = '60px adventure';
        ctx.fillStyle = gradient; 
        ctx.fillText('Just Your Average', 400 - (ctx.measureText('Just Your Average').width / 2), 270);
        ctx.fillText('Space Invaders Clone', 400 - (ctx.measureText('Space Invaders Clone').width / 2), 310);
    }
    //Don't use template literals in the tutorial
}

function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function explode(x, y){
    let explosion = new Explosion(x, y);
    explosions.push(explosion);
}

function spawnEnemy(){
    if(enemies.length > 90) return;
    let enemy = new Enemy(Math.floor(Math.random() * (canvas.width - 64)) + 32, (Math.floor(Math.random() * 4) + 1) * 50);
    enemies.push(enemy);
}

function spawnPowerup(){
    if(powerups.length > 5) powerups = powerups.slice(1);
    let powerup = new Powerup(Math.floor(Math.random() * (canvas.width - 64)) + 32, Math.floor(Math.random() * 200) + 300, powerList[Math.floor(Math.random() * powerList.length)]);
    powerups.push(powerup);
}

function shoot(){
    if(player.ability === 'penta beam'){
        for(let i = -2; i < 3; i++){
            let bullet = new Bullet(player.x + player.width / 2 + (i * 5) - 5, player.y - 10);
            bullets.push(bullet)
            shotsFired++;
        }
        return;
    }else if(player.ability === 'hyper light drifter'){
        let bullet = new Bullet(player.x + player.width / 2 - 3, player.y - 10);
        bullet.velY = -15;
        bullets.push(bullet)
    }else{
        let bullet = new Bullet(player.x + player.width / 2 - 3, player.y - 10);
        bullets.push(bullet)
    }
    shotsFired++;
}

window.addEventListener("keydown", function (e) {
    keys[e.keyCode] = true; //The player is pressing the button represented by e.keyCode (see below)
});

window.addEventListener("keyup", function (e) {
    keys[e.keyCode] = false; //The player has stopped pressing the button represented by e.keyCode (see below)
});

/*
================
KEYCODES
37 = Left
39 = Right
32 = Space
================
*/

//setInterval takes two arguments: a function and a delay.
//It will keep running the function every `delay` seconds.
setInterval(function(){
    for(let i = 0; i < 8; i++){
        spawnEnemy();
    }
}, 1500) //1s = 1000ms, so 1.5s = 1500ms
setInterval(spawnPowerup, 5000) //5s = 5000ms
//For the tutorial, put spawnEnemy in here as a lambda and eventually migrate it to a standalone function.

function gameLoop(){

    if(keys[16] && player.ability !== 'hyper light drifter') player.speed = 3;
    else if(!keys[16] && player.ability !== 'hyper light drifter') player.speed = 5;

    //Because of this, the left key (which has a key code of 37) takes priority over the else if (right arrow key with code 39)
    if(keys[37] && player.x > 0) player.vx = -player.speed; //Negative x velocity means the player will move left 
    else if(keys[39] && player.x < canvas.width - player.width) player.vx = player.speed; //Positive x velocity means the player will move right
    else player.vx = 0; //Don't move at all
    
    if(keys[38] && player.y > 300) player.vy = -player.speed; //Negative x velocity means the player will move left 
    else if(keys[40] && player.y < canvas.height - 20) player.vy = player.speed; //Positive x velocity means the player will move right
    else player.vy = 0; //Don't move at all

    if(player.abilityCool > 0){ 
        player.abilityCool--;
        switch(player.ability){
            case 'nanobots':
                player.hp += player.hp < player.maxHp ? 0.5 : 0;
                break;
            case 'photon overdrive':
                for(let e of enemies){
                    e.shoot = 100;
                }
                player.rof = 0;
                break;
            case 'hyper light drifter':
                player.rof = 6;
                player.damage = 3;
                player.speed = 10;
                break;
            case 'risk of rain':
                for(let b of enemyBullets){
                    b.velY = -5;
                    for(let e of enemies){
                        if(b.x > e.x && b.x < e.x + e.width && b.y < e.y + e.height && b.y > e.y){ //Check if the bullet is inside the width range of an enemy
                            enemyBullets.splice(enemyBullets.indexOf(b), 1)
                            b = null;
                            delete b;
                            e.hp -= player.damage;
                            if(e.hp <= 0){ //Leave this as e.hp-- for the first part, point out that they are still alive with no hp, and change it to --e.hp
                                enemies.splice(enemies.indexOf(e), 1)
                                explode(e.x - 48, e.y - 48); //x - (explosion width / 2) + (enemy width / 2)
                                e = null;
                                delete e;
                                player.score += 5;
                            }
                            break;
                        }
                    }
                }
        }
    }
    else player.ability = '';
    
    if(player.ability !== 'photon overdrive'){
        player.rof = 3;
    }
    if(player.ability !== 'hyper light drifter' && player.ability !== 'photon overdrive'){
        player.rof = 3;
        player.damage = 1;
    }

    if(keys[32] && player.shootDelay <= 0){ //If the player presses space and the gun's cooldown has been reached, shoot.
        shoot();
        player.shootDelay = player.rof; //Reset the shooting delay
    }

    if(player.shootDelay > 0) player.shootDelay--; //Subtracts 1 from player.shootDelay. Equivalent to player.shootDelay = player.shootDelay - 1.

    if(keys[65]) spawnEnemy();

    player.y += player.vy;
    player.x += player.vx; //Move the player depending on the velocity (see above).

    draw(); //This is where everything is actually drawn. Without this, the canvas would be blank.
    requestAnimationFrame(gameLoop); //Requests an animation frame?
}

(function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();