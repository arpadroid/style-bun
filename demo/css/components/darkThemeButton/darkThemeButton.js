import ButtonComponent from '../button/button.js';
class DarkThemeButton extends ButtonComponent {
    static get observedAttributes() {
        return ['current-theme'];
    }

    constructor() {
        super();
        this.currentTheme = this.getCurrentTheme();
        this.setAttribute('current-theme', this.currentTheme);
        this.setTheme(this.currentTheme);
    }

    getCurrentTheme() {
        return localStorage.getItem('current-theme') || 'light';
    }

    render() {
        super.render();
        this.button.classList.add('dark-theme-button');
    }

    isLightTheme() {
        return this.getAttribute('current-theme') === 'light';
    }

    attributeChangedCallback() {
        this.update();
    }

    update() {
        const isLight = this.isLightTheme();
        this.iconNode.textContent = isLight ? '🌙' : '☀️';
        this.buttonText.textContent = isLight ? 'Dark theme' : 'Light theme';
    }

    onClick() {
        this.setTheme(this.isLightTheme() ? 'dark' : 'light');
    }

    setTheme(theme) {
        this.setAttribute('current-theme', theme);
        const stylesheet = document.getElementById('dark-theme');
        stylesheet.disabled = this.isLightTheme();
        localStorage.setItem('current-theme', this.getAttribute('current-theme'));
    }
}

customElements.define('dark-theme-button', DarkThemeButton);

export default DarkThemeButton;
