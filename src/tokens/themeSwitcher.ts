import type { CSSResult } from 'lit';

export type ThemeMode = 'light' | 'dark';
export type ContrastLevel = 'normal' | 'medium' | 'high';

type ThemeKey = `${ThemeMode}-${ContrastLevel}`;

const themeLoaders: Record<ThemeKey, () => Promise<CSSResult>> = {
    'light-normal': async () => {
        const m = await import('@/tokens/colors/lightTheme.js');
        return m.lightThemeColors;
    },
    'light-medium': async () => {
        const m = await import('@/tokens/colors/lightThemeMC.js');
        return m.lightThemeColorsMediumContrast;
    },
    'light-high': async () => {
        const m = await import('@/tokens/colors/lightThemeHC.js');
        return m.lightThemeColorsHighContrast;
    },
    'dark-normal': async () => {
        const m = await import('@/tokens/colors/darkTheme.js');
        return m.darkThemeColors;
    },
    'dark-medium': async () => {
        const m = await import('@/tokens/colors/darkThemeMC.js');
        return m.darkThemeColorsMediumContrast;
    },
    'dark-high': async () => {
        const m = await import('@/tokens/colors/darkThemeHC.js');
        return m.darkThemeColorsHighContrast;
    },
};

export async function getTheme(mode: ThemeMode, contrast: ContrastLevel = 'normal'): Promise<CSSResult> {
    const key: ThemeKey = `${mode}-${contrast}`;
    const loader = themeLoaders[key];

    if (!loader) {
        console.warn(`Theme ${key} not found, falling back to light-normal`);
        return themeLoaders['light-normal']();
    }

    return loader();
}

let currentThemeStyle: HTMLStyleElement | null = null;

export async function applyTheme(mode: ThemeMode, contrast: ContrastLevel = 'normal'): Promise<void> {
    const theme = await getTheme(mode, contrast);

    currentThemeStyle?.remove();

    const style = document.createElement('style');
    style.textContent = theme.cssText;
    style.dataset.naberDevTheme = 'true';
    document.head.appendChild(style);
    currentThemeStyle = style;

    document.documentElement.dataset.theme = mode;
    document.documentElement.dataset.contrast = contrast;
}

export async function initTheme(defaultContrast: ContrastLevel = 'normal'): Promise<void> {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const mode: ThemeMode = prefersDark ? 'dark' : 'light';

    const prefersContrast = window.matchMedia('(prefers-contrast: more)').matches;
    const contrast: ContrastLevel = prefersContrast ? 'high' : defaultContrast;

    await applyTheme(mode, contrast);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        applyTheme(e.matches ? 'dark' : 'light', contrast);
    });
}
