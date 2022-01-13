import { Client } from 'pg';
import * as AWS from 'aws-sdk';
var ssm = new AWS.SSM();

let itst_proxy_host = '';
let itst_proxy_region = '';
let itst_proxy_creds = '';
let itst_proxy_port = '';

var params = {
  Names: [
    'ITST_PROXY_HOST',
    'ITST_PROXY_REGION',
    'ITST_PROXY_CREDS',
    'ITST_PROXY_PORT'
  ],
  WithDecryption: true
};

export async function fetchResult(QryStr: any): Promise<any> {
  return new Promise<any>(async (resolve, reject) => {
    var res = await setParamater();
    const token = await getToken();
    const client = new Client({
      host: itst_proxy_host,
      port: 5432,
      ssl: true,
      user: itst_proxy_creds,
      database: itst_proxy_creds,
      password: token,
    });
    let dbErr = { "status": 400, "errorMessage": "Error in DB connection. " };
    await client.connect();
    try {
      console.log("::::", QryStr);
      const res = await client.query(QryStr)
      await client.end();
      return resolve(res);
    } catch (err) {
      console.log("catch error", err);
      dbErr.errorMessage+= err;
      resolve(dbErr);
      await client.end();
    }
  });
}

export async function insUpdResult(QryStr: any): Promise<any> {
  return new Promise<any>(async (resolve, reject) => {
    var res = await setParamater();
    const token = await getToken();
    const client = new Client({
      host: itst_proxy_host,
      port: 5432,
      ssl: true,
      user: itst_proxy_creds,
      database: itst_proxy_creds,
      password: token,
    });
    let dbErr = { "status": 400, "errorMessage": "Error in DB connection. " };
    await client.connect();
    try {
      console.log("::::", QryStr);
      const res = await client.query(QryStr);
      await client.query('COMMIT');
      await client.end();
      return resolve(res);
    } catch (err) {
      console.log("catch error", err);
      dbErr.errorMessage+= err;
      resolve(dbErr);
      await client.end();
    }
  });
}

const getToken = async () => {
  const signer = new AWS.RDS.Signer({
    region: itst_proxy_region,
    hostname: itst_proxy_host,
    port: 5432,
    username: itst_proxy_creds,
  });
  return new Promise((resolve, reject) => {
    signer.getAuthToken({}, (err, token) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
};

async function setParamater(): Promise<any> {
  return new Promise<any>(async (resolve, reject) => {
    let transactionStatus = false;
    ssm.getParameters(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        return resolve(transactionStatus);
      } else {
        itst_proxy_creds = data.Parameters[0].Value;
        itst_proxy_host  = data.Parameters[1].Value;
        itst_proxy_port = data.Parameters[2].Value;
        itst_proxy_region = data.Parameters[3].Value;
        transactionStatus = true;
        return resolve(transactionStatus);
      }
  });
});
}
