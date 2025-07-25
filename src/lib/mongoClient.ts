process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables.");
}

const uri = process.env.MONGODB_URI;
const options = {
  tls: true,
  monitorCommands: true,
  tlsAllowInvalidCertificates: false,
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri!, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri!, options);
  clientPromise = client.connect();
}

export default clientPromise;
