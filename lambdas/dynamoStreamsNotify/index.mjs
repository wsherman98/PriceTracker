import AWS from "aws-sdk";
import axios from "axios";

export async function handler(event) {
    for (const record of event.Records) {
        if (record.eventName === "MODIFY") {
            const newImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
            const oldImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage);

            let notify = false;
            let message = "";

            if (newImage.lastPrice !== oldImage.lastPrice && newImage.lastPrice < newImage.priceTarget) {
                notify = true;
                message = `Price dropped for ${newImage.SK}: $${newImage.lastPrice}`;
            }

            if (newImage.lastStockStatus && !oldImage.lastStockStatus) {
                notify = true;
                message = `Back in stock: ${newImage.SK}`;
            }

            if (notify) {
                await axios.post("https://your-websocket-api/notify", { userId: newImage.PK, productUrl: newImage.SK, message });
            }
        }
    }
}
