import AWS from "aws-sdk";

const dynamo = new AWS.DynamoDB.DocumentClient();
const apigw = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.WS_ENDPOINT || "07aq8oq6zj.execute-api.us-east-1.amazonaws.com/production"
});
const PRODUCT_TABLE = process.env.PRODUCT_TRACKING_TABLE || "TrackedProducts";
const WS_TABLE = process.env.WS_CONNECTIONS_TABLE || "WSConnections";

export async function handler(event) {
  if (!event.body) return { statusCode: 400, body: "No body provided" };
  const { userId, productUrl, trackStock = true, lastPrice = null, lastStockStatus = null } = JSON.parse(event.body);
  if (!userId || !productUrl) return { statusCode: 400, body: "Missing required fields" };

  let existing;
  try {
    const res = await dynamo.get({ TableName: PRODUCT_TABLE, Key: { userId, productUrl } }).promise();

