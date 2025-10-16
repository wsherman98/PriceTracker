import AWS from "aws-sdk";
import axios from "axios";
const dynamo = new AWS.DynamoDB.DocumentClient();

export async function handler(event) {
    const updates = event.products; // array of { userId, productUrl, currentPrice, inStock }

    for (const u of updates) {
        const { userId, productUrl, currentPrice, inStock } = u;

        const { Item } = await dynamo.get({
            TableName: "ProductTracking",
            Key: { PK: userId, SK: productUrl }
        }).promise();

        if (!Item) continue;

        let notify = false;
        let message = "";

        if (Item.priceTarget && currentPrice < Item.priceTarget && currentPrice !== Item.lastPrice) {
            notify = true;
            message = `Price dropped for ${productUrl}: $${currentPrice}`;
        }

        if (Item.trackStock && inStock && !Item.lastStockStatus) {
            notify = true;
            message = `Back in stock: ${productUrl}`;
        }

        await dynamo.update({
            TableName: "TrackedProducts",
            Key: { PK: userId, SK: productUrl },
            UpdateExpression: "SET lastPrice = :price, lastStockStatus = :stock",
            ExpressionAttributeValues: { ":price": currentPrice, ":stock": inStock }
        }).promise();

        if (notify) {
            await axios.post("https://your-websocket-api/notify", { userId, productUrl, message });
        }
    }

    return { statusCode: 200 };
}
