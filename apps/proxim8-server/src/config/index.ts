import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config();

interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  solanaRpcUrl: string;
  s3: {
    bucketName: string;
    region: string;
    accessKey: string;
    secretKey: string;
  };
  gcp: {
    projectId: string;
    keyFilePath?: string;
    bucketName: string;
  };
  cors: {
    origin: string;
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  videoStorage: "local" | "gcp" | "s3";
  tempDir: string;
  videoQuality: {
    standard: {
      resolution: string;
      bitrate: string;
    };
    high: {
      resolution: string;
      bitrate: string;
    };
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || "8080"),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/proxim8",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  solanaRpcUrl:
    process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || "proxim8-videos",
    region: process.env.S3_REGION || "us-east-1",
    accessKey: process.env.S3_ACCESS_KEY || "",
    secretKey: process.env.S3_SECRET_KEY || "",
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || "argos-434718",
    keyFilePath: process.env.GCP_KEY_FILE_PATH || undefined,
    bucketName: process.env.GCP_BUCKET_NAME || "proxim8-videos",
  },
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  videoStorage: (process.env.VIDEO_STORAGE as "local" | "gcp" | "s3") || "gcp",
  tempDir: process.env.TEMP_DIR || path.join(__dirname, "../../temp"),
  videoQuality: {
    standard: {
      resolution: "720p",
      bitrate: "2M",
    },
    high: {
      resolution: "1080p",
      bitrate: "5M",
    },
  },
};

export default config;
