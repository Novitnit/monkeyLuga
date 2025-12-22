import Phaser from "phaser";
import { Client, getStateCallbacks, Room } from "colyseus.js";
import { GameState } from "@isgame/shared";
import { map1 } from "@isgame/shared";
import { QuestionUI } from "./ui/QuestionUI";
import { InteractRenderer } from "./render/InteractRenderer";
import { DoorRenderer } from "./render/DoorRenderer";
import { JumpZoneRenderer } from "./render/JumpZoneRenderer";
import { KillZoneRenderer } from "./render/KillZoneRenderer";
import { TeleportZoneRenderer } from "./render/TeleportZoneRenderer";
import { TbcZoneRenderer } from "./render/TbcZoneRenderer";
import { TbcUI } from "./ui/TbcUI";
import { navigateTo } from "../../routing";
import { MobileControls } from "./ui/MobileControls";
// import { navigateTo } from "../../routing"; // no auto-redirect on join failure

export default class GameScene extends Phaser.Scene {
    private sendAccum = 0;
    private readonly SEND_HZ = 20;

    private room!: Room<GameState>;
    private players = new Map<string, Phaser.GameObjects.Image>();
    // private players = new Map<string, Phaser.GameObjects.Rectangle>();
    private dot = new Map<string, Phaser.GameObjects.Rectangle>();
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private mobileControls?: MobileControls;

    private targets = new Map<string, { x: number; y: number }>();
    private questionUI?: QuestionUI;
    private myId!: string;

    private keyE!: Phaser.Input.Keyboard.Key;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;

    private bg!: Phaser.GameObjects.TileSprite;

    constructor() {
        super("game");
    }

    preload() {
        this.load.image("player", "/assets/player.png");
        this.load.image("bg", "/assets/Background6.png");
    }

    async create(data: { roomId: string; room?: Room<GameState> }) {
        if (data.room) {
            this.room = data.room;
        } else {
            const ip = import.meta.env.VITE_API_URL || `ws://localhost:3000`;
            const client = new Client(ip);
            try {
                this.room = await client.joinById<GameState>(data.roomId);
            } catch (err) {
                console.error("Failed to join room:", err);
                this.room?.leave();
                this.scene.stop();
                this.scene.remove();
                this.game?.destroy(true);
                navigateTo("/game");
                return;
            }
        }

        this.myId = this.room.sessionId;

        console.log("Joined room:", data.roomId);

        this.keyE = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.E
        );
        this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.cameras.main.setBounds(510, 0, 5000, 705);

        this.mobileControls = new MobileControls(this);
        this.mobileControls.init();

        if (this.room.sessionId) {
            this.createBackground();
            this.setupRender();
            this.setupUI();
            this.setupMapDecor();
        }

        this.room.onLeave(() => {
            this.room.leave();
            this.scene.stop();
            navigateTo("/");
        })
    }

    update(_time: number, delta: number): void {
        if (!this.room) return;

        for (const [id, rect] of this.players) {
            const t = this.targets.get(id);
            if (!t) continue;

            rect.x += (t.x - rect.x) * 0.2;
            rect.y += (t.y - rect.y) * 0.2;
        }

        const leftKb = (this.cursors.left.isDown || this.keyA.isDown) ?? false;
        const rightKb = (this.cursors.right.isDown || this.keyD.isDown) ?? false;
        const jumpKb = (this.cursors.space?.isDown) ?? false;
        
        const jumpTouch = this.mobileControls?.isJumpActive() ?? false;
        const leftTouch = this.mobileControls?.left ?? false;
        const rightTouch = this.mobileControls?.right ?? false;

        const left = leftKb || leftTouch;
        const right = rightKb || rightTouch;
        const jump = jumpKb || jumpTouch;

        this.sendAccum += delta;
        const interval = 1000 / this.SEND_HZ;
        if (this.sendAccum < interval) return;
        this.sendAccum = 0;

        // this.bg.tilePositionX = this.cameras.main.scrollX;
        // this.bg.tilePositionY = this.cameras.main.scrollY;

        this.room.send("input", { left, right, jump });
    
        const interactPress = Phaser.Input.Keyboard.JustDown(this.keyE) || (this.mobileControls?.consumeInteractPress() ?? false);
        if (interactPress) {
            this.room.send("interact");
        }
    }

    private createBackground() {

    }

    private setupUI() {
        this.questionUI = new QuestionUI(this, this.room);
        this.questionUI.init();
        const tbcUI = new TbcUI(this, this.room);
        tbcUI.init();
        const interactRenderer = new InteractRenderer(this, this.room);
        interactRenderer.init();
        const doorRenderer = new DoorRenderer(this, this.room);
        doorRenderer.init();
    }

    private setupRender() {
        const $ = getStateCallbacks(this.room);

        $(this.room.state).players.onAdd((player, id) => {
            // const rect = this.add.rectangle(
            //     player.x,
            //     player.y,
            //     player.w / 2,
            //     player.h / 2,
            //     this.cssColorToNumber(player.color)
            // )
            const rect = this.add.image(
                player.x,
                player.y,
                "player"
            );
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

                const mainplatformX = 500;
                const mainplatformY = 630;

                // console.log(`rx:${player.x}, ry:${player.y} x:${player.x-mainplatformX}, y:${-(player.y-mainplatformY)}`);
                // console.log(`x:${player.x - mainplatformX}, y:${(-(player.y - mainplatformY)) - player.h / 2}`);
                // rect.setFillStyle(this.cssColorToNumber(player.color));

                if (dt) {
                    dt.x = player.x;
                    dt.y = player.y;
                }
            });

            if (id === this.myId) {
                this.cameras.main.startFollow(rect, false);
            }
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

    private setupMapDecor() {
        map1.platforms.forEach(p => {
            this.add.rectangle(
                p.x + p.w / 2,
                p.y + p.h / 2,
                p.w,
                p.h,
                0x888888
            ).setDepth(10)
        })

        // visualize high jump zones
        const jumpZones = new JumpZoneRenderer(this);
        jumpZones.init();

        // visualize kill zones
        const killZones = new KillZoneRenderer(this);
        killZones.init();

        // visualize teleport zones
        const tpZones = new TeleportZoneRenderer(this);
        tpZones.init();

        // visualize To-Be-Continued zones
        const tbcZones = new TbcZoneRenderer(this);
        tbcZones.init();
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
