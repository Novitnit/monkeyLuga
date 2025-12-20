import Phaser from "phaser";
import { Client, getStateCallbacks, Room } from "colyseus.js";
import { GameState } from "@isgame/shared";
import { map1 } from "@isgame/shared";

export default class GameScene extends Phaser.Scene {
    private sendAccum = 0;
    private readonly SEND_HZ = 20;

    private room!: Room<GameState>;
    // private players = new Map<string, Phaser.GameObjects.Image>();
    private players = new Map<string, Phaser.GameObjects.Rectangle>();
    private dot = new Map<string, Phaser.GameObjects.Rectangle>();
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private targets = new Map<string, { x: number; y: number }>();
    private questionUI?: Phaser.GameObjects.Container;
    private myId!: string;

    private keyE!: Phaser.Input.Keyboard.Key;

    // private bg!: Phaser.GameObjects.TileSprite;

    constructor() {
        super("game");
    }

    preload() {
        this.load.image("player", "/assets/player.png");
        // this.load.image("bg", "/assets/Background6.png");
    }

    async create(data: { roomId: string; room?: Room<GameState> }) {
        if (data.room) {
            this.room = data.room;
        } else {
            const ip = "ws://server:3000";

            const client = new Client(ip);
            this.room = await client.joinById<GameState>(data.roomId);
        }

        this.myId = this.room.sessionId;

        console.log("Joined room:", data.roomId);

        this.keyE = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.E
        );

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.cameras.main.setBounds(510, 0, 5000, 705);
        this.createBackground();
        this.setupRender();
        this.setupQuestionUI();
    }

    update(_time: number, delta: number): void {
        if (!this.room) return;


        for (const [id, rect] of this.players) {
            const t = this.targets.get(id);
            if (!t) continue;

            rect.x += (t.x - rect.x) * 0.2;
            rect.y += (t.y - rect.y) * 0.2;
        }

        const left = (this.cursors.left.isDown) ?? false;
        const right = (this.cursors.right.isDown) ?? false;
        const jump = (this.cursors.space?.isDown) ?? false;

        this.sendAccum += delta;
        const interval = 1000 / this.SEND_HZ;
        if (this.sendAccum < interval) return;
        this.sendAccum = 0;

        // this.bg.tilePositionX = this.cameras.main.scrollX;
        // this.bg.tilePositionY = this.cameras.main.scrollY;

        this.room.send("input", { left, right, jump });
        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
            this.room.send("interact");
        }
    }

    private createBackground() {
        // this.bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, "bg").setOrigin(0, 0).setScrollFactor(0);

        // this.bg.setTileScale(4, 4);
        // this.bg.setDepth(-1);
    }

    private setupQuestionUI() {
        this.room.onMessage("question_show", data => {
            if (this.questionUI) return;
            const { width, height } = this.scale;
            const bg = this.add.rectangle(
                width / 2,
                height / 2,
                width,
                height,
                0x000000,
                0.6
            ).setDepth(200);

            const panel = this.add.rectangle(
                width / 2,
                height / 2,
                520,
                360,
                0xffffff,
                1
            ).setStrokeStyle(2, 0x000000).setDepth(201);

            const questionText = this.add.text(
                width / 2,
                height / 2 - 120,
                data.question,
                {
                    fontSize: "20px",
                    color: "#000",
                    wordWrap: { width: 480 }
                }
            ).setOrigin(0.5).setDepth(201)

            const choiceArray = Object.entries(data.choices).map(
                ([id, text]) => ({ id, text })
            );

            const shuffledChoices = this.shuffle(choiceArray);
            const buttons: Phaser.GameObjects.GameObject[] = [];
            shuffledChoices.forEach((choice, index) => {
                const y = height / 2 - 40 + index * 60;

                const btnBg = this.add.rectangle(
                    width / 2,
                    y,
                    420,
                    44,
                    0xdddddd
                ).setInteractive().setDepth(201);

                const btnText = this.add.text(
                    width / 2,
                    y,
                    choice.text as string,
                    {
                        fontSize: "18px",
                        color: "#000"
                    }
                ).setOrigin(0.5).setDepth(999);

                btnBg.on("pointerdown", () => {
                    console.log(data)
                    this.selectAnswer(data.qid, choice.id);
                });

                // btnText.on("pointerover", () => { console.log("hover") });

                buttons.push(btnBg, btnText);
            })
            this.questionUI = this.add.container(0, 0, [
                bg,
                panel,
                questionText,
                ...buttons
            ]);

            [bg, panel, questionText, ...buttons].forEach(obj =>
                (obj as any).setScrollFactor(0)
            );
        })

        this.room.onMessage("question_result", data => {
            console.log("Answer result:", data);
            this.closeQuestionUI();
            if (!data.isCorrect) {
                this.room.send("getNewQuestion");
            }
        });
    }

    private setupRender() {
        const $ = getStateCallbacks(this.room);

        $(this.room.state).players.onAdd((player, id) => {
            // const rect = this.add.image(player.x, player.y, 'player');
            const rect = this.add.rectangle(
                player.x,
                player.y,
                player.w / 2,
                player.h / 2,
                this.cssColorToNumber(player.color)
            )
            rect.setScale(2)
            console.log(rect.height, rect.width);
            const dot = this.add.rectangle(player.x, player.y, 5, 5, 0xff0000);
            this.players.set(id, rect);
            this.dot.set(id + "_dot", dot);
            this.targets.set(id, { x: player.x, y: player.y });

            $(player).onChange(() => {
                const t = this.targets.get(id);
                const dt = this.dot.get(id + "_dot");
                if (!t) return;
                t.x = player.x;
                t.y = player.y;

                // keep color synced if it changes
                rect.setFillStyle(this.cssColorToNumber(player.color));

                if (dt) {
                    dt.x = player.x;
                    dt.y = player.y;
                }
            });

            if (id === this.myId) {
                this.cameras.main.startFollow(rect, false);
            }
            const interactRects = new Map<string, Phaser.GameObjects.Rectangle>();
            $(this.room.state).interactBoxes.onAdd((box, id) => {
                const r = this.add.rectangle(
                    box.x + box.w / 2,
                    box.y + box.h / 2,
                    box.w,
                    box.h,
                    0x00ff00,
                    0.3
                ).setDepth(100);
                interactRects.set(id, r);

                this.room.onMessage("interact_fx", data => {
                    const r = interactRects.get(data.boxId);
                    if (!r) return;

                    r.setFillStyle(0x00ff00, 0.6);

                    this.time.delayedCall(200, () => {
                        r.setFillStyle(0x00ff00, 0.3);
                    });
                });
            });
        });

        map1.platforms.forEach(p => {
            this.add.rectangle(
                p.x + p.w / 2,
                p.y + p.h / 2,
                p.w,
                p.h,
                0x888888
            ).setDepth(10)
        })

        $(this.room.state).players.onRemove((_, id) => {
            const rect = this.players.get(id);
            rect?.destroy();
            this.players.delete(id);
        });
    }

    private shuffle<T>(arr: T[]): T[] {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a as T[];
    }

    private selectAnswer(questionId: string, answerId: string) {
        // console.log("Selected answer:", questionId, answerId);
        this.room.send("answer_question", {
            questionId,
            answerId
        });
    }

    private closeQuestionUI() {
        if (!this.questionUI) return;
        this.questionUI.destroy(true);
        this.questionUI = undefined;
    }

    // Utility: convert CSS color string (#hex or hsl(...)) to Phaser number
    private cssColorToNumber(c: string): number {
        if (!c) return 0xffffff;
        if (c.startsWith('#')) {
            const hex = c.slice(1);
            const n = parseInt(hex, 16);
            return Number.isNaN(n) ? 0xffffff : n;
        }
        if (c.startsWith('hsl')) {
            const m = c.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i);
            if (m) {
                const h = parseInt(m[1], 10);
                const s = parseInt(m[2], 10) / 100;
                const l = parseInt(m[3], 10) / 100;
                const rgb = this.hslToRgb(h, s, l);
                return (rgb.r << 16) | (rgb.g << 8) | rgb.b;
            }
        }
        return 0xffffff;
    }

    private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const hp = (h % 360) / 60;
        const x = c * (1 - Math.abs((hp % 2) - 1));
        let r1 = 0, g1 = 0, b1 = 0;
        if (0 <= hp && hp < 1) { r1 = c; g1 = x; b1 = 0; }
        else if (1 <= hp && hp < 2) { r1 = x; g1 = c; b1 = 0; }
        else if (2 <= hp && hp < 3) { r1 = 0; g1 = c; b1 = x; }
        else if (3 <= hp && hp < 4) { r1 = 0; g1 = x; b1 = c; }
        else if (4 <= hp && hp < 5) { r1 = x; g1 = 0; b1 = c; }
        else if (5 <= hp && hp < 6) { r1 = c; g1 = 0; b1 = x; }
        const m = l - c / 2;
        const r = Math.round((r1 + m) * 255);
        const g = Math.round((g1 + m) * 255);
        const b = Math.round((b1 + m) * 255);
        return { r, g, b };
    }
}
