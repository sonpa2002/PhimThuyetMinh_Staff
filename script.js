const titleDisplay = document.getElementById('isLoad');
const buttons = document.querySelectorAll('button[data-src]');
const videoContainer = document.getElementById('video-container');

let hls;
let player;
let TileVideo;

const updateTime = new Date(2025, 7, 18, 12, 35); // Lưu ý: tháng 0-11 => 7 = tháng 8
// Thời gian hiện tại
const now = new Date();
// Tính số phút chênh lệch
const diffMinutes = (now - updateTime) / (1000 * 60); // mili giây → phút

if (diffMinutes >= 0 && diffMinutes <= 12) {

    localStorage.setItem("token", "userOK789");
}

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
    // Lấy token từ localStorage
    const token = localStorage.getItem("token");

    if (src && token === "userOK789") {
      buttons.forEach(btn => btn.classList.remove('FlashActive'));
      button.classList.add('FlashActive');
      playVideo(src, title, subSrc);
    } else {
      if (token === "userOK789") {
        alert('Video chưa được cập nhật!\nVui lòng liên hệ Tiktok: @odaycothuyetminh để được hỗ trợ');
        button.classList.remove('FlashActive');
      } else {
         if (src){
          alert('Người dùng chưa được cấp quyền xem video!\nVui lòng liên hệ Tiktok: @odaycothuyetminh để được hỗ trợ');
         }
         else{
          alert('Video chưa được cập nhật!\nVui lòng liên hệ Tiktok: @odaycothuyetminh để được hỗ trợ');
         }
        button.classList.remove('FlashActive');
      }
    }
  });
});

