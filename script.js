const titleDisplay = document.getElementById('isLoad');
const buttons = document.querySelectorAll('button[data-src]');
const videoContainer = document.getElementById('video-container');
const autoNextCheckbox = document.getElementById('autoNext');
const skipCheckbox = document.getElementById('skipIntroOutro');

let hls;
let player;
let TileVideo;

const updateTime = new Date(2025, 8, 23, 23, 0); // Lưu ý: tháng 0-11 => 7 = tháng 8
// Thời gian hiện tại
const now = new Date();
// Tính số phút chênh lệch
const diffMinutes = (now - updateTime) / (1000 * 60); // mili giây → phút

if (diffMinutes >= 0 && diffMinutes <= 2880) {

  localStorage.setItem("token", "user123123999");
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

function playVideo(src, title, subSrc, introFirst = 0, introEnd = 0) {
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
    
    // 👉 Skip intro (đầu)
    playerElement.addEventListener('loadedmetadata', () => {
      if(localStorage.getItem('skipIntroOutro') === 'true'){
        if (introFirst > 0 && playerElement.duration > introFirst) {
          playerElement.currentTime = introFirst;
        }
      }
    });
    

    // 👉 Skip outro (cuối)
    player.on('timeupdate', () => {
      if(localStorage.getItem('skipIntroOutro') === 'true'){
        const duration = player.duration;
        if (duration && introEnd > 0 && player.currentTime >= duration - introEnd) {
          player.pause();
          playerElement.dispatchEvent(new Event('ended'));
        }
      }
    });

    // Bắt sự kiện hết phim-------------------------
    playerElement.addEventListener('ended', () => {
      if(localStorage.getItem('autoNext') === 'true'){
        const currentTitle = titleDisplay.textContent; 
        // Regex: lấy tên phim và số tập ở cuối
        const match = currentTitle.match(/Đang phát:\s*(.+?)\s*-\s*Tập\s+(\d+)$/);

        if (match) {
          const movieName = match[1].trim();        // "Tên Phim"
          const currentEpisode = parseInt(match[2], 10);
          const nextEpisode = currentEpisode + 1;

          // Tìm button của cùng phim và tập kế tiếp
          const nextButton = Array.from(buttons).find(btn =>
            btn.getAttribute('data-title') === `${movieName} - Tập ${nextEpisode}`
          );

          if (nextButton) {
            nextButton.click();
          }
        }
      }
    });


  });
  titleDisplay.textContent = `Đang phát: ${title}`;
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
    const introFirst = parseInt(button.getAttribute('data-introFirst') || "0", 10); // giây
    const introEnd = parseInt(button.getAttribute('data-introEnd') || "0", 10);     // giây
    // Lấy token từ localStorage
    const token = localStorage.getItem("token");

    if (src && token === "user123123999") {
      buttons.forEach(btn => btn.classList.remove('FlashActive'));
      button.classList.add('FlashActive');
      playVideo(src, title, subSrc, introFirst, introEnd);
    } else {
      if (token === "user123123999") {
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

// 👉 Khi load trang: khôi phục trạng thái từ localStorage
window.addEventListener('DOMContentLoaded', () => {
  const autoNextValue = localStorage.getItem('autoNext') === 'true';
  const skipValue = localStorage.getItem('skipIntroOutro') === 'true';

  autoNextCheckbox.checked = autoNextValue;
  skipCheckbox.checked = skipValue;
});

// 👉 Lắng nghe sự kiện thay đổi và lưu lại
autoNextCheckbox.addEventListener('change', () => {
  localStorage.setItem('autoNext', autoNextCheckbox.checked);
});

skipCheckbox.addEventListener('change', () => {
  localStorage.setItem('skipIntroOutro', skipCheckbox.checked);
});