export type AboutScreenshotRegion = 'page' | 'mission' | 'values' | 'contact' | 'headerTitle';
export type AboutAriaRegion = Exclude<AboutScreenshotRegion, 'page'>;
