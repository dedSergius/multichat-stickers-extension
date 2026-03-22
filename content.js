const icon = `<svg data-v-cae7544b="" fill="none" stroke-width="0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="24" width="24">
                <path d="M24 44C35.0457 44 44 35.0457 44 24C44 24 33.5 27 27 20C20.5 13 24 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M44 24L24 4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>`
const url = window.location.href
let stickers = []

function injectStickerContainer() {
    if (document.getElementById('misaka-sticker-container')) {
        return
    }
    const emojiPicker = url.includes('youtube.com') ? document.querySelector('#emoji-picker-button') : document.querySelector('[data-a-target="emote-picker-button"]')
    if (!emojiPicker) {
        setTimeout(injectStickerContainer, 800)
        return
    }
    const stickerContainer = document.createElement('div')
    stickerContainer.id = 'misaka-sticker-container'

    if (url.includes('youtube.com')) {
        emojiPicker.parentElement.insertBefore(stickerContainer, emojiPicker)
    } else if (url.includes('twitch.tv')) {
        emojiPicker.parentElement.parentElement.parentElement.insertBefore(stickerContainer, emojiPicker.parentElement.parentElement)
        emojiPicker.parentElement.parentElement.parentElement.style.display = 'flex'
    }
    injectStickerButton(stickerContainer)
    injectStickerPicker(stickerContainer)
}

function injectStickerButton(container) {
    const stickerBtn = document.createElement('button')
    stickerBtn.id = 'misaka-sticker-btn'
    stickerBtn.innerHTML = icon
    stickerBtn.title = 'Стикеры мультичата'
    stickerBtn.style.cssText = `
        stroke: ${window.location.href.includes('youtube.com') ? 'var(--yt-live-chat-primary-text-color)' : 'var(--color-fill-button-icon)'};
    `

    container.appendChild(stickerBtn)
}

async function injectStickerPicker(container) {
    const pickerContainer = document.createElement('div')
    pickerContainer.id = 'misaka-sticker-picker'

    const response = await fetch('https://misakamibot.ru/api/multichat/stickers')
    stickers = await response.json()

    if (stickers.length == 0) {
        pickerContainer.innerHTML = '<div style="text-align:center; padding:40px 0;">Пусто</div>'
    } else {
        let html = `${await checkUpdate() ? '<div style="text-align:center; padding:40px 0;"><a href="https://misakamibot.ru/multichat/files/multichat-stickers-extension.crx" target="_blank">Обновите расширение</a></div><br/>' : ''}<div class="misaka-stiker-list">`
        for (let i = 0; i < stickers.length; i++) {
            const sticker = stickers[i]
            const url = 'https://misakamibot.ru/multichat/stickers/assets/' + sticker.id + '.' + sticker.metadata.ext
            if (sticker.metadata.ext == 'webm') {
                html += `<div class="misaka-sticker-sticker" data-tag="${sticker.metadata.tag}"><video autoplay loop playsinline muted><source src="${url}" type="video/webm" /></video><p>${sticker.metadata.tag}</p></div>`
            } else if (sticker.metadata.ext == 'tgs') {
                html += `<div class="misaka-sticker-sticker" data-tag="${sticker.metadata.tag}"><iframe src="https://misakamibot.ru/multichat/sticker-embed.html?id=${sticker.id}&ext=tgs"></iframe><p>${sticker.metadata.tag}</p></div>`
            } else {
                html += `<div class="misaka-sticker-sticker" data-tag="${sticker.metadata.tag}"><img src="${url}" alt="${sticker.metadata.tag}"><p>${sticker.metadata.tag}</p></div>`
            }
        }
        pickerContainer.innerHTML += html + '</div>'
    }

    container.appendChild(pickerContainer)

    document.getElementById('misaka-sticker-btn').addEventListener('click', () => {
        const isVisible = pickerContainer.style.display !== 'none'
        pickerContainer.style.display = isVisible ? 'none' : 'block'
    })

    pickerContainer.addEventListener('click', (e) => {
        const sticker = e.target.closest('.misaka-sticker-sticker')
        if (!sticker) {
            return
        }
        sendMessage('stk ' + sticker.dataset.tag)
        const isVisible = pickerContainer.style.display !== 'none'
        pickerContainer.style.display = isVisible ? 'none' : 'block'
    })
}

function sendMessage(message) {
    if (url.includes('youtube.com')) {
        chrome.runtime.sendMessage({
            action: "sendYoutubeChatMessage",
            args: [message]
        })
    } else if (url.includes('twitch.tv')) {
        chrome.runtime.sendMessage({
            action: "sendTwitchChatMessage",
            args: [message]
        })
    }
}

function renderStickerInMessages(messages) {
    messages.forEach(function (message) {
        const text = url.includes('twitch.tv') ? message.innerHTML : message.innerHTML.replace(/<[^>]*\balt\s*=\s*["']([^"']*)["'][^>]*>|<[^>]+>/g, (match, altValue) => altValue || '').replace(/(:.*:)/g, '').trim()
        if (/^stk/i.test(text)) {
            const tag = text.replace(/^stk\s*/i, '').trim()
            const sticker = stickers.find(s => s.metadata.tag == tag)
            if (!sticker) {
                return
            }
            const url = 'https://misakamibot.ru/multichat/stickers/assets/' + sticker.id + '.' + sticker.metadata.ext
            let html = ''
            if (sticker.metadata.ext == 'webm') {
                html += `<div class="misaka-sticker-sticker" data-tag="${sticker.metadata.tag}"><video autoplay loop playsinline muted><source src="${url}" type="video/webm" /></video></div>`
            } else if (sticker.metadata.ext == 'tgs') {
                html += `<div class="misaka-sticker-sticker" data-tag="${sticker.metadata.tag}"><iframe src="https://misakamibot.ru/multichat/sticker-embed.html?id=${sticker.id}&ext=tgs"></iframe></div>`
            } else {
                html += `<div class="misaka-sticker-sticker" data-tag="${sticker.metadata.tag}"><img src="${url}" alt="${sticker.metadata.tag}"></div>`
            }
            message.innerHTML = html
        }
    })
}

async function checkUpdate() {
    try {
        const currentVersion = chrome.runtime.getVersion()
        const response = await fetch('https://raw.githubusercontent.com/dedSergius/multichat-stickers-extension/refs/heads/main/manifest.json')
        if (!response.ok || response.status !== 200) {
            return null
        }
        const latestVersion = (await response.json()).version
        if (!latestVersion) {
            return null
        }

        const cSeparated = currentVersion.split('.')
        const lSeparated = latestVersion.split('.')
        for (let i = 0; i < lSeparated.length; i++) {
            if (!cSeparated[i]) {
                return true
            }
            if (cSeparated[i] && Number.parseInt(cSeparated[i]) < Number.parseInt(lSeparated[i])) {
                return true
            }
        }
        return false
    } catch (error) {
        console.error(error)
        return null
    }
}

const observer = new MutationObserver(() => {
    if ((document.querySelector('#emoji-picker-button') || document.querySelector('[data-a-target="emote-picker-button"]')) && !document.getElementById('misaka-sticker-container')) {
        injectStickerContainer()
    }
    setTimeout(() => {
        let messages
        if (url.includes('youtube.com')) {
            messages = document.querySelectorAll('#message.yt-live-chat-text-message-renderer')
        } else if (url.includes('twitch.tv')) {
            messages = document.querySelectorAll('.text-fragment[data-a-target="chat-message-text"]')
        }
        renderStickerInMessages(messages)
    }, 800)
})

observer.observe(document.body, { childList: true, subtree: true })

injectStickerContainer()