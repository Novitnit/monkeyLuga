import Phaser from "phaser";
import type { Room } from "colyseus.js";
import type { GameState } from "@isgame/shared";

export type ShowQuestionPayload = {
  boxId: string;
  qid: string;
  question: string;
  choices: Record<string, string>;
};

export class QuestionUI {
  private scene: Phaser.Scene;
  private room: Room<GameState>;
  private container?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, room: Room<GameState>) {
    this.scene = scene;
    this.room = room;
  }

  init() {
    this.room.onMessage("question_show", data => {
      if (this.container) return;
      this.build(data as ShowQuestionPayload);
    });

    this.room.onMessage("question_result", _data => {
      this.close();
    });
  }

  private build(data: ShowQuestionPayload) {
    const { width, height } = this.scene.scale;
    const isTouch = (navigator.maxTouchPoints ?? 0) > 0;
    const pad = isTouch ? 16 : 24;
    const panelW = Math.min(width - pad * 2, isTouch ? 560 : 520);
    const panelH = Math.min(height - pad * 2, isTouch ? 420 : 360);
    // Adjust font sizes for mobile (touch) to improve fit
    const questionFont = isTouch ? "18px" : "20px";
    const buttonH = isTouch ? 56 : 44;
    const buttonFont = isTouch ? "16px" : "18px";
    const spacingY = isTouch ? 72 : 60;
    const wrapW = panelW - 40;

    const bg = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.6
    );

    const panel = this.scene.add.rectangle(
      width / 2,
      height / 2,
      panelW,
      panelH,
      0xffffff,
      1
    ).setStrokeStyle(2, 0x000000);

    const questionText = this.scene.add.text(
      width / 2,
      height / 2 - (panelH / 2) + 40,
      data.question,
      {
        fontSize: questionFont,
        color: "#000",
        wordWrap: { width: wrapW }
      }
    ).setOrigin(0.5);

    const choiceArray = Object.entries(data.choices).map(
      ([id, text]) => ({ id, text })
    );

    const buttons: Phaser.GameObjects.GameObject[] = [];
    choiceArray.forEach((choice, index) => {
      const btnW = Math.max(260, Math.min(panelW - 80, 420));
      const y = height / 2 - (panelH / 2) + 120 + index * spacingY;

      const btnBg = this.scene.add.rectangle(
        width / 2,
        y,
        btnW,
        buttonH,
        0xdddddd
      ).setInteractive();

      const btnText = this.scene.add.text(
        width / 2,
        y,
        choice.text as string,
        {
          fontSize: buttonFont,
          color: "#000",
          wordWrap: { width: btnW - 24 }
        }
      ).setOrigin(0.5);

      btnBg.on("pointerdown", () => {
        this.room.send("answer_question", {
          questionId: data.qid,
          answerId: choice.id
        });
      });

      buttons.push(btnBg, btnText);
    });

    this.container = this.scene.add.container(0, 0, [
      bg,
      panel,
      questionText,
      ...buttons
    ]).setDepth(200);

    [bg, panel, questionText, ...buttons].forEach(obj =>
      (obj as any).setScrollFactor(0)
    );
  }

  close() {
    if (!this.container) return;
    this.container.destroy(true);
    this.container = undefined;
  }
}
