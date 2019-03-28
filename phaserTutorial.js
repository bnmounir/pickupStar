let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    }
};

let game = new Phaser.Game(config);
let player;
let platforms;
let cursors;
let stars;
let score = 0;
let scoreText;
let bombs;
let gameOver;
let music;
let pickupSound;
let explosionSound;
// 1
let acceleration;
let accelerationText;
let accelerationStarAvailable = false;
let particlesYellow;

function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', {
        frameWidth: 32,
        frameHeight: 48
    });

    this.load.audio('music', 'assets/music.mp3');
    this.load.audio('pickupSound', 'assets/pickup.mp3');
    this.load.audio('explosionSound', 'assets/explosion.mp3');

    this.load.image(
        'yellow',
        'https://labs.phaser.io/assets/particles/yellow.png'
    );
    this.load.image('red', 'https://labs.phaser.io/assets/particles/red.png');
}

function create() {
    this.add.image(400, 300, 'sky');

    platforms = this.physics.add.staticGroup();
    platforms
        .create(400, 568, 'ground')
        .setScale(2)
        .refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    player = this.physics.add.sprite(100, 450, 'dude');
    player.setCollideWorldBounds(true);
    player.setBounce(0.2);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.physics.add.collider(player, platforms);

    cursors = this.input.keyboard.createCursorKeys();

    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 15, y: 0, stepX: 70 }
    });

    stars.children.iterate(function(child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(stars, platforms);

    this.physics.add.overlap(player, stars, collectStar, null, this);

    function collectStar(player, star) {
        star.disableBody(true, true);

        // 13
        if (star['accelerate']) {
            // 14
            accelerationStarAvailable = false;
            star['emitter'].visible = false;

            // 14.1
            delete star['accelerate'];
            delete star['emitter'];

            acceleration = true;

            // 15
            let emitter = createEmitter(particlesYellow);
            player['emitter'] = emitter;

            // 16
            emitter.startFollow(player);

            // 17
            let timer = 3;

            if (accelerationText) accelerationText.destroy();

            accelerationText = this.add.text(16, 56, `Acceleration: ${timer}`, {
                fontSize: '24px',
                fill: '#000'
            });
            let interval = setInterval(() => {
                accelerationText.setText(`Acceleration ${timer--}`);

                if (timer == 0) {
                    stopAcceleration();
                    clearInterval(interval);
                }
            }, 1000);
        }

        pickupSound.play();

        score += 10;
        scoreText.setText(`Score: ${score}`);

        if (stars.countActive() === 0) {
            // 2
            let randomStar = Math.round(Math.random() * stars.children.size);

            let i = 0;

            stars.children.iterate(function(child) {
                child.enableBody(true, child.x, 0, true, true);

                // 3
                if (
                    i == randomStar &&
                    !accelerationStarAvailable &&
                    !acceleration
                )
                    startAcceleration(child);

                // 4
                i++;
            });

            let x =
                player.x < 400
                    ? Phaser.Math.Between(400, 800)
                    : Phaser.Math.Between(0, 400);

            let bomb = bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            bomb.allowGravity = false;

            let particleRed = this.add.particles('red');

            let emitterRed = particleRed.createEmitter({
                speed: 50,
                scale: { start: 0.05, end: 0 }
            });

            emitterRed.startFollow(bomb);
        }
    }

    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#000'
    });

    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    function hitBomb(player, bomb) {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');

        gameOver = true;

        music.stop();
        explosionSound.play();
    }

    let musicConfig = {
        mute: false,
        volume: 1,
        rate: 1,
        detune: 0,
        seek: 0,
        loop: true,
        delay: 0
    };

    music = this.sound.add('music', musicConfig);
    pickupSound = this.sound.add('pickupSound');
    explosionSound = this.sound.add('explosionSound');

    music.play();

    // 5
    let startAcceleration = whoToFollow => {
        // 6
        if (particlesYellow) particlesYellow.destroy();

        // 7
        particlesYellow = this.add.particles('yellow');

        // 8
        let emitterYellow = createEmitter(particlesYellow);
        emitterYellow.startFollow(whoToFollow);

        // 11
        whoToFollow['accelerate'] = true;
        whoToFollow['emitter'] = emitterYellow;

        // 12
        accelerationStarAvailable = true;
    };
}

// 9
function createEmitter(particles) {
    // 10
    let emitter = particles.createEmitter({
        speed: 50,
        scale: { start: 0.05, end: 0 }
    });

    return emitter;
}

function stopAcceleration() {
    accelerationText.destroy();
    particlesYellow.destroy();

    acceleration = false;
}

function update() {
    if (cursors.left.isDown) {
        // 14.2
        player.setVelocityX(-160 * (acceleration ? 1.5 : 1));
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        // 14.3
        player.setVelocityX(160 * (acceleration ? 1.5 : 1));
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down)
        player.setVelocityY(-330);
}
