/**
 * 
 * @authors Matz (pentiumii233@gmail.com)
 * @date    2017-12-01 16:10:32
 * @version 0.01 alpha
 */

var game = new Phaser.Game(600, 1066, Phaser.CANVAS, 'game');

// Variables
game.States = {};
var score = 0;


function Enemy(config) {
    this.init = function() {
        this.enemies = game.add.group();
        this.enemies.enableBody = true;
        this.enemies.createMultiple(config.selfPool, config.selfPic);
        this.enemies.setAll('outOfBoundsKill', true);
        this.enemies.setAll('checkWorldBounds', true);

        // enemy bullets
        this.enemyBullets = game.add.group();
        this.enemyBullets.enableBody = true;
        this.enemyBullets.createMultiple(config.bulletsPool, config.bulletPic);
        this.enemyBullets.callAll('animations.add', 'animations', 'fly3', [0,1], 16, true);
        this.enemyBullets.callAll('play', null, 'fly3');
        

        this.enemyBullets.setAll('outOfBoundsKill', true);
        this.enemyBullets.setAll('checkWorldBounds', true);

        // width range
        this.maxWidth = game.width - game.cache.getImage(config.selfPic).width;

        // loop
        game.time.events.loop(Phaser.Timer.SECOND * config.selfTimeInterval, this.generateEnemy, this);

        // explosion anime
        this.explosions = game.add.group();
        this.explosions.createMultiple(config.explodePool, config.explodePic);
        this.explosions.forEach(function(explosion) {
            explosion.animations.add(config.explodePic);
        }, this);
    };

    this.generateEnemy = function() {
        var e = this.enemies.getFirstExists(false);
        if(e) {
            e.reset(game.rnd.integerInRange(0, this.maxWidth), -game.cache.getImage(config.selfPic).height);
            e.life = config.life;
            e.body.velocity.y = config.velocity;
        }
    }

    this.enemyFire = function() {
        this.enemies.forEachExists(function(enemy) {
            var bullet = this.enemyBullets.getFirstExists(false);
            if(bullet) {
                if(game.time.now > (enemy.bulletTime || 0)) {
                    bullet.reset(enemy.x + config.bulletX, enemy.y + config.bulletY);
                    bullet.body.velocity.y = config.bulletVelocity;
                    enemy.bulletTime = game.time.now + config.bulletTimeInterval;
                }
            }
        }, this);
    };

    this.beHit = function(myBullet, enemy) {
        
        myBullet.kill();
        enemy.life--;
        if(enemy.life <= 0) {
              
              enemy.kill();
              var explosion = this.explosions.getFirstExists(false);
              explosion.reset(enemy.body.x, enemy.body.y);
              explosion.play(config.explodePic, 30, false, true);
              score += config.score;
              //config.game.updateText();
        }
    };
}

// States.boot
game.States.boot = {
    preload: function() {
        if(typeof(GAME) !== "undefined") {
            this.load.baseURL = GAME + "/";
        }

        //
        if(!game.device.desktop){
            this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            this.scale.forcePortrait = true;
            this.scale.refresh();
        }

        //
        game.load.image('loadingbar', 'assets/preloader.gif');
        game.load.image('bg', 'assets/bg5.png');

    },
    create: function() {
        game.state.start('load');
    }
};

game.States.load = {
    preload: function() {

        console.log('load.preload');

        var preloadSprite = game.add.sprite(game.width/2 - 110, game.height/2 - 10, 'loadingbar');
        preloadSprite.anchor.setTo(0.5, 0.5);

        game.load.setPreloadSprite(preloadSprite);

        // load resouces
        // game.load.image('lt', 'assets/left.png');
        // game.load.image('rt', 'assets/right.png');
        game.load.spritesheet('enemy', 'assets/enemy.png', 60, 60, 2);
        game.load.spritesheet('jz', 'assets/jz.png', 13, 34, 2);
        game.load.spritesheet('ep', 'assets/enemy_explode.png', 40, 40, 3);
        game.load.spritesheet('pigu', 'assets/my_plane.png', 89, 75, 2);
        game.load.image('bullet', 'assets/bullet.png');

    },
    create: function() {
        console.log('load.create');
        game.add.sprite(0, 0, 'bg');
        game.state.start('main');
    },
};

game.States.main = {
    create: function() {
        console.log('main.create');

        // physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // background
        var bg = game.add.tileSprite(0, 0, game.width, game.height, 'bg');
        bg.autoScroll(0, 60);


        // player anime setting
        this.playerPlane = game.add.sprite(game.width/2 - 20, 600, 'pigu');
        this.playerPlane.animations.add('fly');
        this.playerPlane.animations.play('fly', 4, true);
        game.physics.arcade.enable(this.playerPlane);
        this.playerPlane.body.collideWorldBounds = true;
        this.playerPlane.level = 2;

        // anime
        var tween = game.add.tween(this.playerPlane).to({y: game.height - 300}, 1000, Phaser.Easing.Sinusoidal.InOut, true);
        tween.onComplete.add(this.onStart, this);
     
    },

    onStart: function() {
        // enable control
        this.playerPlane.inputEnabled = true;
        this.playerPlane.input.enableDrag(false);

        // my bullets
        this.myBullets = game.add.group();
        this.myBullets.enableBody = true;
        this.myBullets.createMultiple(50, 'bullet');

        this.myBullets.setAll('outOfBoundsKill', true);
        this.myBullets.setAll('checkWorldBounds', true);
        this.myStartFire = true;
        this.bulletTime = 0;

        // enemy team
        var enemyTeam = {
          enemy: {
            game: this,
            selfPic: 'enemy',
            bulletPic: 'jz',
            explodePic: 'ep',
            selfPool: 10,
            bulletsPool: 50,
            explodePool: 10,
            life: 2,
            velocity: 60,
            bulletX: 24,
            bulletY: 40,
            bulletVelocity: 200,
            selfTimeInterval: 2,
            bulletTimeInterval: 1000,
            score: 1
          }
        };

        this.enemy1 = new Enemy(enemyTeam.enemy);
        this.enemy1.init();
    },

    myFireBullet: function () {

        // var myBullet = game.add.sprite(this.playerPlane.x, this.playerPlane.y, 'bullet');
        // game.physics.enable(myBullet, Phaser.Physics.ARCADE);
        // myBullet.body.velocity.y = -200;

        if (this.playerPlane.alive == 1 && game.time.now > this.bulletTime) {
            var bullet;
            bullet = this.myBullets.getFirstExists(false);
            if(bullet) {
                bullet.reset(this.playerPlane.x + 27, this.playerPlane.y - 15);
                bullet.body.velocity.y = -500;
                this.bulletTime = game.time.now + 150;
            }
        }
        

    },

    HitPlayerPlane: function(myplane, bullet) {
        bullet.kill();
        if(myplane.level > 1) {
            myplane.level--;
        } else {
            myplane.kill();
            //this.dead();
        }
    },

    update: function() {

        // Fire
        if (this.myStartFire && game.time.now) {
            this.myFireBullet();
            this.enemy1.enemyFire();
            game.physics.arcade.overlap(this.myBullets, this.enemy1.enemies, this.enemy1.beHit, null, this.enemy1);
            game.physics.arcade.overlap(this.enemy1.enemyBullets, this.playerPlane, this.HitPlayerPlane, null, this);
        }
        
    }
};

game.state.add('boot', game.States.boot);
game.state.add('load', game.States.load);
game.state.add('main', game.States.main);
game.state.start('boot');

