export const FILE_SCHEME = "starlight-file";

export const fileUrl = (token: string) => `${FILE_SCHEME}://local/${token}`;
