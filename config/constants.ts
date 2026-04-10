export const PATH_PREFIX: string = 'admin';

export const PUBLIC_PATH: string = `/${PATH_PREFIX}/`;

export const CDN_URL: string = process.env.CDN_URL || PUBLIC_PATH;
