"use strict";

// 文字数制限：25字
const itemName = [
    ["馬型埴輪", "うまがたはにわ"], 
    ["家型埴輪", "いえがたはにわ"],
    ["琴を弾く人物埴輪", "ことをひくじんぶつはにわ"],
    ["小馬型埴輪", "こうまがたはにわ"],
    ["翡翠製獣型勾玉", "ひすいせいじゅうけいまがたま"],
    ["青磁袴腰香炉", "せいじはかまごしこうろ"]
];

// 文字数制限：130字程度
// 25文字区切り、文脈をスペースで調整
const explain = [
    "馬を表したはにわです。現代の馬と比べて足が短く、体には乗馬　する時に必要なさまざまな道具がつけられています。",
    "高床式（たかゆかしき）の建物を表現したはにわです。屋根には　鰹木（かつおぎ）という、その　家に住んでいた人の地位の高さを表すものがついています。",
    "イスにすわり、５本の弦がある　琴（こと）をヒザにのせた人物のはにわです。はにわのカケラが　発掘されたあと、それをもとに　復元されました。",
    "小馬のはにわです。他の馬の　　はにわにある鞍（くら）や　　　たてがみがなく、発見されたときは「子犬型埴輪」として紹介　　されていました。",
    "横から見た動物のように見える　ことから獣型勾玉と呼ばれており弥生（やよい）時代前期のものと考えられています。",
    "田原城主の菩提寺（ぼだいじ）、先祖のお墓がある寺である　　　千光寺（せんこうじ）跡の墓地　から発見された香炉です。"
];

let canvas;
let ctx;
let scaleRate;

const SCREEN_WIDTH = 432;
const SCREEN_HEIGHT = 432;

let mouse = {};

let state = 0;
let debug = false;

let posX;
let posY;
let digTargetX = null;
let digTargetY = null;
let tool;
let hp;
let item;
let isGameClear;
let isDamaged = false;  // この番ダメージを受けたか
let isExcavated = false;    // この番土を掘ったか
let particles = [];
let damageAnimation = 0;
let tutorialPage = 0;

let field = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const imgSoil = new Image();
const imgSoil2 = new Image();
const imgShovel1 = new Image();
const imgShovel2 = new Image();
const imgSankakuho1 = new Image();
const imgSankakuho2 = new Image();
const imgTakebera1 = new Image();
const imgTakebera2 = new Image();
const imgHeart1 = new Image();
const imgHeart2 = new Image();
const imgTitle = new Image();
const imgBack = new Image();
const imgDig = new Image();
const imgHand = new Image();

const sndExcavate = new Audio();
const sndMiss = new Audio();
const sndJingle = new Audio();

// 出土品
const imgExPaths = ["img/ex_horsehaniwa.png", 
                    "img/ex_househaniwa.png",
                    "img/ex_kotohaniwa.png",
                    "img/ex_ponyhaniwa.png",
                    "img/ex_magatama.png",
                    "img/ex_seijikouro.png"
];
let imgEx;

window.onload = setup;

function setup()
{
    // canvasの生成
    canvas = document.createElement("canvas");

    let rawScale = Math.min((window.innerWidth - 15) / SCREEN_WIDTH,
                            (window.innerHeight - 15) / SCREEN_HEIGHT);

    if (!isFinite(rawScale) || rawScale <= 0) {
        rawScale = 1;
    }
    scaleRate = rawScale;

    canvas.width = SCREEN_WIDTH * scaleRate;
    canvas.height = SCREEN_HEIGHT * scaleRate;

    canvas.style.backgroundColor = "white";
    canvas.style.border = "2px solid";
    canvas.style.width = "auto";
    canvas.style.height = "auto";

    ctx = canvas.getContext("2d");

    const container = document.getElementById("game-container");
    container.appendChild(canvas);

    // ボタンの生成
    createButtons();

    imgSoil.src = "img/soil.png";
    imgSoil2.src = "img/soil2.png";
    imgShovel1.src = "img/shovel.png";
    imgShovel2.src = "img/shovel2.png";
    imgSankakuho1.src = "img/sankakuho-.png";
    imgSankakuho2.src = "img/sankakuho-2.png";
    imgTakebera1.src = "img/takebera.png";
    imgTakebera2.src = "img/takebera2.png";
    imgHeart1.src = "img/heart1.png";
    imgHeart2.src = "img/heart2.png";
    imgTitle.src = "img/title.png";
    imgBack.src = "img/back.png";
    imgDig.src = "img/dig.png";
    imgHand.src = "img/hand.png";

    imgEx = imgExPaths.map(path => {
        const img = new Image();
        img.src = path;
        return img;
    });

    sndExcavate.src = "sound/excavate.mp3";
    sndMiss.src = "sound/miss.mp3";
    sndJingle.src = "sound/jingle.mp3";

    if (debug) {
        document.addEventListener("keyup", function (event) {
            let key = event.key;
            if (key == "q") {
                field = [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0]
                ];
            }
        })
    }

    canvas.addEventListener("touchstart", function(e) {
        updateTouchPos(e);

        const tapX = Math.floor(mouse.x / 48);
        const tapY = Math.floor(mouse.y / 48);

        if (state === 0) {
            if (mouse.x > 33 && mouse.x < 183 && mouse.y > 320 && mouse.y < 370) {
                gameInit();
                state = 1;
            }
            if (mouse.x > 249 && mouse.x < 399 && mouse.y > 320 && mouse.y < 370) {
                state = 4;
            }
        }

        if (state === 1) {
            if (tapX >= 0 && tapX <= 8 && tapY >= 0 && tapY <= 8) {
                digTargetX = tapX;
                digTargetY = tapY;
            }
        }

        if (state === 2 || state === 3) {
            if (mouse.x > 33 && mouse.x < 183 && mouse.y > 320 && mouse.y < 370) {
                gameInit();
                state = 1;
            }
            if (mouse.x > 249 && mouse.x < 399 && mouse.y > 320 && mouse.y < 370) {
                state = 0;
            }
        }

        if (state === 4) {
            tutorialPage++;
            if (tutorialPage >= 6) {
                tutorialPage = 0;
                state = 0;
            }
        }
    }, { passive: false });

    canvas.addEventListener("touchmove", function (e) {
        updateTouchPos(e);

        if (state === 1) {
            const tapX = Math.floor(mouse.x / 48);
            const tapY = Math.floor(mouse.y / 48);

            // 盤面の範囲内なら更新する
            if (tapX >= 0 && tapX <= 8 && tapY >= 0 && tapY <= 8) {
                digTargetX = tapX;
                digTargetY = tapY;
            }
        }
    }, { passive: false });

    function updateTouchPos(e) {
        e.preventDefault(); // スクロール防止
        const t = e.touches[0];
        const rect = canvas.getBoundingClientRect();

        mouse.x = (t.clientX - rect.left) / scaleRate;
        mouse.y = (t.clientY- rect.top) / scaleRate;
    }

    update();
}

function update()
{
    if (state == 0) {

    } else if (state == 1) {
        // パーティクルの動き
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;

            if (p.life <= 0) particles.splice(i, 1);
        }

        // animationを規定値に → 0までの間アニメーションする
        if (damageAnimation > 0) damageAnimation--;

        if (isGameClear) {
            playSound(sndJingle);
            state = 2;
        }
    }
    draw();
    setTimeout(update, 1000 / 30);
}

function draw()
{
    ctx.save();
    ctx.setTransform(scaleRate, 0, 0, scaleRate, 0, 0);
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.imageSmoothingEnabled = false;      // ドット絵のボケ防止処理

    ctx.drawImage(imgBack, 20, 5, 100, 70, 0, 0, 700, 490);
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, 800, 560);

    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    if (state == 0) {
        // タイトル
        ctx.drawImage(imgTitle, 0, 0, 180, 100, 36, 50, 360, 200);
        
        // ゲームスタート
        ctx.fillStyle = "#7cf";
        ctx.fillRect(SCREEN_WIDTH / 4 - 150 / 2, 320, 150, 50);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#fff";
        ctx.strokeRect(SCREEN_WIDTH / 4 - 150 / 2 + 5, 320 + 5, 140, 40);

        ctx.fillStyle = "#000";
        ctx.font = "15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ゲームスタート", SCREEN_WIDTH / 4, 350);

        // 説明
        ctx.fillStyle = "#7cf ";
        ctx.fillRect(SCREEN_WIDTH / 4 * 3 - 150 / 2, 320, 150, 50);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#fff";
        ctx.strokeRect(SCREEN_WIDTH / 4 * 3 - 150 / 2 + 5, 320 + 5, 140, 40);

        ctx.fillStyle = "#000";
        ctx.font = "15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ルールせつめい", SCREEN_WIDTH / 4 * 3, 350);
    }

    if (state == 1) {
        // 出土品画像
        if (imgEx[item].complete) {
            ctx.drawImage(imgEx[item], 0, 0, 48, 48, 0, 0, 432, 432);
        }
        // ゲーム画面
        for (let y = 0; y < field.length; y++) {
            for (let x = 0; x < field[y].length; x++){
                if (field[x][y] == 1) {
                    ctx.drawImage(imgSoil2, 0, 0, 16, 16, x * 48, y * 48, 48, 48);
                } else if (field[x][y] == 2) {
                    ctx.drawImage(imgSoil, 0, 0, 16, 16, x * 48, y * 48, 48, 48);
                }
            }
        }
        
        // 採掘範囲の線
        if (digTargetX >= 0 && digTargetX <= 8 && digTargetY >= 0 && digTargetY <= 8) {
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#fb3";

            switch (tool) {
                case 1:
                    ctx.strokeRect((digTargetX - 1) * 48, (digTargetY - 1) * 48, 144, 144);
                    break;
                case 2:
                    ctx.strokeRect(digTargetX * 48, (digTargetY - 1) * 48, 48, 144);
                    break;
                case 3:
                    ctx.strokeRect(digTargetX * 48, digTargetY * 48, 48, 48);
                    break;
            }
        }

        // パーティクルの描画
        for (let p of particles) {
            ctx.drawImage(
                p.img,
                p.sx, p.sy,
                p.size, p.size,
                p.x, p.y, 
                p.size * 3, p.size * 3
            );
        }
    }
    
    if (state == 2 || state == 3) {
        // 背景
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(20, 20, SCREEN_WIDTH - 40, SCREEN_HEIGHT - 40);

        // もう一度遊ぶ
        ctx.fillStyle = "#7cf";
        ctx.fillRect(SCREEN_WIDTH / 4 - 150 / 2, 320, 150, 50);

        ctx.fillStyle = "#000";
        ctx.font = "15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("もう１回あそぶ", SCREEN_WIDTH / 4, 350);

        // タイトルに戻る
        ctx.fillStyle = "#7cf ";
        ctx.fillRect(SCREEN_WIDTH / 4 * 3 - 150 / 2, 320, 150, 50);

        ctx.fillStyle = "#000";
        ctx.font = "15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("タイトルにもどる", SCREEN_WIDTH / 4 * 3, 350);
    }
    
    if (state == 2) {
        // 出土品の名前
        ctx.fillStyle = "#000";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(itemName[item][0], SCREEN_WIDTH / 2, 60);

        // ふりがな
        ctx.font = "12px sans-serif";
        ctx.fillText(itemName[item][1], SCREEN_WIDTH / 2, 40);

        // 出土品の説明
        ctx.font = "14px sans-serif";
        ctx.textAlign = "left";
        fillTextLine(explain[item], 194, 100, 15);

        // 出土品の画像
        ctx.drawImage(imgEx[item], 0, 0, 48, 48, 40, 80, 144, 144);
    }
    
    if (state == 3) {
        // ゲームオーバー
        ctx.fillStyle = "#000";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ゲームオーバー", SCREEN_WIDTH / 2, 60);
    }

    if (state === 4) {
        // 背景
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(20, 20, SCREEN_WIDTH - 40, SCREEN_HEIGHT - 40);

        ctx.fillStyle = "#000";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ルールせつめい", SCREEN_WIDTH / 2, 60);

        if (tutorialPage === 1) {
            // 本文
            ctx.font = "16px sans-serif";
            ctx.textAlign = "left";
            fillTextLine("スワイプでほる場所をきめます", 35, 350, 22);
        } else if (tutorialPage === 2) {
            // 本文
            ctx.font = "16px sans-serif";
            ctx.textAlign = "left";
            fillTextLine("きめたらこのボタンで土をほりましょう", 35, 350, 22);

            // ボタン
            ctx.drawImage(imgDig, 0, 0, 16, 16, SCREEN_WIDTH / 2 - 32, 180, 64, 64);
        } else if (tutorialPage === 3) {
            // 本文
            ctx.font = "16px sans-serif";
            ctx.textAlign = "left";
            fillTextLine("道具は３つあって、それぞれはんいがきまって　います", 35, 350, 22);

            // 土
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 40, 80, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 40, 80 + 32, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 40, 80 + 64, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 40 + 32, 80, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 40 + 32, 80 + 32, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 40 + 32, 80 + 64, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 40 + 64, 80, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 40 + 64, 80 + 32, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 40 + 64, 80 + 64, 32, 32);

            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 220, 80, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 220, 80 + 32, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 220, 80 + 64, 32, 32);

            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 330, 80 + 32, 32, 32);

            // ボタン
            ctx.drawImage(imgShovel1, 0, 0, 16, 16, 40 + 32, 200, 32, 32);
            ctx.drawImage(imgSankakuho1, 0, 0, 16, 16, 220, 200, 32, 32);
            ctx.drawImage(imgTakebera1, 0, 0, 16, 16, 330, 200, 32, 32);
        } else if (tutorialPage === 4) {
            // 本文
            ctx.font = "16px sans-serif";
            ctx.textAlign = "left";
            fillTextLine("色がこい土は２回ほりましょう", 35, 350, 22);

            // 土
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 300, 100, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 300 + 32, 100, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 300, 100 + 32, 32, 32);
            ctx.drawImage(imgSoil2, 0, 0, 16, 16, 300 + 32, 100 + 32, 32, 32);

            ctx.drawImage(imgSoil, 0, 0, 16, 16, 50, 100, 32, 32);
            ctx.drawImage(imgSoil, 0, 0, 16, 16, 50 + 32, 100, 32, 32);
            ctx.drawImage(imgSoil, 0, 0, 16, 16, 50, 100 + 32, 32, 32);
            ctx.drawImage(imgSoil, 0, 0, 16, 16, 50 + 32, 100 + 32, 32, 32);

            // 指
            ctx.drawImage(imgHand, 0, 0, 16, 16, 310, 145, 32, 32);
            ctx.drawImage(imgHand, 0, 0, 16, 16, 60, 145, 32, 32);
        } else if (tutorialPage === 5) {
            // 本文
            ctx.font = "16px sans-serif";
            ctx.textAlign = "left";
            fillTextLine("すべての土をほって、四條畷（しじょうなわて）の文化財（ぶんかざい）をはっくつしよう！", 35, 350, 22);
        } 
    }

    // デバッグ表示
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    if (debug) {
        ctx.fillText("digTargetX = " + Math.floor(digTargetX), 0, 10);
        ctx.fillText("digTargetY = " + Math.floor(digTargetY), 0, 30);
        ctx.fillText("item = " + item, 0, 50);
        ctx.fillText("state = " + state, 0, 70);
        ctx.fillText("tutorialPage = " + tutorialPage, 0, 90);
    }

    ctx.restore();
}

function gameInit()
{
    hp = 5;
    tool = 1;
    particles = [];
    damageAnimation = 0;

    // 盤面リセット
    for (let y = 0; y < field.length; y++) {
        for (let x = 0; x < field[y].length; x++) {
            field[x][y] = 0;
        }
    }

    // 土を被せる
    for (let i = 0; i < 2; i++) {
        for (let y = 0; y < field.length; y++) {
            for (let x = 0; x < field[y].length; x++) {
                if (Math.floor(Math.random() * 5) > 1) field[x][y]++;
            }
        }
    }

    // 出土品を決める
    item = Math.floor(Math.random() * itemName.length);

    isGameClear = false;
}

function createButtons() {
    const buttons = [
        { id : "toolShovel", src : "img/shovel.png", tool : 1 },
        { id : "toolSankakuho-", src : "img/sankakuho-.png", tool : 2 },
        { id : "toolTakebera", src : "img/takebera.png", tool : 3 },
        { id : "digButton", src : "img/dig.png", tool : "dig" }
    ];

    const container = document.createElement("div");
    container.className = "buttons";
    document.getElementById("game-container").appendChild(container);

    buttons.forEach(btn => {
        const img = document.createElement("img");
        img.id = btn.id;
        img.src = btn.src;
        img.className = "btn";

        img.addEventListener("touchstart", function(e) {
            e.preventDefault();
            if (btn.tool === "dig") {
                if (state === 1) doDigAction();
            } else {
                tool = btn.tool;
            }
        });

        container.appendChild(img);
    });
}

function excavate(field, x, y) {
    if (field[x][y] == 2) {
        field[x][y] = 1;
        createParticles(x, y, imgSoil);
        isExcavated = true;
    } else if (field[x][y] == 1) {
        field[x][y] = 0;
        createParticles(x, y, imgSoil2);
        isExcavated = true;
    } else if (field[x][y] == 0) {
        isDamaged = true;
    }
}

// 現在不使用　DrawLine関数
// function drawLine(x1, y1, x2, y2)
// {
//     ctx.beginPath();
//     ctx.moveTo(x1, y1);
//     ctx.lineTo(x2, y2);
//     ctx.stroke();
// }

function fillTextLine(text, x, y, charNum) {
    let textLine = [];

    // textを指定文字ごとに分け、textLineに追加
    for (let i = 0; i < text.length; i += charNum) {
        textLine.push(text.slice(i, i + charNum));
    }

    // 配列を取り出して表示
    for (let i = 0; i < textLine.length; i++) {
        ctx.fillText(textLine[i], x, y + i * 30);
    }
}

function createParticles(x, y, img) {
    const pieces = [
        { sx: 8, sy: 4, vx:  3, vy:  0 },
        { sx: 0, sy: 4, vx: -3, vy:  0 },
        { sx: 4, sy: 0, vx:  0, vy: -3 },
        { sx: 4, sy: 8, vx:  0, vy:  3 },
        { sx: 8, sy: 0, vx:  3, vy: -3 },
        { sx: 0, sy: 0, vx: -3, vy: -3 },
        { sx: 8, sy: 8, vx:  3, vy:  3 },
        { sx: 0, sy: 8, vx: -3, vy:  3 },
    ]
    for (let p of pieces) {
        particles.push({
            x: x * 48 + 18,
            y: y * 48 + 18,
            vx: p.vx,
            vy: p.vy,
            life: 15,
            img: img,
            sx: p.sx, sy: p.sy,
            size: 4
        });
    }
}

function playSound(snd) {
    snd.pause();
    snd.currentTime = 0;
    snd.play();
}

function doDigAction() {
    const x = digTargetX;
    const y = digTargetY;
    // if (x >= 0 && x <= 8 && y >= 0 && y <= 8) {
        switch (tool) {
            case 1:
                if (x != 8) {
                    if (y != 8) excavate(field, x + 1, y + 1);
                    if (y != 0) excavate(field, x + 1, y - 1);
                    excavate(field, x + 1, y);
                }
                if (x != 0) {
                    if (y != 8) excavate(field, x - 1, y + 1);
                    if (y != 0) excavate(field, x - 1, y - 1);
                    excavate(field, x - 1, y);
                }
                if (y != 8) excavate(field, x, y + 1);
                if (y != 0) excavate(field, x, y - 1);
                excavate(field, x, y);
                break;
            case 2:
                if (y != 8) excavate(field, x, y + 1);
                if (y != 0) excavate(field, x, y - 1);
                excavate(field, x, y);
                break;
            case 3:
                excavate(field, x, y);
                break;
        }
    // }

    // ダメージ処理
    if (isDamaged) {
        hp--;
        playSound(sndMiss);
        isDamaged = false;
        damageAnimation = 15;
    }

    // 音処理
    if (isExcavated) {
        playSound(sndExcavate);
        isExcavated = false;
    }

    // ゲームオーバー？
    if (hp <= 0) state = 3;

    // クリアしたか？
    isGameClear = true;
    for (let y = 0; y < field.length; y++) {
        for (let x = 0; x < field[y].length; x++) {
            if (field[x][y] != 0) isGameClear = false;
        }
    }
}