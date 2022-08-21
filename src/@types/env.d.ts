declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      NODE_ENV: string;
      DATABASE_URL: string;
      AT_SECRET: string;
      RT_SECRET: string;
      ACTIVATION_TOKEN_SECRET: string;
      CRYPTO_KEY: string;
    }
  }
}

export {}
