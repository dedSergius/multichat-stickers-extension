const icon = `<svg data-v-cae7544b="" fill="none" stroke-width="0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="24" width="24">
                <path d="M24 44C35.0457 44 44 35.0457 44 24C44 24 33.5 27 27 20C20.5 13 24 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M44 24L24 4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>`
let url = window.location.href
const ytChannelId = 'UCvEyhzCQS-hlRFVR7mTTCMQ'
const twChannelId = 'glyabokopor'
let stickers = []
let observer
let stickerListUpdateTimer

if (window.parent === window) {
    window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return
        if (event.data?.type === 'GET_URL') {
            event.source.postMessage({ type: 'RESP_URL', url }, event.origin)
        }
    })
}

async function checkChannel() {
    let checkUrl = url

    if (window.parent !== window) {
        checkUrl = await new Promise((resolve) => {
            window.parent.postMessage({ type: 'GET_URL' }, window.location.origin)

            window.addEventListener('message', function handler(event) {
                if (event.origin !== window.location.origin) return
                if (event.data?.type === 'RESP_URL') {
                    window.removeEventListener('message', handler)
                    resolve(event.data.url)
                }
            })
            setTimeout(() => resolve(undefined), 2000)
        })
    }

    if (!checkUrl) {
        return false
    }

    try {
        checkUrl = new URL(checkUrl)
    } catch (e) {
        return false
    }

    if (checkUrl.host.includes('youtube.com')) {
        let fetchUrl = checkUrl.href
        if (checkUrl.pathname == '/live_chat') {
            const params = new URLSearchParams(checkUrl.search)
            if (!params || !params.has('v')) {
                return false
            }
            fetchUrl = `https://www.youtube.com/watch?v=${params.get('v')}`
        }
        try {
            const response = await fetch(fetchUrl)
            const document = await response.text()
            return document.match(/"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/)?.[1] == ytChannelId
        } catch (error) {
            return false
        }
    }

    if (checkUrl.host.includes('twitch.tv')) {
        const twitchMatch = checkUrl.href.match(/twitch\.tv\/(?:popout\/)?([a-zA-Z0-9_]{4,25})/)
        return twitchMatch?.[1]?.toLowerCase() === twChannelId.toLowerCase()
    }

    return false
}

function injectEmojiFont() {
    const fontUrl = chrome.runtime.getURL('fonts/NotoColorEmoji.ttf')

    const style = document.createElement('style')
        style.textContent = `
            @font-face {
                font-family: 'Noto Color Emoji';
                src: url('${fontUrl}') format('truetype');
                font-weight: 400;
                font-style: normal;
            }
        `

    document.head.appendChild(style)
}

async function injectStickerContainer() {
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
        emojiPicker.closest('#input-container').insertBefore(stickerContainer, emojiPicker)
    } else if (url.includes('twitch.tv')) {
        emojiPicker.parentElement.parentElement.parentElement.insertBefore(stickerContainer, emojiPicker.parentElement.parentElement)
        emojiPicker.parentElement.parentElement.parentElement.style.display = 'flex'
    }
    injectStickerButton(stickerContainer)
    await injectStickerPicker(stickerContainer)
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

    stickerBtn.addEventListener('click', () => {
        const pickerContainer = container.querySelector('#misaka-sticker-picker')
        if (!pickerContainer) {
            return
        }
        const isVisible = pickerContainer.style.display && pickerContainer.style.display !== 'none'
        pickerContainer.style.display = isVisible ? 'none' : 'block'
    })
}

async function injectStickerPicker(container) {
    const pickerContainer = document.createElement('div')
    pickerContainer.id = 'misaka-sticker-picker'

    if (url.includes('youtube.com')) {
        pickerContainer.classList.add('yt')
    } else if (url.includes('twitch.tv')) {
        pickerContainer.classList.add('tw')
    }

    let hasUpdate = false

    try {
        hasUpdate = await chrome.runtime.sendMessage({ action: 'checkUpdate' })
    } catch (error) {
        console.error('Unable to check for updates', error)
    }

    let activeTab = (await chrome.storage.local.get('activeTab')).activeTab || 1

    const currentSort = (await chrome.storage.local.get('sort')).sort || 'asc'

    pickerContainer.innerHTML = `<div class="misaka-sticker-picker-tabs">
        <div class="misaka-sticker-picker-tab-header">
            ${hasUpdate ? '<div id="misaka-extension-update">Доступна новая версия</div><br/>' : ''}
            <div class="misaka-picker-tab-controls">
                <button class="misaka-sticker-picker-tab-btn ${activeTab == 1 ? 'active' : ''}" data-tab="1">🤪</button>
                <button class="misaka-sticker-picker-tab-btn ${activeTab == 2 ? 'active' : ''}" data-tab="2">🕑</button>
                <button class="misaka-sticker-picker-tab-btn ${activeTab == 3 ? 'active' : ''}" data-tab="3">⭐</button>
                <button class="misaka-sticker-picker-tab-action-btn ${activeTab == 1 ? 'active' : ''}" data-action-for-tab="1" data-action="1">🔄</button>
                <button class="misaka-sticker-picker-tab-action-btn ${activeTab == 2 ? 'active' : ''}" data-action-for-tab="2" data-action="2">🗑</button>
                <button class="misaka-sticker-picker-tab-action-btn ${activeTab == 3 ? 'active' : ''}" data-action-for-tab="3" data-action="3">🗑</button>
                <button class="misaka-sticker-picker-tab-action-btn left ${activeTab == 1 ? 'active' : ''}" data-action-for-tab="1" data-action="4">${!currentSort || currentSort == 'asc' ? '▲' : '▼'}</button>
            </div>
            <div id="misaka-search" class="misaka-search-wrapper ${activeTab == 1 ? 'active' : ''}">
                <input type="text" id="misaka-search-input" class="misaka-input" placeholder="Поиск по тэгу">
                <button type="button" id="misaka-clear-btn" class="misaka-clear-btn" aria-label="Очистить">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="misaka-sticker-picker-tab-content">
            <div class="misaka-sticker-picker-tab-pane ${activeTab == 1 ? 'active' : ''}" id="misaka-tab-1">
                <div class="misaka-sticker-list-empty">Пусто</div>
                <div class="misaka-sticker-list"></div>
            </div>
            <div class="misaka-sticker-picker-tab-pane ${activeTab == 2 ? 'active' : ''}" id="misaka-tab-2">
                <div class="misaka-sticker-list-empty">Пусто</div>
                <div class="misaka-sticker-list"></div>
            </div>
            <div class="misaka-sticker-picker-tab-pane ${activeTab == 3 ? 'active' : ''}" id="misaka-tab-3">
                <div class="misaka-sticker-list-empty">Пусто</div>
                <div class="misaka-sticker-list"></div>
            </div>
        </div>
    </div>`

    container.appendChild(pickerContainer)

    await update()

    pickerContainer.addEventListener('click', async (e) => {
        const sticker = e.target.closest('.misaka-sticker-sticker')
        if (!sticker) {
            return
        }
        const favBtn = e.target.closest('.misaka-sticker-favorite-btn')
        if (favBtn) {
            try {
                await toggleFavoriteSticker(await getStickerById(favBtn.getAttribute('data-id')))
            } catch {}
            return
        }
        await sendMessage('stk ' + sticker.dataset.tag)
        await addStickerToHistory(await getStickerById(sticker.dataset.id))
        const isVisible = pickerContainer.style.display !== 'none'
        pickerContainer.style.display = isVisible ? 'none' : 'block'
    })

    const buttons = document.querySelectorAll('.misaka-sticker-picker-tab-btn')
    const actions = document.querySelectorAll('.misaka-sticker-picker-tab-action-btn')
    const panes = document.querySelectorAll('.misaka-sticker-picker-tab-pane')

    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            buttons.forEach(btn => btn.classList.remove('active'))
            actions.forEach(act => act.classList.remove('active'))
            panes.forEach(pane => pane.classList.remove('active'))

            button.classList.add('active')

            const tabId = button.getAttribute('data-tab')
            await chrome.storage.local.set({ activeTab: tabId })
            activeTab = tabId
            document.getElementById(`misaka-tab-${tabId}`).classList.add('active')
            document.querySelectorAll(`[data-action-for-tab="${tabId}"]`).forEach(action => {
                action.classList.add('active')
            })
            if (tabId == 1) {
                document.getElementById(`misaka-search`).classList.add('active')
            } else {
                document.getElementById(`misaka-search`).classList.remove('active')
            }
        })
    })

    actions.forEach(action => {
        action.addEventListener('click', async () => {
            try {
                const actionId = action.getAttribute('data-action')
                if (actionId == 1) {
                    await updateStickerList()
                } else if (actionId == 2) {
                    await chrome.storage.local.set({ history: [] })
                } else if (actionId == 3) {
                    await chrome.storage.sync.set({ favorite: [] })
                } else if (actionId == 4) {
                    const currentSort = (await chrome.storage.local.get('sort')).sort || 'asc'
                    if (!currentSort || currentSort == 'asc') {
                        await chrome.storage.local.set({ sort: 'desc' })
                        action.textContent = '▼'
                    } else {
                        await chrome.storage.local.set({ sort: 'asc' })
                        action.textContent = '▲'
                    }
                }
            } catch (error) {
                console.error('Error while performing the action', error)
            }
        })
    })

    const searchInput = document.getElementById('misaka-search-input')
    const clearBtn = document.getElementById('misaka-clear-btn')

    searchInput.addEventListener('input', async () => {
        if (searchInput.value.length > 0) {
            clearBtn.style.display = 'block'
        } else {
            clearBtn.style.display = 'none'
        }
        await update(1)
    })

    clearBtn.addEventListener('click', async () => {
        searchInput.value = ''
        clearBtn.style.display = 'none'
        searchInput.focus()
        await update(1)
    })

    if (hasUpdate) {
        document.getElementById('misaka-extension-update').addEventListener('click', async (e) => {
            e.preventDefault()
            await chrome.runtime.sendMessage({ action: 'forceReload' })
        })
    }
}

async function sendMessage(message) {
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

function getStickerNode(container, sticker, desc = true, highlight = '', isFav = false) {
    const pattern = new RegExp(`([${highlight}])`, 'gi')
    const tag = highlight.length > 0 ? `${sticker.originalTag.replace(pattern, '<mark>$1</mark>')}` : sticker.originalTag
    let stickerNode = container.querySelector(`.misaka-sticker-sticker[data-id='${sticker.id}']`)
    if (stickerNode) {
        stickerNode.classList.remove('hidden')
        if (isFav) {
            stickerNode.querySelector('.misaka-sticker-favorite-btn').classList.add('active')
        } else {
            stickerNode.querySelector('.misaka-sticker-favorite-btn').classList.remove('active')
        }
        if (desc) {
            stickerNode.querySelector('p').innerHTML = tag
        }
        return stickerNode
    }
    stickerNode = document.createElement('div')
    stickerNode.className = 'misaka-sticker-sticker'
    stickerNode.setAttribute('data-id', sticker.id)
    stickerNode.setAttribute('data-tag', sticker.originalTag)
    let html = ''
    const url = 'https://misakamibot.ru/multichat/stickers/assets/' + sticker.id + '.' + sticker.ext
    const favBtn = `<div class="misaka-sticker-favorite-btn ${isFav ? 'active' : ''}" data-id="${sticker.id}">🟊</div>`
    if (sticker.ext == 'webm') {
        html += `${favBtn}<video autoplay loop playsinline muted><source src="${url}" type="video/webm" /></video>${desc ? `<p>${tag}</p>` : ''}`
    } else if (sticker.ext == 'tgs') {
        const iframeUrl = chrome.runtime.getURL(`tgs-sticker.html?src=${url}${desc == false ? '&isMes=1' : ''}`)
        html += `${favBtn}<iframe class="misaka-sticker-frame" src="${iframeUrl}"></iframe>${desc ? `<p>${tag}</p>` : ''}`
    } else {
        html += `${favBtn}<img src="${url}" alt="${sticker.originalTag}">${desc ? `<p>${tag}</p>` : ''}`
    }
    stickerNode.innerHTML = html
    
    return stickerNode
}

async function renderStickersList(container, stickerList, highlight = '', unsort = false) {
    if (stickerList.length == 0) {
        container.querySelector('.misaka-sticker-list-empty').classList.remove('hidden')
        container.querySelector('.misaka-sticker-list').classList.add('hidden')
        return
    }
    container.querySelector('.misaka-sticker-list-empty').classList.add('hidden')
    container.querySelector('.misaka-sticker-list').classList.remove('hidden')
    container.querySelectorAll('.misaka-sticker-sticker').forEach(sticker => {
        if (!stickerList.some(s => s.id == sticker.getAttribute('data-id'))) {
            sticker.classList.add('hidden')
        }
    })
    const currentSort = (await chrome.storage.local.get('sort')).sort || 'asc'
    if (currentSort == 'desc' && !unsort) {
        stickerList = [...stickerList].reverse()
    }
    const favs = await getFavoriteStickers()
    const fragment = document.createDocumentFragment()
    for (let i = 0; i < stickerList.length; i++) {
        fragment.appendChild(getStickerNode(container, stickerList[i], true, highlight, favs.some(f => f.id == stickerList[i].id)))
    }
    container.querySelector('.misaka-sticker-list').appendChild(fragment)
}

async function update(tab) {
    if (!tab || tab == 1) {
        const searchInput = document.getElementById('misaka-search-input')
        await renderStickersList(document.getElementById(`misaka-tab-1`), stickers.filter(stk => stk.tag.toLowerCase().includes(searchInput.value.toLowerCase())), searchInput.value, false)
    }
    if (!tab || tab == 2) {
        await renderStickersList(document.getElementById(`misaka-tab-2`), await getStickersHistory(), '', true)
    }
    if (!tab || tab == 3) {
        await renderStickersList(document.getElementById(`misaka-tab-3`), await getFavoriteStickers(), '', true)
    }
}

async function renderStickerInMessages(messages) {
    observer.disconnect()
    const favs = await getFavoriteStickers()
    messages.forEach(async function (message) {
        const text = url.includes('twitch.tv') ? message.innerHTML : message.innerHTML.replace(/<[^>]*\balt\s*=\s*["']([^"']*)["'][^>]*>|<[^>]+>/g, (match, altValue) => altValue || '').replace(/(:.*:)/g, '').trim()
        if (/^stk/i.test(text)) {
            const sticker = await getStickerByTag(text.replace(/^stk\s*/i, ''))
            if (!sticker) {
                return
            }
            const fragment = document.createDocumentFragment()
            fragment.appendChild(getStickerNode(message, sticker, false, '', favs.some(f => f.id == sticker.id)))
            message.innerHTML = ''
            message.appendChild(fragment)
        }
    })
    observer.observe(document.body, { childList: true, subtree: true })
}

async function updateStickerList() {
    try {
        const response = await fetch('https://api.misakamibot.ru/multichat/stickers')
        stickers = await response.json()
        await chrome.storage.local.set({ stickers })
    } catch (error) { 
        console.error('Error retrieving sticker list', error)
    }
    await removeOutdatedStickersFromHistory()
    await removeOutdatedStickersFromFavorite()
}

async function getStickerById(id) {
    try {
        const result = await chrome.storage.local.get('stickers')
        const stickers = result.stickers || []
        return stickers.find(s => s.id == id)
    } catch (error) {
        console.error(`Failed to get sticker by id = ${id}`, error)
        return null
    }
}

async function getStickerByTag(tag) {
    try {
        const result = await chrome.storage.local.get('stickers')
        const stickers = result.stickers || []
        return stickers.find(s => s.originalTag.replace(/[\uFE00-\uFE0F]/g, '') == tag.replace(/[\uFE00-\uFE0F]/g, '').trim())
    } catch (error) {
        console.error(`Failed to get sticker by tag = ${id}`, error)
        return null
    }
}

async function getStickersHistory() {
    try {
        const result = await chrome.storage.local.get('history')
        const history = result.history || []
        return history.slice(0, 10)
    } catch (error) {
        console.error('Failed to get stickers history', error)
        return []
    }
}

async function addStickerToHistory(sticker) {
    if (!sticker || !sticker.id) {
        return
    }

    const candidate = await getStickerById(sticker.id)
    if (!candidate) {
        return
    }

    let history = await getStickersHistory()

    history = history.filter(s => s.id !== candidate.id)
    history.unshift(candidate)

    try {
        await chrome.storage.local.set({ history: history.slice(0, 10) })
    } catch (error) {
        console.error('Failed to add sticker to history', error)
    }
}

async function removeOutdatedStickersFromHistory() {
    try {
        const history = await getStickersHistory()

        const validHistory = history.filter(sticker =>
            stickers.some(s => s.id === sticker.id)
        )

        await chrome.storage.local.set({ history: validHistory.slice(0, 10) })
    } catch (error) {
        console.error('Failed to remove outdated stickers from history', error)
    }
}

async function getFavoriteStickers() {
    try {
        const result = await chrome.storage.sync.get('favorite')
        const favorite = result.favorite || []
        return favorite.slice(0, 10)
    } catch (error) {
        console.error('Failed to get favorite stickers', error)
        return []
    }
}

async function toggleFavoriteSticker(sticker) {
    if (!sticker || !sticker.id) {
        return
    }

    const candidate = await getStickerById(sticker.id)
    if (!candidate) {
        return
    }

    let favorite = await getFavoriteStickers()

    if (favorite.find(s => s.id === candidate.id)) {
        favorite = favorite.filter(s => s.id !== candidate.id)
    } else {
        favorite.unshift(candidate)
    }

    try {
        await chrome.storage.sync.set({ favorite: favorite.slice(0, 10) })
    } catch (error) {
        console.error('Failed to toggle favorite sticker', error)
    }
}

async function removeOutdatedStickersFromFavorite() {
    try {
        const favorite = await getFavoriteStickers()

        const validFavorite = favorite.filter(sticker =>
            stickers.some(s => s.id === sticker.id)
        )

        await chrome.storage.sync.set({ favorite: validFavorite.slice(0, 10) })
    } catch (error) {
        console.error('Failed to remove outdated stickers from fvorite', error)
    }
}

async function start() {
    if (await checkChannel()) {
        if (!stickerListUpdateTimer) {
            stickerListUpdateTimer = setInterval(async () => {
                await updateStickerList()
            }, 1000 * 60 * 5)
        }
        await updateStickerList()
        observer = new MutationObserver(async () => {
            if ((document.querySelector('#emoji-picker-button') || document.querySelector('[data-a-target="emote-picker-button"]')) && !document.getElementById('misaka-sticker-container')) {
                await injectStickerContainer()
            }
            let messages = []
            if (url.includes('youtube.com')) {
                messages = document.querySelectorAll('#message.yt-live-chat-text-message-renderer')
            } else if (url.includes('twitch.tv')) {
                messages = document.querySelectorAll('.text-fragment[data-a-target="chat-message-text"]')
            }
            await renderStickerInMessages(messages)
        })
        await injectStickerContainer()
        observer.observe(document.body, { childList: true, subtree: true })
    }
}

document.addEventListener('click', (e) => {
    const isClickInside = e.target.closest('#misaka-sticker-picker') || e.target.closest('#misaka-sticker-btn')

    if (!isClickInside) {
        try {
            document.getElementById('misaka-sticker-picker').style.display = 'none'
        } catch { }
    }
})

if (window.navigation) {
    window.navigation.addEventListener('navigate', async (e) => {
        url = e.destination.url
        if (observer !== undefined) {
            observer.disconnect()
        }
        await start()
    })
}

chrome.storage.onChanged.addListener(async () => {
    try {
        await update()
    } catch {}
})


;(async function () {
    injectEmojiFont()
    await start()
})()