declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      NODE_ENV: string;
      DATABASE_URL: string;
      AT_SECRET: string;
      AT_EXPIRES: string;
      RT_SECRET: string;
      RT_EXPIRES: string;
      CRYPTO_KEY: string;
      MAIL_HOST: string;
      MAIL_PORT: string;
      MAIL_USER: string;
      MAIL_PASSWORD: string;
      MAIL_FROM: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
    }
  }
}

export {}
