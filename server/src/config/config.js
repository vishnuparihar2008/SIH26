// Loads and validates environment variables once, so the rest of the app imports a single `config` object instead of reading process.env everywhere.
import dotenv from "dotenv";
dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV !== "test") {
    // Fail fast and loudly rather than letting a missing key surface later
    // as a confusing runtime error deep in a controller.
    console.warn(`[config] Warning: environment variable ${name} is not set.`);
  }
  return value;
}

const config = {
  env: required("NODE_ENV") || "development",
  port: parseInt(required("PORT") || "5000"),
  mongoUri: required("MONGO_URI"),
  jwt: {
    secret: required("JWT_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    expiresIn: required("JWT_EXPIRES_IN") || "1h",
  },
  imagekit: {
    publicKey: required("IMAGEKIT_PUBLIC_KEY"),
    privateKey: required("IMAGEKIT_PRIVATE_KEY"),
    urlEndpoint: required("IMAGEKIT_URL_ENDPOINT"),
  },
};

export default config;
