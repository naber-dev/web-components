import type { CSSResult } from 'lit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, getTheme, initTheme } from './themeSwitcher';

// Mock the theme modules
vi.mock('@/tokens/colors/lightTheme.js', () => ({
    lightThemeColors: { cssText: ':root { --color: light; }' } as CSSResult,
}));

vi.mock('@/tokens/colors/lightThemeMC.js', () => ({
    lightThemeColorsMediumContrast: {
        cssText: ':root { --color: light-medium; }',
    } as CSSResult,
}));

vi.mock('@/tokens/colors/lightThemeHC.js', () => ({
    lightThemeColorsHighContrast: { cssText: ':root { --color: light-high; }' } as CSSResult,
}));

vi.mock('@/tokens/colors/darkTheme.js', () => ({
    darkThemeColors: { cssText: ':root { --color: dark; }' } as CSSResult,
}));

vi.mock('@/tokens/colors/darkThemeMC.js', () => ({
    darkThemeColorsMediumContrast: {
        cssText: ':root { --color: dark-medium; }',
    } as CSSResult,
}));

vi.mock('@/tokens/colors/darkThemeHC.js', () => ({
    darkThemeColorsHighContrast: { cssText: ':root { --color: dark-high; }' } as CSSResult,
}));

describe('themeSwitcher', () => {
    beforeEach(() => {
        // Clear DOM before each test
        document.head.innerHTML = '';
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.removeAttribute('data-contrast');
        vi.clearAllMocks();
    });

    describe('getTheme', () => {
        it('should load light theme with normal contrast by default', async () => {
            const theme = await getTheme('light');
            expect(theme.cssText).toBe(':root { --color: light; }');
        });

        it('should load light theme with medium contrast', async () => {
            const theme = await getTheme('light', 'medium');
            expect(theme.cssText).toBe(':root { --color: light-medium; }');
        });

        it('should load light theme with high contrast', async () => {
            const theme = await getTheme('light', 'high');
            expect(theme.cssText).toBe(':root { --color: light-high; }');
        });

        it('should load dark theme with normal contrast by default', async () => {
            const theme = await getTheme('dark');
            expect(theme.cssText).toBe(':root { --color: dark; }');
        });

        it('should load dark theme with medium contrast', async () => {
            const theme = await getTheme('dark', 'medium');
            expect(theme.cssText).toBe(':root { --color: dark-medium; }');
        });

        it('should load dark theme with high contrast', async () => {
            const theme = await getTheme('dark', 'high');
            expect(theme.cssText).toBe(':root { --color: dark-high; }');
        });

        it('should fall back to light-normal for invalid theme', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
            const theme = await getTheme('invalid' as any, 'invalid' as any);

            expect(consoleSpy).toHaveBeenCalledWith('Theme invalid-invalid not found, falling back to light-normal');
            expect(theme.cssText).toBe(':root { --color: light; }');

            consoleSpy.mockRestore();
        });
    });

    describe('applyTheme', () => {
        it('should apply theme to document head', async () => {
            await applyTheme('light', 'normal');

            const styleElement = document.head.querySelector('style[data-naber-dev-theme]');
            expect(styleElement).not.toBeNull();
            expect(styleElement?.textContent).toBe(':root { --color: light; }');
        });

        it('should set data attributes on document element', async () => {
            await applyTheme('dark', 'high');

            expect(document.documentElement.dataset.theme).toBe('dark');
            expect(document.documentElement.dataset.contrast).toBe('high');
        });

        it('should remove previous theme style before applying new one', async () => {
            await applyTheme('light', 'normal');
            const firstStyle = document.head.querySelector('style[data-naber-dev-theme]');

            await applyTheme('dark', 'medium');
            const allStyles = document.head.querySelectorAll('style[data-naber-dev-theme]');

            expect(allStyles.length).toBe(1);
            expect(firstStyle?.isConnected).toBe(false);
            expect(document.head.querySelector('style[data-naber-dev-theme]')?.textContent).toBe(
                ':root { --color: dark-medium; }'
            );
        });

        it('should update data attributes when switching themes', async () => {
            await applyTheme('light', 'normal');
            expect(document.documentElement.dataset.theme).toBe('light');
            expect(document.documentElement.dataset.contrast).toBe('normal');

            await applyTheme('dark', 'high');
            expect(document.documentElement.dataset.theme).toBe('dark');
            expect(document.documentElement.dataset.contrast).toBe('high');
        });
    });

    describe('initTheme', () => {
        let matchMediaMock: MediaQueryList;

        beforeEach(() => {
            matchMediaMock = {
                matches: false,
                media: '',
                onchange: null,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
                dispatchEvent: vi.fn(),
            } as MediaQueryList;
            vi.stubGlobal(
                'matchMedia',
                vi.fn(() => matchMediaMock)
            );
        });

        it('should initialize with light theme when prefers-color-scheme is light', async () => {
            vi.mocked(window.matchMedia).mockImplementation((query: string) => {
                if (query === '(prefers-color-scheme: dark)') {
                    return { ...matchMediaMock, matches: false };
                }
                if (query === '(prefers-contrast: more)') {
                    return { ...matchMediaMock, matches: false };
                }
                return matchMediaMock;
            });

            await initTheme();

            expect(document.documentElement.dataset.theme).toBe('light');
            expect(document.documentElement.dataset.contrast).toBe('normal');
        });

        it('should initialize with dark theme when prefers-color-scheme is dark', async () => {
            vi.mocked(window.matchMedia).mockImplementation((query: string) => {
                if (query === '(prefers-color-scheme: dark)') {
                    return { ...matchMediaMock, matches: true };
                }
                if (query === '(prefers-contrast: more)') {
                    return { ...matchMediaMock, matches: false };
                }
                return matchMediaMock;
            });

            await initTheme();

            expect(document.documentElement.dataset.theme).toBe('dark');
            expect(document.documentElement.dataset.contrast).toBe('normal');
        });

        it('should initialize with high contrast when prefers-contrast is more', async () => {
            vi.mocked(window.matchMedia).mockImplementation((query: string) => {
                if (query === '(prefers-color-scheme: dark)') {
                    return { ...matchMediaMock, matches: false };
                }
                if (query === '(prefers-contrast: more)') {
                    return { ...matchMediaMock, matches: true };
                }
                return matchMediaMock;
            });

            await initTheme();

            expect(document.documentElement.dataset.theme).toBe('light');
            expect(document.documentElement.dataset.contrast).toBe('high');
        });

        it('should use default contrast level when provided', async () => {
            vi.mocked(window.matchMedia).mockImplementation((query: string) => {
                if (query === '(prefers-color-scheme: dark)') {
                    return { ...matchMediaMock, matches: false };
                }
                if (query === '(prefers-contrast: more)') {
                    return { ...matchMediaMock, matches: false };
                }
                return matchMediaMock;
            });

            await initTheme('medium');

            expect(document.documentElement.dataset.theme).toBe('light');
            expect(document.documentElement.dataset.contrast).toBe('medium');
        });

        it('should add event listener for prefers-color-scheme changes', async () => {
            const addEventListenerSpy = vi.fn();

            vi.mocked(window.matchMedia).mockImplementation((query: string) => {
                if (query === '(prefers-color-scheme: dark)') {
                    return { ...matchMediaMock, matches: false, addEventListener: addEventListenerSpy };
                }
                if (query === '(prefers-contrast: more)') {
                    return { ...matchMediaMock, matches: false };
                }
                return matchMediaMock;
            });

            await initTheme();

            expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
        });

        it('should switch theme when prefers-color-scheme changes', async () => {
            let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

            vi.mocked(window.matchMedia).mockImplementation((query: string): MediaQueryList => {
                if (query === '(prefers-color-scheme: dark)') {
                    return {
                        ...matchMediaMock,
                        matches: false,
                        addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
                            changeHandler = handler;
                        }),
                    } as MediaQueryList;
                }
                if (query === '(prefers-contrast: more)') {
                    return { ...matchMediaMock, matches: false };
                }
                return matchMediaMock;
            });

            await initTheme();
            expect(document.documentElement.dataset.theme).toBe('light');

            // Simulate prefers-color-scheme change to dark
            if (changeHandler) {
                const mockEvent = { matches: true } as MediaQueryListEvent;
                const applyPromise = new Promise<void>((resolve) => {
                    setTimeout(() => {
                        changeHandler?.(mockEvent);
                        resolve();
                    }, 0);
                });
                await applyPromise;
                // Wait a tick for the async applyTheme to complete
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(document.documentElement.dataset.theme).toBe('dark');
            }
        });
    });
});
