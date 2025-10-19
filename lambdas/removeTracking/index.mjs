import AWS from "aws-sdk";
const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.PRODUCT_TRACKING_TABLE || "TrackedProducts";

export async function handler(event) {
  if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: "No body" }) };
  let payload;
  try { payload = JSON.parse(event.body); } catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { userId, url } = payload;
  if (!userId || !url) return { statusCode: 400, body: JSON.stringify({ error: "Missing userId or url" }) };

  try {
    await dynamo.delete({ TableName: TABLE_NAME, Key: { userId, url } }).promise();
    return { statusCode: 200, body: JSON.stringify({ success: true, message: "Product untracked" }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to untrack product" }) };
  }
}
