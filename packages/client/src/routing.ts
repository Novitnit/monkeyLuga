import Base, { RouteParams } from "./page/basePage";

type RouteEntry = {
    pattern: RegExp;
    keys: string[];
    page: Base;
};

const routes: RouteEntry[] = [];

function registerRoute(path: string, page: Base): void {
    const keys: string[] = [];

    // แปลง /user/:id → /user/([^/]+)
    const pattern = new RegExp(
        "^" +
        path.replace(/:([^/]+)/g, (_, key) => {
            keys.push(key);
            return "([^/]+)";
        }) +
        "$"
    );

    routes.push({ pattern, keys, page });
}

function navigateTo(route: string) {
    window.history.pushState({}, '', route);
    renderRoute(document.getElementById('app')!);
}

function renderRoute(root: HTMLElement): void {
    const path = window.location.pathname;

    for (const route of routes) {
        const match = path.match(route.pattern);

        if (match) {
            const params: RouteParams = {};

            route.keys.forEach((key, i) => {
                params[key] = match[i + 1];
            });

            root.innerHTML = route.page.render(params);
            return;
        }
    }

    root.innerHTML = "<h1>404 - Page Not Found</h1>";
}

window.addEventListener("popstate", () => {
    renderRoute(document.getElementById("app")!);
});

export { registerRoute, navigateTo, renderRoute };