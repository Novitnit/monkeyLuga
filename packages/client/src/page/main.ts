import Base from "./basePage";

export class Mainpage extends Base{
    constructor() {
        super();
    }

    render(params?: Record<string, string>): string {
        return `
        <h1>Main Page</h1><p>Welcome to the main page!</p>
        `;
    }
}