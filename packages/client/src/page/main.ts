import Base from "./basePage";

export class Mainpage extends Base{
    constructor() {
        super();
    }

    render(root: HTMLElement, params?: Record<string, string>): void {
        root.innerHTML = `
        <h1>Main Page</h1><p>Welcome to the main page!</p>
        `;
    }
}