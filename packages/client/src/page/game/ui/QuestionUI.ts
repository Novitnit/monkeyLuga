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

    const bg = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.6
    ).setDepth(200);

    const panel = this.scene.add.rectangle(
      width / 2,
      height / 2,
      520,
      360,
      0xffffff,
      1
    ).setStrokeStyle(2, 0x000000).setDepth(201);

    const questionText = this.scene.add.text(
      width / 2,
      height / 2 - 120,
      data.question,
      {
        fontSize: "20px",
        color: "#000",
        wordWrap: { width: 480 }
      }
    ).setOrigin(0.5).setDepth(201);

    const choiceArray = Object.entries(data.choices).map(
      ([id, text]) => ({ id, text })
    );

    const buttons: Phaser.GameObjects.GameObject[] = [];
    choiceArray.forEach((choice, index) => {
      const y = height / 2 - 40 + index * 60;

      const btnBg = this.scene.add.rectangle(
        width / 2,
        y,
        420,
        44,
        0xdddddd
      ).setInteractive().setDepth(201);

      const btnText = this.scene.add.text(
        width / 2,
        y,
        choice.text as string,
        {
          fontSize: "18px",
          color: "#000"
        }
      ).setOrigin(0.5).setDepth(999);

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
