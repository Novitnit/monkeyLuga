import { navigateTo } from "../routing";
import Base from "./basePage";

export class Mainpage extends Base{
    constructor() {
        super();
    }

    render(root: HTMLElement, params?: Record<string, string>): void {
        root.innerHTML = `
        <h1>Main Page</h1><p>Welcome to the main page!</p>
        <button id="go-game">Go to Game</button>
        `;

        const goGameBtn = document.getElementById("go-game");
        goGameBtn?.addEventListener("click", () => {
            navigateTo("/game");
        });
    }
}