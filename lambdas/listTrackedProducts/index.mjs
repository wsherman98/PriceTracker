import AWS from "aws-sdk";
const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.PRODUCT_TRACKING_TABLE || "TrackedProducts";

export async function handler(event) {
  const userId = event.queryStringParameters?.userId;
  if (!userId) return { statusCode: 400, body: JSON.stringify({ error: "Missing userId" }) };

  try {
    const { Items } = await dynamo.query({ TableName: TABLE_NAME, KeyConditionExpression: "userId = :uid", ExpressionAttributeValues: { ":uid": userId } }).promise();
    return { statusCode: 200, body: JSON.stringify({ items: Items }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to list products" }) };
  }
}
