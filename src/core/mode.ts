export enum Mode {
  DEV = 'development',
  PROD = 'production'
}
export const mode = !process.env.NODE_ENV || process.env.NODE_ENV === 'development' ? Mode.DEV : Mode.PROD;

export const defaultExt = mode === Mode.DEV ? 'ts' : 'js';
export const defaultFolder = mode === Mode.DEV ? "src" : "dist";