import Phaser from "phaser";
import { Client, getStateCallbacks, Room } from "colyseus.js";
import { GameState } from "@isgame/shared/schema";

function getClient(): Client {
    const g = globalThis as any;
    if (!g.__colyClient) g.__colyClient = new Client("ws://localhost:3000");
    return g.__colyClient as Client;
}

export default class GameScene extends Phaser.Scene {
    private sendAccum = 0;
    private readonly SEND_HZ = 20;

    private room!: Room<GameState>;
    private players = new Map<string, Phaser.GameObjects.Rectangle>();
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    private targets = new Map<string, { x: number; y: number }>();

    constructor() {
        super("game");
    }

    async create(data: { roomId: string; room?: Room<GameState> }) {
        if (data.room) {
            this.room = data.room;
        } else {
            const client = getClient();
            this.room = await client.joinById<GameState>(data.roomId);
        }

        console.log("Joined room:", data.roomId);

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.setupRender();
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

        this.room.send("input", { left, right, jump });
    }

    private setupRender() {
        const $ = getStateCallbacks(this.room);

        $(this.room.state).players.onAdd((player, id) => {
            const rect = this.add.rectangle(player.x, player.y, 32, 32, 0x00ff00);
            this.players.set(id, rect);
            this.targets.set(id, { x: player.x, y: player.y });

            $(player).onChange(() => {
                const t = this.targets.get(id);
                if (!t) return;
                t.x = player.x;
                t.y = player.y;
            });
        });

        $(this.room.state).players.onRemove((_, id) => {
            const rect = this.players.get(id);
            rect?.destroy();
            this.players.delete(id);
        });
    }
}
