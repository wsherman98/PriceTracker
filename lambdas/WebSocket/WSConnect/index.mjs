import AWS from "aws-sdk";

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.WS_CONNECTIONS_TABLE || "WSConnections";

export async function handler(event) {
  console.log("Connect event:", JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId;
  const userId = event.queryStringParameters?.userId || "anonymous";

  const item = {
    connectionId,          // Partition key
    userId,                // Sort key + GSI partition key
    connectedAt: new Date().toISOString()
  };

  try {
    await dynamo.put({
      TableName: TABLE_NAME,
      Item: item
    }).promise();

    console.log(`Stored connection ${connectionId} for user ${userId}`);

    return {
      statusCode: 200,
      body: "Connected."
    };
  } catch (err) {
    console.error("Error storing connection:", err);
    return {
      statusCode: 500,
      body: "Failed to connect."
    };
  }
}
