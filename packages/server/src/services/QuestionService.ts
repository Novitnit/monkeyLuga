import fs from "fs";
import path from "path";

export type MathQuestion = {
  id: string;
  question: string;
  answer: Record<string, string>;
  correctAnswerId: string;
};

export class QuestionService {
  private questions: MathQuestion[];

  constructor(questions: MathQuestion[]) {
    this.questions = questions;
  }

  getRandomQuestion(): MathQuestion {
    return this.questions[Math.floor(Math.random() * this.questions.length)];
  }

  validateAnswer(questionId: string, answerId: string): boolean {
    const q = this.questions.find(q => q.id === questionId);
    if (!q) return false;
    return q.correctAnswerId === answerId;
  }
}