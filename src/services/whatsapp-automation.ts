/* ============================================================
   LeadScaper Pro — WhatsApp DOM Automation Service
   ============================================================ */

/**
 * Automates sending a WhatsApp message via DOM manipulation.
 * Highly experimental and carries ban risks.
 */
export async function executeAutoSend(tabId: number, message: string, attachments: string[] = [], osType: 'mac' | 'windows' = 'mac'): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId },
      func: injectedAutoSender,
      args: [message, attachments, osType]
    }, (results) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      
      const result = results?.[0]?.result;
      if (result && result.success) {
        resolve();
      } else {
        reject(new Error(result?.error || 'Unknown automation error'));
      }
    });
  });
}

/**
 * This function runs INSIDE the WhatsApp Web context.
 * It cannot access outer variables directly.
 */
async function injectedAutoSender(message: string, attachments: string[], osType: 'mac' | 'windows'): Promise<{success?: boolean, error?: string}> {
  try {
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    const randomDelay = (min: number, max: number) => delay(Math.floor(Math.random() * (max - min + 1) + min));

    // 1. Wait for Chat Input to appear
    const findChatInput = () => {
      // WhatsApp often changes selectors. 'div[contenteditable="true"][data-tab="10"]' is common.
      const editors = document.querySelectorAll('div[contenteditable="true"]');
      for (let i = 0; i < editors.length; i++) {
        const el = editors[i] as HTMLElement;
        // Usually the main chat input has a higher data-tab or specific parent.
        // We'll just grab the one that is visible and inside the footer.
        if (el.closest('footer')) return el;
      }
      // Fallback
      return document.querySelector('div[contenteditable="true"][title="Type a message"]') as HTMLElement;
    };

    let chatInput = null;
    let attempts = 0;
    while (!chatInput && attempts < 30) {
      chatInput = findChatInput();
      if (!chatInput) {
        await delay(1000);
        attempts++;
      }
    }

    if (!chatInput) throw new Error("Could not find chat input box. Is the chat loaded?");

    // Focus the input
    chatInput.focus();
    await randomDelay(500, 1000);

    // 2. Simulate Human Typing
    // Type character by character. This avoids the chunking/word-deletion bug 
    // caused by React's asynchronous state updates when typing entire words at once.
    const chars = message.split('');
    for (const char of chars) {
      if (char === '\n') {
        if (osType === 'mac') {
          // On Mac, insertLineBreak can glitch in Safari/Chrome inside WhatsApp. 
          // Pasting the newline is safest.
          const dt = new DataTransfer();
          dt.setData('text/plain', '\n');
          chatInput.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }));
        } else {
          document.execCommand('insertLineBreak');
        }
      } else {
        document.execCommand('insertText', false, char);
      }
      
      // Dispatch an input event just to be safe and ensure React registers the character
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Fast, realistic human typing speed per character
      await randomDelay(15, 60); 
    }
    
    await randomDelay(800, 1500);

    let isImageAttached = false;

    // 3. Handle Image/Video Attachments (Paste)
    if (attachments && attachments.length > 0) {
      try {
        const dataTransfer = new DataTransfer();
        
        for (let i = 0; i < attachments.length; i++) {
          const att = attachments[i];
          const response = await fetch(att);
          const blob = await response.blob();
          const ext = blob.type.split('/')[1] || 'png';
          const file = new File([blob], `attachment_${i}.${ext}`, { type: blob.type });
          dataTransfer.items.add(file);
        }
        
        const pasteEvent = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dataTransfer });
        chatInput.dispatchEvent(pasteEvent);
        
        await delay(2000);
        isImageAttached = true;
      } catch (err) {
        console.error("Failed to attach files via DOM paste:", err);
      }
    }

    // 4. Send Message
    if (isImageAttached) {
      // User request: Completely disable the first send button if there is an image.
      // The text is automatically copied to the image caption by WhatsApp.
      // We just need to hit Enter in the active modal to send both together.
      await delay(500);
      const activeEl = document.activeElement || document.body;
      activeEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter' }));
      activeEl.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter' }));
      
      await delay(2000);
      return { success: true };
    }

    // For Text-Only messages: find the standard text send button
    const findSendButton = () => {
      const elements = Array.from(document.querySelectorAll(
        'button[aria-label="Send"], div[aria-label="Send"][role="button"], span[data-icon="send"], span[data-testid="send"]'
      ));

      if (elements.length === 0) return null;

      // For text-only, the active chat's send button is usually the last one in the DOM
      const el = elements[elements.length - 1];
      if (el.tagName.toLowerCase() === 'span') {
        return el.closest('div[role="button"]') || el.closest('button') || el;
      }
      return el;
    };

    let sendButton = null;
    let sendAttempts = 0;
    while (!sendButton && sendAttempts < 15) {
      sendButton = findSendButton();
      if (!sendButton) {
        // Fallback: hit enter in chat input
        chatInput.dispatchEvent(new KeyboardEvent('keydown', {
          bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter'
        }));
        await delay(500);
        sendAttempts++;
      }
    }

    if (sendButton) {
      await randomDelay(300, 800);
      const btn = sendButton as HTMLElement;
      btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      btn.click();
      
      await delay(2000);
      return { success: true };
    } else {
      throw new Error("Send button not found after typing text.");
    }

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
