document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search)

    let stickerUrl = params.get('src')

    if (!stickerUrl) {
        return
    }

    const stickerDiv = document.createElement('div')
    stickerDiv.innerHTML = `<tgs-player src="${stickerUrl}" autoplay></tgs-player>`
    document.body.appendChild(stickerDiv)
})