export class Navigation {
    constructor(rootElement) {
        this.root = rootElement;
        this.routes = {};
        this.currentView = null;
    }

    register(name, component) {
        this.routes[name] = component;
    }

    navigate(name, params = {}) {
        const component = this.routes[name];
        if (component) {
            this.root.innerHTML = '';
            component.render(this.root, params);
            this.currentView = name;
            console.log(`Navigated to: ${name}`);
        } else {
            console.error(`Route not found: ${name}`);
        }
    }
}
