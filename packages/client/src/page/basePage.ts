export type RouteParams = Record<string, string>;

export default abstract class Base {
    constructor() {}

    abstract render(params?: RouteParams): string;
}