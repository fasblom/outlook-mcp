/**
 * Reply to email functionality
 */
const config = require('../config');
const { callGraphAPI } = require('../utils/graph-api');
const { ensureAuthenticated } = require('../auth');
const { getFolderIdByName } = require('./folder-utils');

/**
 * Reply to email handler
 * @param {object} args - Tool arguments
 * @returns {object} - MCP response
 */
async function handleReplyEmail(args) {
  const { id, body, comment, draft = true, folderName = config.DEFAULT_DRAFT_FOLDER } = args;

  try {
    // Get access token
    const accessToken = await ensureAuthenticated();

    // Determine action
    const action = draft ? 'createReply' : 'reply';
    const endpoint = `me/messages/${id}/${action}`;

    // Prepare payload
    const payload = {
      comment: body || comment || ''
    };

    // Make API call
    const response = await callGraphAPI(accessToken, 'POST', endpoint, payload);

    // If it's a draft and we want it in a specific folder, move it
    if (draft && response && folderName) {
      const folderId = await getFolderIdByName(accessToken, folderName);
      if (folderId) {
        // Move the newly created draft to the target folder
        await callGraphAPI(accessToken, 'POST', `me/messages/${response.id}/move`, {
          destinationId: folderId
        });
        console.error(`Moved draft reply to folder: ${folderName}`);
      }
    }

    const actionText = draft ? `Draft reply created in ${folderName || 'Drafts'}` : 'Reply sent';
    
    return {
      content: [{
        type: "text",
        text: `${actionText} successfully!${draft && response ? `\n\nDraft ID: ${response.id}` : ''}`
      }]
    };
  } catch (error) {
    if (error.message === 'Authentication required') {
      return {
        content: [{
          type: "text",
          text: "Authentication required. Please use the 'authenticate' tool first."
        }]
      };
    }

    return {
      content: [{
        type: "text",
        text: `Error replying to email: ${error.message}`
      }]
    };
  }
}

module.exports = handleReplyEmail;
