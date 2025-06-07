
import mongoose, { type Mongoose as MongooseInstanceType } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}

interface MongooseCache {
  conn: MongooseInstanceType | null;
  promise: Promise<MongooseInstanceType> | null;
}

// Augment the NodeJS Global type with the mongooseCache property
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache;

if (process.env.NODE_ENV === 'production') {
  cached = { conn: null, promise: null };
} else {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global.mongooseCache) {
    global.mongooseCache = { conn: null, promise: null };
  }
  cached = global.mongooseCache;
}

async function dbConnect(): Promise<MongooseInstanceType> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose's buffering mechanism
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("MongoDB connected successfully.");
      return mongooseInstance;
    }).catch(error => {
      console.error("MongoDB connection error:", error);
      // Important: Reset promise on error so subsequent calls can retry connection
      cached.promise = null; 
      throw error; // Re-throw error to be caught by the caller
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // If the connection promise rejected, ensure it's nullified so a new attempt can be made
    cached.promise = null;
    throw e;
  }
  
  if (!cached.conn) {
    // This case should ideally not be reached if errors are handled properly above,
    // but it's a safeguard.
    throw new Error("MongoDB connection failed and connection object is null.");
  }

  return cached.conn;
}

export default dbConnect;
