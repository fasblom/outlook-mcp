/**
 * Create draft email functionality
 */
const config = require('../config');
const { callGraphAPI } = require('../utils/graph-api');
const { ensureAuthenticated } = require('../auth');
const { getFolderIdByName } = require('./folder-utils');

/**
 * Create draft email handler
 * @param {object} args - Tool arguments
 * @returns {object} - MCP response
 */
async function handleCreateDraft(args) {
  const { to, cc, bcc, subject, body, importance = 'normal', folderName = config.DEFAULT_DRAFT_FOLDER } = args;
  
  try {
    // Get access token
    const accessToken = await ensureAuthenticated();

    // Determine target folder (defaults to AI-drafts if it exists)
    let endpoint = 'me/messages';
    if (folderName) {
      const folderId = await getFolderIdByName(accessToken, folderName);
      if (folderId) {
        endpoint = `me/mailFolders/${folderId}/messages`;
        console.error(`Creating draft in folder: ${folderName} (${folderId})`);
      }
    }
    
    // Format recipients
    const toRecipients = to ? to.split(',').map(email => {
      email = email.trim();
      return {
        emailAddress: {
          address: email
        }
      };
    }) : [];
    
    const ccRecipients = cc ? cc.split(',').map(email => {
      email = email.trim();
      return {
        emailAddress: {
          address: email
        }
      };
    }) : [];
    
    const bccRecipients = bcc ? bcc.split(',').map(email => {
      email = email.trim();
      return {
        emailAddress: {
          address: email
        }
      };
    }) : [];
    
    // Prepare email object
    const emailObject = {
      subject: subject || '',
      body: {
        contentType: body && body.includes('<html') ? 'html' : 'text',
        content: body || ''
      },
      toRecipients: toRecipients.length > 0 ? toRecipients : undefined,
      ccRecipients: ccRecipients.length > 0 ? ccRecipients : undefined,
      bccRecipients: bccRecipients.length > 0 ? bccRecipients : undefined,
      importance
    };
    
    // Make API call to create draft message
    const response = await callGraphAPI(accessToken, 'POST', endpoint, emailObject);
    
    return {
      content: [{ 
        type: "text", 
        text: `Draft email created successfully in ${folderName || 'Drafts'}!\n\nSubject: ${subject || '(No Subject)'}\nID: ${response.id}`
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
        text: `Error creating draft: ${error.message}`
      }]
    };
  }
}

module.exports = handleCreateDraft;
