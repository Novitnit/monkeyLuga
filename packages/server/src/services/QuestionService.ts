import fs from "fs";
import path from "path";

export type MathQuestion = {
  id: string;
  question: string;
  answer: Record<string, string>;
  correctAnswerId: string;
};

export class QuestionService {
  private questions: MathQuestion[] = [];

  constructor(jsonPath: string) {
    this.questions = this.loadQuestions(jsonPath);
  }

  getRandomQuestion(): MathQuestion {
    return this.questions[Math.floor(Math.random() * this.questions.length)];
  }

  validateAnswer(questionId: string, answerId: string): boolean {
    const q = this.questions.find((q) => q.id === questionId);
    if (!q) return false;
    if (!q.answer[answerId]) return false;
    return q.correctAnswerId === answerId;
  }

  private loadQuestions(jsonPath: string): MathQuestion[] {
    try {
      const filePath = path.resolve(process.cwd(), jsonPath);
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw) as MathQuestion[];
      if (!Array.isArray(data)) return [];
      return data.filter(
        (q) => q && q.id && q.question && q.answer && q.correctAnswerId
      );
    } catch (e) {
      console.error("Failed to load questions:", e);
      return [];
    }
  }
}