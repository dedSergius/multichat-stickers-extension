document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search)

    let stickerUrl = params.get('src')

    if (!stickerUrl) {
        return
    }

    let isMes = Number(params.get('isMes') || 0)

    const stickerDiv = document.createElement('div')
    stickerDiv.innerHTML = `<tgs-player src="${stickerUrl}" autoplay></tgs-player>`
    if (isMes == 1) {
        document.body.classList.add('mes')
    }
    document.body.appendChild(stickerDiv)
})