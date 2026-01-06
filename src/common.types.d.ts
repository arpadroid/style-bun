export type BundleThemeArgsType = Record<string, any> & {
    watch?: boolean;
    mode?: 'development' | 'production';
    verbose?: boolean;
};
