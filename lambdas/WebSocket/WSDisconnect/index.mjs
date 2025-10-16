import AWS from "aws-sdk";

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.WS_CONNECTIONS_TABLE || "WSConnections";

export async function handler(event) {
  console.log("Disconnect event:", JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId;

  try {
    // If you have the userId available in the event (recommended), include it
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      console.warn(
        `Missing userId for disconnect of connection ${connectionId}. Attempting delete with PK only.`
      );
      // If you really don't have the userId, deletion may fail with composite key table
      return {
        statusCode: 400,
        body: "Cannot disconnect: userId missing for composite key table."
      };
    }

    await dynamo
      .delete({
        TableName: TABLE_NAME,
        Key: { connectionId, userId }
      })
      .promise();

    console.log(`Deleted connection ${connectionId} for user ${userId}`);
    return { statusCode: 200, body: "Disconnected." };
  } catch (err) {
    console.error("Error deleting connection:", err);
    return { statusCode: 500, body: "Failed to disconnect." };
  }
}
