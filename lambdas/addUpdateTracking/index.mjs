import AWS from "aws-sdk";

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.PRODUCT_TRACKING_TABLE || "TrackedProducts";

export async function handler(event) {
  // Ensure userId exists
  const userId = event.queryStringParameters?.userId;
  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required query parameter: userId" }),
    };
  }

  // Query DynamoDB for all products tracked by this user
  let result;
  try {
    result = await dynamo.query({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }).promise();
  } catch (err) {
    console.error("DynamoDB query error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch tracked products" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ items: result.Items || [] }),
  };
}
