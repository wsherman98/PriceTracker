import AWS from "aws-sdk";

const dynamo = new AWS.DynamoDB.DocumentClient();

export async function handler(event) {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No body provided" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    console.error("Invalid JSON body", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const { userId, productUrl, trackStock, message } = payload;

  if (!userId || !productUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required fields: userId or productUrl" }),
    };
  }

  const apigw = new AWS.ApiGatewayManagementApi({
    endpoint: "07aq8oq6zj.execute-api.us-east-1.amazonaws.com/production", // your WebSocket API stage
  });

  // Update price/stock in ProductTracking table
  const updateParams = {
    TableName: process.env.PRODUCT_TRACKING_TABLE,
    Key: { userId, url: productUrl }, // match table keys
    UpdateExpression: "SET trackStock = :s",
    ExpressionAttributeValues: {
      ":s": !!trackStock,
    },
    ReturnValues: "ALL_NEW",
  };

  let updatedItem;
  try {
    const result = await dynamo.update(updateParams).promise();
    updatedItem = result.Attributes;
  } catch (err) {
    console.error("Failed to update ProductTracking table:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to update product" }) };
  }

  // Fetch all WebSocket connections
  let connections;
  try {
    const connResult = await dynamo.scan({ TableName: "WSConnections" }).promise();
    connections = connResult.Items || [];
  } catch (err) {
    console.error("Failed to fetch connections:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to get connections" }) };
  }

  // Prepare notification
  const notification = JSON.stringify({
    type: "notify",
    message: message || `Product ${productUrl} updated!`,
    productUrl,
  });

  // Send notification to all connected clients
  for (const conn of connections) {
    try {
      await apigw.postToConnection({
        ConnectionId: conn.connectionId,
        Data: notification,
      }).promise();
    } catch (e) {
      if (e.statusCode === 410) {
        // Connection gone, remove from table
        await dynamo.delete({ TableName: "WSConnections", Key: { connectionId: conn.connectionId } }).promise();
      } else {
        console.error(`Failed to send message to ${conn.connectionId}:`, e);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ success: true, updatedItem }) };
}
