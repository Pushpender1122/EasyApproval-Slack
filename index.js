const { App } = require('@slack/bolt');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a new instance of the App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// Slash command handler
app.command('/hello', async ({ ack, body, client }) => {
  // Acknowledge the command request
    await ack();
    try {
      console.log(body.user_id) 
      // console.log(body.user.id) 
    //  const userList=await client.users.list();
    // console.log(userList)
    // Call the chat.postMessage method using the built-in WebClient

    // const result = await client.chat.postMessage({
    //   channel: body.channel_id,
    //   text: `Hello, <@${body.user_id}>!`, //<@${body.user_id}> is used to mention the user who invoked the command
    // });
    // console.log(result);
  } catch (error) {
    console.error(error);
  }
})


const serverStart = async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
}
serverStart();
