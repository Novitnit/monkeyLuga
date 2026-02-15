import Phaser from "phaser";

export class BackgroundRenderer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init() {
    const cam = this.scene.cameras.main;
    const w = cam.width;
    const h = cam.height;

    // Sky layer (fixed)
    const sky = this.scene.add.rectangle(
      w / 2,
      h / 2,
      w,
      h,
      0xF6D5A4 // soft desert peach
    );
    sky.setScrollFactor(0).setDepth(-100);

    // Sun glow circles (fixed)
    const sun = this.scene.add.graphics();
    sun.fillStyle(0xFFE6B3, 0.25);
    sun.fillCircle(160, 110, 90);
    sun.fillStyle(0xFFE6B3, 0.15);
    sun.fillCircle(160, 110, 150);
    sun.fillStyle(0xFFE6B3, 0.08);
    sun.fillCircle(160, 110, 220);
    sun.setScrollFactor(0).setDepth(-99);

    // Distant dunes (slow parallax)
    const far = this.scene.add.graphics();
    far.setDepth(-90);
    far.setScrollFactor(0.15);
    far.fillStyle(0xE6C395, 1);
    far.beginPath();
    far.moveTo(0, h * 0.78);
    far.lineTo(w * 0.2, h * 0.74);
    far.lineTo(w * 0.4, h * 0.80);
    far.lineTo(w * 0.6, h * 0.77);
    far.lineTo(w * 0.8, h * 0.75);
    far.lineTo(w, h * 0.76);
    far.lineTo(w, h);
    far.lineTo(0, h);
    far.closePath();
    far.fillPath();

    // Mid dunes (medium parallax)
    const mid = this.scene.add.graphics();
    mid.setDepth(-85);
    mid.setScrollFactor(0.35);
    mid.fillStyle(0xD9B47F, 1);
    mid.beginPath();
    mid.moveTo(0, h * 0.86);
    mid.lineTo(w * 0.2, h * 0.84);
    mid.lineTo(w * 0.4, h * 0.88);
    mid.lineTo(w * 0.6, h * 0.86);
    mid.lineTo(w * 0.8, h * 0.84);
    mid.lineTo(w, h * 0.86);
    mid.lineTo(w, h);
    mid.lineTo(0, h);
    mid.closePath();
    mid.fillPath();

    // Foreground sand base (faster parallax)
    const fg = this.scene.add.graphics();
    fg.setDepth(-80);
    fg.setScrollFactor(0.6);
    fg.fillStyle(0xCFA46F, 1);
    fg.fillRect(0, h * 0.92, w, h * 0.08);

    // Gentle darker edge
    fg.lineStyle(2, 0x9E7A4D, 0.5);
    fg.strokeRect(0, h * 0.92, w, h * 0.08);
  }
}
