import axios from "axios";
import crypto from "crypto";

const SECRET = process.env.LICENSE_SECRET;
let LICENSE_OK = false;

function verify(payload, signature) {
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  return expected === signature;
}

async function checkLicense() {
  try {
    const { data } = await axios.get(
      "https://kcb-license.onrender.com/license/KCB-PROD"
    );

    if (!verify(data.payload, data.signature)) {
      console.log("INVALID LICENSE SIGNATURE");
      process.exit(1);
    }

    if (new Date() > new Date(data.payload.expires)) {
      console.log("LICENSE EXPIRED");
      process.exit(1);
    }

    LICENSE_OK = true;
    console.log("LICENSE OK");
  } catch {
    console.log("LICENSE SERVER UNREACHABLE");
    process.exit(1);
  }
}

// startup check
await checkLicense();

// heartbeat every 2 minutes
setInterval(checkLicense, 2 * 60 * 1000);

export default function licenseCheck(req, res, next) {
  if (!LICENSE_OK) {
    return res.status(403).json({ error: "System disabled" });
  }
  next();
}
