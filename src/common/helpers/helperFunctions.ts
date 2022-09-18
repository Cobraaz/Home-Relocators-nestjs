export const otpExpirationTime = (minutes: number) =>
  new Date(new Date().getTime() + minutes * 60000);
