import AWS from "aws-sdk";
const dynamo = new AWS.DynamoDB.DocumentClient();

export async function handler(event) {
    const userId = event.queryStringParameters.userId;

    const result = await dynamo.query({
        TableName: "TrackedProducts",
        KeyConditionExpression: "PK = :uid",
        ExpressionAttributeValues: { ":uid": userId }
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ items: result.Items }) };
}
