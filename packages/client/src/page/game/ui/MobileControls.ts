import Phaser from "phaser";

export class MobileControls {
  private scene: Phaser.Scene;
  // primary controls
  private leftBtn!: Phaser.GameObjects.Rectangle;
  private rightBtn!: Phaser.GameObjects.Rectangle;
  private jumpBtn!: Phaser.GameObjects.Rectangle;
  private interactBtn!: Phaser.GameObjects.Rectangle;
  // duplicate action controls (second row)
  

  // labels
  private leftLabel!: Phaser.GameObjects.Text;
  private rightLabel!: Phaser.GameObjects.Text;
  private jumpLabel!: Phaser.GameObjects.Text;
  private interactLabel!: Phaser.GameObjects.Text;
  

  private resizeBound?: (gameSize: Phaser.Structs.Size) => void;

  // states
  private _left = false;
  private _right = false;
  private _jumpPressedOnce = false;
  private _interactPressedOnce = false;
  private _jumpHeld = false;
  private _interactHeld = false;
  private _jumpHoldUntil: number | null = null; // sticky window ms

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init() {
    const isTouch = (navigator.maxTouchPoints ?? 0) > 0;
    if (!isTouch) {
      return;
    }
    const pad = 24;
    const btnW = 64;
    const btnH = 64;
    const gap = 12;

    // create buttons
    this.leftBtn = this.scene.add
      .rectangle(0, 0, btnW, btnH, 0x333333, 0.35)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(2000)
      .setInteractive();

    this.rightBtn = this.scene.add
      .rectangle(0, 0, btnW, btnH, 0x333333, 0.35)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(2000)
      .setInteractive();

    this.jumpBtn = this.scene.add
      .rectangle(0, 0, btnW, btnH, 0x333333, 0.35)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(2000)
      .setInteractive();

    this.interactBtn = this.scene.add
      .rectangle(0, 0, btnW, btnH, 0x333333, 0.35)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(2000)
      .setInteractive();

    

    // labels
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: "24px",
      color: "#ffffff",
    };
    this.leftLabel = this.scene.add.text(0, 0, "←", labelStyle).setOrigin(0.5).setDepth(2001);
    this.rightLabel = this.scene.add.text(0, 0, "→", labelStyle).setOrigin(0.5).setDepth(2001);
    this.jumpLabel = this.scene.add.text(0, 0, "↑", labelStyle).setOrigin(0.5).setDepth(2001);
    this.interactLabel = this.scene.add.text(0, 0, "E", labelStyle).setOrigin(0.5).setDepth(2001);
    

    [
      this.leftBtn,
      this.rightBtn,
      this.jumpBtn,
      this.interactBtn,
      this.leftLabel,
      this.rightLabel,
      this.jumpLabel,
      this.interactLabel,
    ].forEach((obj) => (obj as any).setScrollFactor(0));

    // initial layout
    const { width, height } = this.scene.scale;
    this.layout(width, height, pad, btnW, btnH, gap);

    // responsive layout on resize
    this.resizeBound = (gameSize: Phaser.Structs.Size) => {
      this.layout(gameSize.width, gameSize.height, pad, btnW, btnH, gap);
    };
    this.scene.scale.on("resize", this.resizeBound, this);

    // touch handlers: movement
    this.leftBtn.on("pointerdown", () => {
      this._left = true;
    });
    this.leftBtn.on("pointerup", () => {
      this._left = false;
    });
    this.leftBtn.on("pointerout", () => {
      this._left = false;
    });
    this.leftBtn.on("pointercancel", () => {
      this._left = false;
    });

    this.rightBtn.on("pointerdown", () => {
      this._right = true;
    });
    this.rightBtn.on("pointerup", () => {
      this._right = false;
    });
    this.rightBtn.on("pointerout", () => {
      this._right = false;
    });
    this.rightBtn.on("pointercancel", () => {
      this._right = false;
    });

    // touch handlers: jump (both rows)
    const onJumpDown = () => {
      this._jumpPressedOnce = true;
      this._jumpHeld = true;
      this._jumpHoldUntil = Date.now() + 500; // sticky window
    };
    const onJumpUp = () => {
      this._jumpHeld = false;
    };
    this.jumpBtn.on("pointerdown", onJumpDown);
    this.jumpBtn.on("pointerup", onJumpUp);
    this.jumpBtn.on("pointerout", onJumpUp);
    this.jumpBtn.on("pointercancel", onJumpUp);

    

    // touch handlers: interact (both rows)
    const onInteractDown = () => {
      this._interactPressedOnce = true;
      this._interactHeld = true;
    };
    const onInteractUp = () => {
      this._interactHeld = false;
    };
    this.interactBtn.on("pointerdown", onInteractDown);
    this.interactBtn.on("pointerup", onInteractUp);
    this.interactBtn.on("pointerout", onInteractUp);
    this.interactBtn.on("pointercancel", onInteractUp);

    
  }

  private layout(
    width: number,
    height: number,
    pad: number,
    btnW: number,
    btnH: number,
    gap: number
  ) {
    // left bottom
    this.leftBtn.setPosition(pad + btnW / 2, height - pad - btnH / 2);
    this.leftLabel.setPosition(this.leftBtn.x, this.leftBtn.y);

    // right next to left
    this.rightBtn.setPosition(pad + btnW / 2 + btnW + gap, height - pad - btnH / 2);
    this.rightLabel.setPosition(this.rightBtn.x, this.rightBtn.y);

    // right-side action cluster
    this.jumpBtn.setPosition(width - pad - btnW / 2, height - pad - btnH / 2);
    this.jumpLabel.setPosition(this.jumpBtn.x, this.jumpBtn.y);

    this.interactBtn.setPosition(width - pad - btnW / 2, height - pad - btnH / 2 - (btnH + gap));
    this.interactLabel.setPosition(this.interactBtn.x, this.interactBtn.y);

    
  }

  get left(): boolean { return this._left; }
  get right(): boolean { return this._right; }

  // one-shot
  consumeJumpPress(): boolean {
    const p = this._jumpPressedOnce;
    this._jumpPressedOnce = false;
    return p;
  }

  // one-shot
  consumeInteractPress(): boolean {
    const p = this._interactPressedOnce;
    this._interactPressedOnce = false;
    return p;
  }

  // held/active states
  isJumpActive(): boolean {
    return this._jumpHoldUntil !== null && Date.now() < this._jumpHoldUntil;
  }
  isJumpHeld(): boolean { return this._jumpHeld; }
  isInteractHeld(): boolean { return this._interactHeld; }

  destroy() {
    if (this.resizeBound) {
      this.scene.scale.off("resize", this.resizeBound, this);
      this.resizeBound = undefined;
    }
    this.leftBtn?.destroy();
    this.rightBtn?.destroy();
    this.jumpBtn?.destroy();
    this.interactBtn?.destroy();
    this.leftLabel?.destroy();
    this.rightLabel?.destroy();
    this.jumpLabel?.destroy();
    this.interactLabel?.destroy();
    
  }
}
