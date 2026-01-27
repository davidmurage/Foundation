import axios from "axios";
import { publicIpv4 } from "public-ip";
import machineIdPkg from "node-machine-id";

let LICENSE_OK = false;

const {machineIdSync} = machineIdPkg;

async function getServerIp() {
  try {
    return await publicIpv4();
  } catch {
    return null;
  }
}

async function checkLicense() {
  try {
    const { data } = await axios.get(
      "https://kcb-license.onrender.com/license/KCB-PROD"
    );

    if (!data.valid) {
      console.log("LICENSE INVALID");
      process.exit(1);
    }

    const serverIp = await getServerIp();
    const machineId = machineIdSync();

    if (serverIp !== data.boundIp) {
      console.log("SERVER IP NOT AUTHORIZED");
      //console.log("REAL IP:", await getServerIp());
      process.exit(1);
    }
    


    if (machineId !== data.machineId) {
      console.log("MACHINE NOT AUTHORIZED");
      console.log("REAL MACHINE ID:", machineIdSync());
      process.exit(1);
    }

    LICENSE_OK = true;
    console.log("LICENSE OK");
  } catch (err) {
    console.log("LICENSE SERVER UNREACHABLE");
    process.exit(1);
  }
}

// first check on startup
await checkLicense();

// recheck every 10 minutes
setInterval(checkLicense, 10 * 60 * 1000);

// DEFAULT EXPORT (this fixes your error)
export default function licenseCheck(req, res, next) {
  if (!LICENSE_OK) {
    return res.status(403).json({ error: "System disabled" });
  }
  next();
}
