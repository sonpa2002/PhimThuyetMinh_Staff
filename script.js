const titleDisplay = document.getElementById('isLoad');
const buttons = document.querySelectorAll('button[data-src]');
const videoContainer = document.getElementById('video-container');

let hls;
let player;
let TileVideo;
function CaptionsChange(){
  let videoTagInfo = document.getElementById("player");
  let rect = videoTagInfo.getBoundingClientRect();
    
  let captions = document.querySelector('.plyr__captions');
  if (captions) {
    captions.style.setProperty('bottom', `calc(50% - ${(rect.width/TileVideo)/2.42}px)`, 'important');
    captions.style.setProperty('font-size', `${rect.width/36}px`, 'important');
    captions.style.setProperty('line-height', `${rect.width/32}px`, 'important');
  }
}

function playVideo(src, title, subSrc) {
  if (hls) hls.destroy();
  if (player) player.destroy();

  // Gắn track phụ đề nếu có
  const subtitleTrack = subSrc
    ? `<track kind="subtitles" label="Tiếng Việt" srclang="vi" src="${subSrc}">`
    : '';

  videoContainer.innerHTML = `
    <video id="player" controls playsinline>
      ${subtitleTrack}
    </video>
  `;

  const playerElement = document.getElementById('player');

  hls = new Hls();
  hls.loadSource(src);
  hls.attachMedia(playerElement);

  hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
    const availableQualities = data.levels
      .map((level, index) => ({
        label: `${level.height}p`,
        value: index
      }))
      .reverse();

    availableQualities.unshift({ label: 'Auto', value: -1 });

    player = new Plyr(playerElement, {
      controls: [
        'play-large', 'rewind', 'play', 'fast-forward',
        'progress', 'current-time', 'duration',
        'mute', 'volume', 'captions', 'settings', 'fullscreen'
      ],
      quality: {
        default: -1,
        options: availableQualities.map(q => q.value),
        forced: true,
        onChange: (newQuality) => {
          console.log(`Đổi sang chất lượng: ${newQuality}`);
          hls.currentLevel = newQuality;
        }
      },
      i18n: {
        qualityLabel: {
          '-1': 'Auto',
          ...Object.fromEntries(availableQualities.map(q => [q.value, q.label]))
        }
      }
    });
    
    TileVideo = data.levels[0].width / data.levels[0].height;
    let CaptionsButton = document.querySelector('button.plyr__control[data-plyr="captions"]');
    if (CaptionsButton && CaptionsButton.getAttribute('aria-pressed') === 'false') {
      CaptionsButton.click();
    }
    CaptionsChange();
    player.play();
  });

  titleDisplay.textContent = `Đang phát: Phim ${title}`;
}
window.addEventListener("resize", () => {
  CaptionsChange();
    
});

// Gán sự kiện click
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const src = button.getAttribute('data-src');
    const title = button.getAttribute('data-title');
    const subSrc = button.getAttribute('data-sub');

    if (src) {
      buttons.forEach(btn => btn.classList.remove('FlashActive'));
      button.classList.add('FlashActive');
      playVideo(src, title, subSrc);
    } else {
      alert('Video chưa được cập nhật!\nVui lòng liên hệ Tiktok: @odaycothuyetminh để được hỗ trợ');
      button.classList.remove('FlashActive');
    }
  });
});

