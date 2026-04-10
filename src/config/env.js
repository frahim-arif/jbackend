// ===============================
// 📌 Environment Config
// ===============================

import dotenv from 'dotenv';
dotenv.config();

export const env = {
  // BASIC
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),

  // FRONTEND URL
  frontendUrl: process.env.FRONTEND_URL || 'https://jobhir.com',

  // MONGO DB
 mongoUri:
  "mongodb://frahim:frahim123@ac-xa9tri4-shard-00-00.hn7plmp.mongodb.net:27017,ac-xa9tri4-shard-00-01.hn7plmp.mongodb.net:27017,ac-xa9tri4-shard-00-02.hn7plmp.mongodb.net:27017/ok?ssl=true&replicaSet=atlas-y21xpi-shard-0&authSource=admin&retryWrites=true&w=majority",

  // PHONEPE
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  clientVersion: Number(process.env.CLIENT_VERSION || 1),
  phonepeEnv: (process.env.PHONEPE_ENV || 'SANDBOX').toUpperCase(),

  // ⭐ AUTO BASE URL SWITCH (Sandbox / Production)
  phonepeBaseUrl:
    process.env.PHONEPE_BASE_URL ||
    (process.env.PHONEPE_ENV === 'PRODUCTION'
      ? 'https://api.phonepe.com/apis/hermes'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox'),

  webhookSecret: process.env.WEBHOOK_SECRET || '',

  // ⭐ EMAIL SENDER (GMAIL SMTP)
  emailUser: process.env.EMAIL_USER,
  emailPassApp: process.env.EMAIL_PASS_APP, // Gmail App Password
};

// ===============================
// 📌 ENV VALIDATION
// ===============================
export function assertEnv() {
  const missing = [];

  if (!env.clientId) missing.push('CLIENT_ID');
  if (!env.clientSecret) missing.push('CLIENT_SECRET');

  // ⭐ EMAIL CHECKS
  if (!env.emailUser) missing.push('EMAIL_USER');
  if (!env.emailPassApp) missing.push('EMAIL_PASS_APP');

  if (missing.length) {
    throw new Error(`❌ Missing required env variables: ${missing.join(', ')}`);
  }
}




// import dotenv from 'dotenv'

// dotenv.config()

// export const env = {
//   nodeEnv: process.env.NODE_ENV || 'development',
//   port: Number(process.env.PORT || 5000),
//   frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

//   mongoUri:
//     process.env.MONGO_URI ||
//     "mongodb+srv://frahim:frahim%40123@cluster0.a7kmhz8.mongodb.net/ok?retryWrites=true&w=majority",

//   clientId: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
//   clientVersion: Number(process.env.CLIENT_VERSION || 1),

//   // ⭐ LIVE or SANDBOX
//   phonepeEnv: (process.env.PHONEPE_ENV || 'SANDBOX').toUpperCase(),

//   // ⭐ IMPORTANT: BASE URL ADD किया ↓↓↓↓
//   phonepeBaseUrl:
//     process.env.PHONEPE_BASE_URL ||
//     (process.env.PHONEPE_ENV === 'PRODUCTION'
//       ? 'https://api.phonepe.com/apis/hermes'
//       : 'https://api-preprod.phonepe.com/apis/pg-sandbox'),

//   webhookSecret: process.env.WEBHOOK_SECRET || '',
// }

// export function assertEnv() {
//   const missing = []
//   if (!env.clientId) missing.push('CLIENT_ID')
//   if (!env.clientSecret) missing.push('CLIENT_SECRET')
//   if (missing.length) {
//     throw new Error(`Missing required env: ${missing.join(', ')}`)
//   }
// }

// import dotenv from 'dotenv'

// dotenv.config()

// export const env = {
//   nodeEnv: process.env.NODE_ENV || 'development',
//   port: Number(process.env.PORT || 5000),
//   frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
//   mongoUri:
//     process.env.MONGO_URI ||
//     "mongodb+srv://frahim:frahim123@cluster0.hn7plmp.mongodb.net/ok?retryWrites=true&w=majority",

//   clientId: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
//   clientVersion: Number(process.env.CLIENT_VERSION || 1),
//   phonepeEnv: (process.env.PHONEPE_ENV || 'SANDBOX').toUpperCase(),
//   webhookSecret: process.env.WEBHOOK_SECRET || '',
// }

// export function assertEnv() {
//   const missing = []
//   if (!env.clientId) missing.push('CLIENT_ID')
//   if (!env.clientSecret) missing.push('CLIENT_SECRET')
//   if (missing.length) {
//     throw new Error(`Missing required env: ${missing.join(', ')}`)
//   }
// }

