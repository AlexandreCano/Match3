/// <reference path="../../node_modules/phaser-ce/typescript/phaser.comments.d.ts" />

import { Component } from '@angular/core';
import 'phaser-ce/build/custom/pixi';
import 'phaser-ce/build/custom/p2';
import * as Phaser from 'phaser-ce/build/custom/phaser-split';

import { Gem } from './Gem';
import { GemColor } from './Enums';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    game: Phaser.Game;
    graphics: Phaser.graphics;
    tabGame: Gem[][];
    nbColonnes: number;
    nbLignes: number;
    tailleCase: number;
    clickedCase: Gem;
    nbKilledGem: number;
    nbOfhit: number;
    textNbHit: any;
    textNbKilledGem: any;
    gemGroup: any;
    tweening: boolean;
    clicking: boolean;
    cursorOnCase: Gem;
    emitter: any;
    fallingTween: number;

    constructor() {
        this.game = new Phaser.Game(1024, 768, Phaser.AUTO, 'content', {
            preload: this.preload,
            create: this.create,
            update: this.update,
            checkClickOnTab: this.checkClickOnTab,
            checkMatch: this.checkMatch,
            fallGem: this.fallGem,
            fill: this.fill
        });
    }

    preload() {
        this.tabGame = [];
        this.nbColonnes = 10;
        this.nbLignes = 10;
        this.game.load.image('orange', 'assets/images/20.png');
        this.game.load.image('bleu', 'assets/images/21.png');
        this.game.load.image('violet', 'assets/images/22.png');
        this.game.load.image('vert', 'assets/images/23.png');
        this.game.load.image('rouge', 'assets/images/24.png');
        this.game.load.image('background', 'assets/images/background.jpg');
        this.game.load.image('spark', 'assets/images/spark.png');
        this.tailleCase = 64;
        this.clickedCase = null;
        this.nbKilledGem = 0;
        this.nbOfhit = 0;
        this.tweening = false;
        this.clicking = false;
        this.fallingTween = 0;
    }

    create() {

        this.game.add.sprite(0, 0, 'background');
        this.graphics = this.game.add.graphics(0, 0);

        this.emitter = this.game.add.emitter(0, 0, 10);
        this.emitter.makeParticles('spark');
        this.emitter.gravity = 200;

        // création de la grille de jeu
        for (let line = 0; line < this.nbLignes; line++) {
            this.tabGame.push(new Array(this.nbColonnes));
        }

        // remplir la grille de jeu
        for (let line = 0; line < this.nbLignes; line++) {
            for (let column = 0; column < this.nbColonnes; column++) {
                this.tabGame[line][column] = { type: GemColor[GemColor[Math.floor(Math.random() * (5)) + 1]], line: line, column: column };
            }
        }

        this.gemGroup = this.game.add.group();

        while (this.checkMatch(false)) {
            this.fallGem(false);
            this.fill(false);
        }

        this.gemGroup.removeBetween(0);
        for (let line = 0; line < this.nbLignes; line++) {
            for (let column = 0; column < this.nbColonnes; column++) {
                if (this.tabGame[line][column] != null) {
                    switch (this.tabGame[line][column].type) {
                        case GemColor.BLEU:
                            this.gemGroup.create(192 + (column * 64), 64 + (line * 64), 'bleu');
                            break;
                        case GemColor.VIOLET:
                            this.gemGroup.create(192 + (column * 64), 64 + (line * 64), 'violet');
                            break;
                        case GemColor.ORANGE:
                            this.gemGroup.create(192 + (column * 64), 64 + (line * 64), 'orange');
                            break;
                        case GemColor.VERT:
                            this.gemGroup.create(192 + (column * 64), 64 + (line * 64), 'vert');
                            break;
                        case GemColor.ROUGE:
                            this.gemGroup.create(192 + (column * 64), 64 + (line * 64), 'rouge');
                            break;
                        default:
                            break;
                    }
                }
            }
        }

        // affichage nbHit et nbKill
        this.textNbHit = this.game.add.text(10, 10, 'Nombre de coups joués : ' + this.nbOfhit, {
            font: '32px Arial'
            , fill: '#000000'
            , align: 'center'
        });

        this.textNbKilledGem = this.game.add.text(512, 10, 'Nombre jetons supprimés : ' + this.nbKilledGem, {
            font: '32px Arial'
            , fill: '#000000'
            , align: 'center'
        });

        this.graphics.lineStyle(0);
        this.graphics.beginFill(0xFFFFFF, 0.5);
        this.graphics.drawRect(192, 64, 640, 640);
    }

    update() {
        this.textNbKilledGem.text = 'Nombre jetons supprimés : ' + this.nbKilledGem;

        if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
            this.fill(true);
        }

        if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
            this.fallGem(true);
        }

        if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
            this.checkMatch(true);
        }

        if (this.game.input.activePointer.leftButton.isDown && !this.tweening && !this.clicking &&
            this.checkClickOnTab(this.game.input.x, this.game.input.y)) {
            if (this.clickedCase === null) {
                this.clicking = true;
                this.clickedCase = this.tabGame[Math.floor((this.game.input.y - 64) / 64)][Math.floor((this.game.input.x - 192) / 64)];
                this.cursorOnCase = this.clickedCase;
                this.game.time.events.add(250, () => {
                    this.clicking = false;
                }, this);
            } else {
                const newClickedCase = this.tabGame[Math.floor((this.game.input.y - 64) / 64)][Math.floor((this.game.input.x - 192) / 64)];
                if (Math.abs(newClickedCase.line - this.clickedCase.line) <= 1 &&
                    Math.abs(newClickedCase.column - this.clickedCase.column) === 0 ||
                    Math.abs(newClickedCase.column - this.clickedCase.column) <= 1 &&
                    Math.abs(newClickedCase.line - this.clickedCase.line) === 0) {
                    this.nbOfhit++;
                    this.textNbHit.text = 'Nombre de coups joués : ' + this.nbOfhit;
                    this.tweening = true;
                    this.cursorOnCase = null;
                    this.graphics.clear();
                    this.graphics.lineStyle(0);
                    this.graphics.beginFill(0xFFFFFF, 0.5);
                    this.graphics.drawRect(192, 64, 640, 640);
                    const sprites = [];
                    this.gemGroup.forEach(sprite => {
                        if (sprite.position.x === (this.clickedCase.column * 64) + 192 &&
                            sprite.position.y === (this.clickedCase.line * 64) + 64) {
                            sprites[0] = sprite;
                        }
                        if (sprite.position.x === (newClickedCase.column * 64) + 192 &&
                            sprite.position.y === (newClickedCase.line * 64) + 64) {
                            sprites[1] = sprite;
                        }
                    }, this);
                    const posSprites0 = [sprites[0].position.x, sprites[0].position.y];

                    const tween1 = this.game.add.tween(sprites[0]);
                    const tween2 = this.game.add.tween(sprites[1]);
                    tween1.to({ x: sprites[1].position.x, y: sprites[1].position.y }, 500, 'Linear', true, 0);
                    tween2.to({ x: posSprites0[0], y: posSprites0[1] }, 500, 'Linear', true, 0);
                    tween2.onComplete.add(() => {
                        this.checkMatch(true);
                    }, this);
                    const type = this.clickedCase.type;
                    this.tabGame[this.clickedCase.line][this.clickedCase.column].type = newClickedCase.type;
                    this.tabGame[newClickedCase.line][newClickedCase.column].type = type;
                    this.clickedCase = null;
                } else {
                    this.clickedCase = newClickedCase;
                    this.cursorOnCase = this.clickedCase;
                }
            }
        } else if (this.checkClickOnTab(this.game.input.x, this.game.input.y) && this.clickedCase === null && !this.tweening) {
            this.cursorOnCase = this.tabGame[Math.floor((this.game.input.y - 64) / 64)][Math.floor((this.game.input.x - 192) / 64)];
        }

        if (this.cursorOnCase != null) {
            this.graphics.clear();
            this.graphics.lineStyle(0);
            this.graphics.beginFill(0xFFFFFF, 0.5);
            this.graphics.drawRect(192, 64, 640, 640);
            this.graphics.lineStyle(2, 0xFFFFFF, 1);
            this.graphics.drawRect((this.cursorOnCase.column * 64) + 192, (this.cursorOnCase.line * 64) + 64, 64, 64);
        }


    }

    checkMatch(emitting: boolean): boolean {
        const matches = [];
        for (let line = 0; line < this.nbLignes; line++) {
            for (let column = 0; column < this.nbColonnes; column++) {
                const gem = this.tabGame[line][column];
                const matchingListHorizontal = [gem];
                const matchingListVertical = [gem];
                let up: Gem;
                let down: Gem;
                let left: Gem;
                let right: Gem;
                if (gem != null && line > 0) {
                    up = this.tabGame[line - 1][column];
                    if (up != null && up.type === gem.type) {
                        matchingListVertical.push(up);
                        let matching = true;
                        while (matching && up.line > 0) {
                            up = this.tabGame[up.line - 1][up.column];
                            if (up != null && up.type === gem.type) {
                                matchingListVertical.push(up);
                            } else {
                                matching = false;
                            }
                        }
                    }
                }
                if (gem != null && line < 9) {
                    down = this.tabGame[line + 1][column];
                    if (down != null && down.type === gem.type) {
                        matchingListVertical.push(down);
                        let matching = true;
                        while (matching && down.line < 9) {
                            down = this.tabGame[down.line + 1][down.column];
                            if (down != null && down.type === gem.type) {
                                matchingListVertical.push(down);
                            } else {
                                matching = false;
                            }
                        }
                    }
                }
                if (gem != null && column > 0) {
                    left = this.tabGame[line][column - 1];
                    if (left != null && left.type === gem.type) {
                        matchingListHorizontal.push(left);
                        let matching = true;
                        while (matching && left.column > 0) {
                            left = this.tabGame[left.line][left.column - 1];
                            if (left != null && left.type === gem.type) {
                                matchingListHorizontal.push(left);
                            } else {
                                matching = false;
                            }
                        }
                    }
                }
                if (gem != null && column < 9) {
                    right = this.tabGame[line][column + 1];
                    if (right != null && right.type === gem.type) {
                        matchingListHorizontal.push(right);
                        let matching = true;
                        while (matching && right.column > 0) {
                            right = this.tabGame[right.line][right.column + 1];
                            if (right != null && right.type === gem.type) {
                                matchingListHorizontal.push(right);
                            } else {
                                matching = false;
                            }
                        }
                    }
                }

                if (matchingListHorizontal.length >= 3) {
                    matchingListHorizontal.forEach(matchingGem => {
                        matches.push(matchingGem);
                    });
                }
                if (matchingListVertical.length >= 3) {
                    matchingListVertical.forEach(matchingGem => {
                        matches.push(matchingGem);
                    });
                }
            }
        }
        const result = matches.length > 0;
        matches.forEach(matchingGem => {
            if (emitting) {
                const spriteToDestroy = [];
                this.gemGroup.forEach(sprite => {
                    if (sprite.position.x === (matchingGem.column * 64) + 192 && sprite.position.y === (matchingGem.line * 64) + 64) {
                        spriteToDestroy.push(sprite);
                    }
                }, this);
                spriteToDestroy.forEach(sprite => {
                    this.nbKilledGem++;
                    this.gemGroup.remove(sprite);
                    sprite.destroy();
                });
                const emitter = this.game.add.emitter((matchingGem.column * 64) + 224, (matchingGem.line * 64) + 96, 5);
                emitter.makeParticles('spark');
                emitter.gravity = 1500;
                emitter.start(true, 2000, null, 5);
            }
            this.tabGame[matchingGem.line][matchingGem.column] = null;
        });
        if (result) {
            this.fallGem(emitting);
        } else {
            this.tweening = false;
        }
        return result;
    }

    fallGem(tweening: boolean) {
        let noTween = true;
        for (let column = 0; column < this.nbColonnes; column++) {
            for (let line = 9; line >= 0; line--) {
                if (this.tabGame[line][column] === null) {
                    let lineNextNonNull = line;
                    while (lineNextNonNull > 0 && this.tabGame[lineNextNonNull][column] === null) {
                        lineNextNonNull--;
                    }

                    if (this.tabGame[lineNextNonNull][column] !== null) {
                        if (tweening) {
                            let spriteToTween;
                            this.gemGroup.forEach(sprite => {
                                if (sprite.position.x === (column * 64) + 192 &&
                                    sprite.position.y === (lineNextNonNull * 64) + 64) {
                                    spriteToTween = sprite;
                                }
                            });
                            const tween = this.game.add.tween(spriteToTween);
                            noTween = false;
                            tween.to({ y: (line * 64) + 64 }, 500 * (lineNextNonNull - line), 'Linear', true, 0);
                            this.fallingTween++;
                            tween.onComplete.add(() => {
                                this.fallingTween--;
                                if (this.fallingTween === 0) {
                                    this.fill(tweening);
                                }
                            }, this);
                            tween.start();
                        }
                        this.tabGame[line][column] = {
                            type: this.tabGame[lineNextNonNull][column].type,
                            line: line,
                            column: column
                        };
                        this.tabGame[lineNextNonNull][column] = null;
                    }
                }
            }
        }
        if (noTween) {
            this.fill(tweening);
        }
    }

    fill(tweening: boolean) {
        for (let column = 0; column < this.nbColonnes; column++) {
            for (let line = 0; line < this.nbLignes; line++) {
                if (this.tabGame[line][column] != null) {
                    for (let i = line - 1; i >= 0; i--) {
                        this.tabGame[i][column] = {
                            type: GemColor[GemColor[Math.floor(Math.random() * (5)) + 1]],
                            line: i, column: column
                        };
                        if (tweening) {
                            let sprite;
                            switch (this.tabGame[i][column].type) {
                                case GemColor.BLEU:
                                    sprite = this.gemGroup.create(192 + (column * 64), 64, 'bleu');
                                    break;
                                case GemColor.VIOLET:
                                    sprite = this.gemGroup.create(192 + (column * 64), 64, 'violet');
                                    break;
                                case GemColor.ORANGE:
                                    sprite = this.gemGroup.create(192 + (column * 64), 64, 'orange');
                                    break;
                                case GemColor.VERT:
                                    sprite = this.gemGroup.create(192 + (column * 64), 64, 'vert');
                                    break;
                                case GemColor.ROUGE:
                                    sprite = this.gemGroup.create(192 + (column * 64), 64, 'rouge');
                                    break;
                                default:
                                    break;
                            }
                            const tween = this.game.add.tween(sprite);
                            tween.to({ x: (column * 64) + 192, y: (i * 64) + 64 }, 500 * (i + 1), 'Linear', true, 0);
                            this.fallingTween++;
                            tween.onComplete.add(() => {
                                this.fallingTween--;
                                if (this.fallingTween === 0) {
                                    this.checkMatch(tweening);
                                }
                            }, this);
                        }
                    }
                    line = this.nbLignes;
                }
            }
        }
    }

    checkClickOnTab(x, y): boolean {
        return x >= 192 && x <= 832 && y >= 64 && y <= 704;
    }
}
