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

app.command('/approval-test', async ({ ack,body, client }) => {
  // Acknowledge the command request
  await ack();
  try {
    const requesterId = body.user_id; // Get the user ID of the requester
    const view = {
      type: 'modal',
      callback_id: 'approval_request',
      private_metadata: requesterId, // Pass a parameter
      title: { type: 'plain_text', text: 'Approval Request' },
      blocks: [
        { type: 'divider' },
        {
          type: 'input',
          block_id: 'approver_select',
          element: {
            type: 'users_select', // Select a user from the list of users
            placeholder: { type: 'plain_text', text: 'Select Approver' },
            action_id: 'selected_user',
          },
          label: { type: 'plain_text', text: 'Approver' }
        },
        {
          type: 'input',
          block_id: 'approval_text',
          label: { type: 'plain_text', text: 'Approval Text' },
          element: { type: 'plain_text_input', action_id: 'approval_message' }
        },
      ],
      submit: { type: 'plain_text', text: 'Submit' }
    };

   const message= await client.views.open({ trigger_id: body.trigger_id, view });
  //  console.log(message);
  } catch (error) {
    console.error(error);
  }

})
// View submission handler
app.view('approval_request', async ({ ack, body, view, client }) => {
  // Acknowledge the view_submission event and close the modal view 
  //Input values from the  view
  await ack();
  const approverId = view.state.values.approver_select.selected_user.selected_user; // Get the selected approver
  const approvalText = view.state.values.approval_text.approval_message.value; // Get the approval text
  const requesterId = body.user.id; // Get the user ID of the requester 
  const message = `
  *Approval Request*
  From: <@${body.user.id}>
  Message: ${approvalText}
  `;

  const sentMessage = await client.chat.postMessage({ // Send a message to the selected approver
      channel: approverId, 
      text: message,
      blocks: [
          { type: 'section', text: { type: 'mrkdwn', text: message } },
          { type: 'actions', elements: [
              { type: 'button', text: { type: 'plain_text', text: 'Approve'}, style: 'primary', value: requesterId, action_id:'approve' },
              { type: 'button', text: { type: 'plain_text', text: 'Reject' }, style: 'danger', value: requesterId ,action_id:'reject'},
          ]}
      ]
  });
  console.log(sentMessage);
});

// Action handler for Approve/Reject buttons
app.action('approve', async ({ ack, body, client, respond }) => {
  await ack();

  const approverId = body.user.id;
  const requesterId = body.actions[0].value; // Get the user ID of the requester who initiated the approval request

  const message = `
  *Approval Request*
  From: <@${requesterId}>
  Approved by: <@${approverId}>
  Status: :large_green_circle: Approved 
  *MessageSendByYou: ${body.message?.blocks[0]?.text.text.split('\n')[3]?.split(' ')?.pop()}*
  `;
  // Send messages
  await client.chat.postMessage({ channel: requesterId, text: message });
  await respond({ text: 'Approved!' });

  console.log(client.conversations);
});

app.action('reject', async ({ ack, body, client, respond }) => {
  await ack();
  // Open a modal to collect feedback for rejection with feedback form
  const view = {
    type: 'modal',
    callback_id: 'reject_feedback',
    private_metadata: body.actions[0].value,
    title: { type: 'plain_text', text: 'Rejection Feedback' },
    blocks: [
      {
        type: 'input',
        block_id: 'reject_reason',
        label: { type: 'plain_text', text: 'Reason for Rejection ' },
        element: { type: 'plain_text_input', action_id: 'reject_reason_input' }
      }
    ],
    submit: { type: 'plain_text', text: 'Submit'}
  };

  await client.views.open({
    trigger_id: body.trigger_id,
    view: view,
    response_action: "clear"
  });
  await respond({ text: 'Rejected!' });

  //With out feedback of rejection ... 

  // const approverId = body.user.id;
  // const requesterId = body.actions[0].value; // Get the user ID of the requester who initiated the approval request
  // const message = `
  // *Approval Request*
  // From: <@${requesterId}>
  // Rejected by: <@${approverId}>
  // Status: :red_circle: Rejected 
  // *MessageSendByYou: ${body.message?.blocks[0]?.text.text.split('\n')[3]?.split(' ')?.pop()}*
  // `;

  // // Send messages
  // await client.chat.postMessage({ channel: requesterId, text: message });

  // await respond({ text: 'Rejected!' });

  // console.log(client.conversations);

  // const approverId = body.user.id;
  // const requesterId = body.actions[0].value; // Get the user ID of the requester who initiated the approval request
  // const message = `
  // *Approval Request*
  // From: <@${requesterId}>
  // Rejected by: <@${approverId}>
  // Status: :red_circle: Rejected 
  // *MessageSendByYou: ${body.message?.blocks[0]?.text.text.split('\n')[3]?.split(' ')?.pop()}*
  // `;

  // // Send messages
  // await client.chat.postMessage({ channel: requesterId, text: message });

  // await respond({ text: 'Rejected!' });

  // console.log(client.conversations);
});
// View submission handler for rejection feedback
app.view('reject_feedback', async ({ ack, body, view, client }) => {
  await ack();

  const requesterId = view.private_metadata;
  const rejectReason = view.state.values.reject_reason.reject_reason_input.value; // Get the reason for rejection

  const rejectionMessage = `Your request has been rejected by <@${body.user.id}>. :red_circle: Rejected\n${rejectReason ? `Reason: ${rejectReason}` : ''}`;
  await client.chat.postMessage({ channel: requesterId, text: rejectionMessage }); // Send a message to the requester

});

app.action('')
const serverStart = async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
}
serverStart();
