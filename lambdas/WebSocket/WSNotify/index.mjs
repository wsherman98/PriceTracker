export async function handler(event) {
  console.log("notifyUpdate route triggered", event);
  return { statusCode: 200 };
}
