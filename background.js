chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "sendYoutubeChatMessage") {
        await chrome.scripting.executeScript({
            target: { tabId: sender.tab?.id },
            world: "MAIN",
            func: sendYoutubeChatMessage,
            args: message.args
        })
        return true
    } else if (message.action === "sendTwitchChatMessage") {
        await chrome.scripting.executeScript({
            target: { tabId: sender.tab?.id },
            world: "MAIN",
            func: sendTwitchChatMessage,
            args: message.args
        })
        return true
    }
})

async function sendYoutubeChatMessage(message) {
    const input = document.querySelector('yt-live-chat-text-input-field-renderer')
    const chat = document.querySelector('yt-live-chat-message-input-renderer')
    
    if (!input || !chat) return

    let t = ''

    const __dataHost = input.getInputRange().commonAncestorContainer.__dataHost

    if (__dataHost) {
        const textSegments = __dataHost.liveChatRichMessageInput && __dataHost.liveChatRichMessageInput !== null ? __dataHost.liveChatRichMessageInput.textSegments : []

        const emojiMap = __dataHost.emojiManager.emojiMap

        for (let i = 0; i < textSegments.length; i++) {
            const segment = textSegments[i]
            if (segment.emojiId) {
                t += emojiMap[segment.emojiId]?.shortcuts?.[0] || segment.emojiId
            } else if (segment.text) {
                t += segment.text
            }
        }
    }

    await input.setText(message)
    await chat.sendMessage()
    if (t.length) {
        input.setText(t)
    }
}

function sendTwitchChatMessage(message) {
    function getReactInstance(element) {
        for (const key in element) {
            if (key.startsWith('__reactInternalInstance$') || key.startsWith('__reactFiber$')) {
                return element[key]
            }
        }

        return null
    }

    function searchReactParents(node, predicate, maxDepth = 15, depth = 0) {
        try {
            if (predicate(node)) {
                return node
            }
        } catch (_) { }

        if (!node || depth > maxDepth) {
            return null
        }

        const { return: parent } = node;
        if (parent) {
            return searchReactParents(parent, predicate, maxDepth, depth + 1)
        }

        return null
    }

    function getCurrentTwitchChat() {
        let currentChat

        try {
            const node = searchReactParents(
                getReactInstance(document.querySelector('section[data-test-selector="chat-room-component-layout"]')),
                (n) => n.stateNode && n.stateNode.props && n.stateNode.props.onSendMessage
            )
            currentChat = node.stateNode
        } catch (_) { }

        return currentChat
    }
    const currentChat = getCurrentTwitchChat()
    if (!currentChat) return
    currentChat.props.onSendMessage(message)
}