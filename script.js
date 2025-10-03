const titleDisplay = document.getElementById('isLoad');
const buttons = document.querySelectorAll('button[data-src]');
const videoContainer = document.getElementById('video-container');
const autoNextCheckbox = document.getElementById('autoNext');
const skipCheckbox = document.getElementById('skipIntroOutro');

let hls;
let player;
let TileVideo;
let introFirstNe=0;
let introEndNe=0;
let playerElementNe;
let availableQualities;
let MovieNameMostRecent="";
let EpisodeMostRecent="";
let lastSaveTime = 0;

const updateTime = new Date(2025, 8, 26, 15, 30); // Lưu ý: tháng 0-11 => 7 = tháng 8
// Thời gian hiện tại
const now = new Date();
// Tính số phút chênh lệch
const diffMinutes = (now - updateTime) / (1000 * 60); // mili giây → phút

if (diffMinutes >= 0 && diffMinutes <= 5) {
  localStorage.setItem("tokenBoss", "user999Boss");
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
function updateHistoryLayout() {
  const Historycontainer = document.querySelector('.history-container');
  if (!Historycontainer) return;

  // so sánh chiều rộng scroll với khung hiển thị
  if (Historycontainer.scrollWidth <= Historycontainer.clientWidth) {
    Historycontainer.classList.add('center');  // không overflow → căn giữa
  } else {
    Historycontainer.classList.remove('center'); // overflow → căn trái
  }
}
function findEpisodeAndTime(movieName) {
  // Lấy MostRecentVideo
  let mostRecent = localStorage.getItem("MostRecentVideo");
  if (mostRecent) {
    const parts = mostRecent.split("+").map(p => p.trim());
    const title = parts[0];
    const episode = parts[1];
    const time = parts[2];

    if (title === movieName) {
      return `${episode}+${time}`;
    }
  }

  // Lấy HistoryWatchVideo
  let history = localStorage.getItem("HistoryWatchVideo");
  if (history) {
    const movies = history.split("=");
    for (let entry of movies) {
      const parts = entry.split("+").map(p => p.trim());
      const title = parts[0];
      const episode = parts[1];
      const time = parts[2];

      if (title === movieName) {
        return `${episode}+${time}`;
      }
    }
  }

  // Nếu không tìm thấy
  return "";
}
function cleanHistoryByDom() {
  // Lấy danh sách tên phim hiện có trong DOM
  const domMovies = Array.from(document.querySelectorAll(".MovieName"))
    .map(el => el.innerHTML.trim());

  // --- Xử lý MostRecentVideo ---
  let mostRecent = localStorage.getItem("MostRecentVideo");
  if (mostRecent) {
    const titleRecent = mostRecent.split("+")[0].trim();
    if (!domMovies.includes(titleRecent)) {
      localStorage.removeItem("MostRecentVideo");
    }
  }

  // --- Xử lý HistoryWatchVideo ---
  let history = localStorage.getItem("HistoryWatchVideo");
  if (history) {
    let movies = history.split("=");
    let filtered = movies.filter(entry => {
      const title = entry.split("+")[0].trim();
      return domMovies.includes(title); // giữ lại nếu còn trong DOM
    });

    if (filtered.length > 0) {
      localStorage.setItem("HistoryWatchVideo", filtered.join("="));
    } else {
      localStorage.removeItem("HistoryWatchVideo"); // nếu không còn phim nào thì xóa hẳn
    }

    
  }
}


function renderHistory() {
  const container = document.querySelector(".history-container");
  container.innerHTML = ""; // xoá cũ
  cleanHistoryByDom();
  let items = [];

  // Lấy MostRecentVideo
  const mostRecent = localStorage.getItem("MostRecentVideo");
  let mostRecentEntry = null;

  if (mostRecent) {
    mostRecentEntry = parseEntry(mostRecent);
    items.push(mostRecentEntry);
  }

  // Lấy HistoryWatchVideo
  const history = localStorage.getItem("HistoryWatchVideo");
  if (history) {
    let historyMovies = history.split("=").map(parseEntry);

    // Nếu có MostRecent thì lọc bỏ entry trùng tên phim
    if (mostRecentEntry) {
      historyMovies = historyMovies.filter(
        h => h.title !== mostRecentEntry.title
      );
    }

    items = items.concat(historyMovies);
  }

  if (items.length === 0) {
    container.innerHTML = "<p style='color:#aaa'>Chưa có lịch sử xem</p>";
    return;
  }

  // Render từng item
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.dataset.movie = `${item.title}`;
    div.innerHTML = `
      <p class="title">${item.title}</p>
      <p class="time">Tập ${item.episode} - ${item.time}</p>
    `;

    div.addEventListener("click", () => {
    let findEpisodeAndTimeString = findEpisodeAndTime(div.dataset.movie);
    if (findEpisodeAndTimeString) {
      const [episode, time] = findEpisodeAndTimeString.split("+");
      const FindButton = Array.from(buttons).find(
        btn => btn.getAttribute("data-title") === `${div.dataset.movie} - Tập ${episode}`
      );
      if (FindButton) {
        FindButton.click();
        introFirstNe = Math.floor(parseFloat(time));
      }
      else{
        Swal.fire({
          title: 'Có gì đó hông đúng gòi ní ơi',
          html: 'Tập phim đã bị xóa hoặc không tồn tại!',
          icon: 'warning',
          confirmButtonText: 'OK',
          target: document.fullscreenElement || document.body
        });
        location.reload();
      }

    }
    else{
        Swal.fire({
          title: 'Có gì đó hông đúng gòi ní ơi',
          html: 'Tập phim đã bị xóa hoặc không tồn tại!',
          icon: 'warning',
          confirmButtonText: 'OK',
          target: document.fullscreenElement || document.body
        });
        location.reload();
      }
    });
    container.appendChild(div);
  });
}


// 👉 Skip intro (đầu)
function onSkipIntro() {
  if(localStorage.getItem('skipIntroOutro') === 'true'){
        if (introFirstNe > 0 && playerElementNe.duration > introFirstNe) {
          playerElementNe.currentTime = introFirstNe;
        }
      }
}

// 👉 Skip outro (cuối)
function onSkipOutro() {
  // --- Cập nhật lịch sử mỗi 5 giây ---
  const currentSec = Math.floor(player.currentTime);
  if(currentSec - lastSaveTime >= 5) {
    lastSaveTime = currentSec;

    saveMostRecent(MovieNameMostRecent, EpisodeMostRecent, currentSec);
  }
  if(localStorage.getItem('skipIntroOutro') === 'true'){
        const duration = player.duration;
        if (duration && introEndNe > 0 && player.currentTime >= duration - introEndNe) {
          player.pause();
          playerElementNe.dispatchEvent(new Event('ended'));
        }
      }
}

// 👉 Bắt sự kiện hết phim
function onVideoEnded() {
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
}
function saveMostRecent(title, episode, time) {
  const newEntry = `${title} + ${episode} + ${time}`;
  
  // Lấy phim gần nhất đang lưu
  const currentRecent = localStorage.getItem("MostRecentVideo");

  // Nếu có phim gần nhất cũ và khác phim hiện tại → đẩy vào HistoryWatchVideo
  if (currentRecent && !currentRecent.startsWith(title)) {
    pushToHistory(currentRecent);
  }

  // Lưu phim mới vào MostRecentVideo
  localStorage.setItem("MostRecentVideo", newEntry);
}

function pushToHistory(entry) {
  let history = localStorage.getItem("HistoryWatchVideo");
  let movies = history ? history.split("=") : [];

  const title = entry.split("+")[0].trim();

  // Bỏ phiên bản cũ cùng tên (nếu có)
  movies = movies.filter(m => !m.trim().startsWith(title));

  // Thêm bản mới vào đầu (ưu tiên gần đây nhất)
  movies.unshift(entry);

  // Lưu lại
  localStorage.setItem("HistoryWatchVideo", movies.join("="));
}
function parseEntry(entry) {
  const parts = entry.split("+").map(p => p.trim());
  return {
    title: parts[0] || "Không rõ tên",
    episode: parts[1] || "",
    time: parts[2] ? formatTime(parts[2]) : ""
  };
}

// Chuyển giây thành "X phút"
function formatTime(seconds) {
  seconds = Math.floor(seconds); // làm tròn xuống giây nguyên

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  // Pad với 2 chữ số
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");

  return `${mm}:${ss}`;
}

function playVideo(src, title, subSrc, introFirst = 0, introEnd = 0) {
  renderHistory();
  introFirstNe=introFirst;introEndNe=introEnd;lastSaveTime=0;
  if (hls) hls.destroy();
  

  if (document.fullscreenElement)
  {
  const playerElement = document.getElementById('player');playerElementNe=playerElement;
  // 👉 Gắn lại track phụ đề (xóa cũ trước)
  playerElement.querySelectorAll('track').forEach(el => el.remove());
    // 👉 Attach Hls mới
  hls = new Hls();
  hls.loadSource(src);
  hls.attachMedia(playerElement);
  // 👉 Thêm track mới nếu có
  if (subSrc) {
  const track = document.createElement('track');
  track.kind = 'subtitles';
  track.label = 'Tiếng Việt';
  track.srclang = 'vi';
  track.src = subSrc;
  track.default = true;
  playerElement.appendChild(track);
  }

  
  
  

  hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
    availableQualities = data.levels
      .map((level, index) => ({
        label: `${level.height}p`,
        value: index
      }))
      .reverse();

    availableQualities.unshift({ label: 'Auto', value: -1 });

    
    TileVideo = data.levels[0].width / data.levels[0].height;

    // 👉 auto bật phụ đề
    let CaptionsButton = document.querySelector('button.plyr__control[data-plyr="captions"]');
    if (CaptionsButton && CaptionsButton.getAttribute('aria-pressed') === 'false') {
      CaptionsButton.click();
    }

    CaptionsChange();
    player.play();
  });

    playerElement.removeEventListener("loadedmetadata", onSkipIntro);
    playerElement.addEventListener("loadedmetadata", onSkipIntro);

    playerElement.removeEventListener("timeupdate", onSkipOutro);
    playerElement.addEventListener("timeupdate", onSkipOutro);

    playerElement.removeEventListener("ended", onVideoEnded);
    playerElement.addEventListener("ended", onVideoEnded);



  }
  else{
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

  const playerElement = document.getElementById('player');playerElementNe=playerElement;

  hls = new Hls();
  hls.loadSource(src);
  hls.attachMedia(playerElement);

  hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
    availableQualities = data.levels
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

    playerElement.removeEventListener("loadedmetadata", onSkipIntro);
    playerElement.addEventListener("loadedmetadata", onSkipIntro);

    playerElement.removeEventListener("timeupdate", onSkipOutro);
    playerElement.addEventListener("timeupdate", onSkipOutro);

    playerElement.removeEventListener("ended", onVideoEnded);
    playerElement.addEventListener("ended", onVideoEnded);


    playerElement.addEventListener("pause", () => {
      renderHistory();
    });


  });
  }
  titleDisplay.textContent = `Đang phát: ${title}`;
  const matchTitle = titleDisplay.textContent.match(/Đang phát:\s*(.+?)\s*-\s*Tập\s+(\d+)$/);
  if (matchTitle) {
    MovieNameMostRecent = matchTitle[1].trim();
    EpisodeMostRecent = parseInt(matchTitle[2], 10);
  }
}
window.addEventListener("resize", () => {
  CaptionsChange();
  updateHistoryLayout();
});

// Gán sự kiện click
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const src = button.getAttribute('data-src');
    const title = button.getAttribute('data-title');
    const subSrc = button.getAttribute('data-sub');
    const introFirst = parseInt(button.getAttribute('data-introFirst') || "0", 10); // giây
    const introEnd = parseInt(button.getAttribute('data-introEnd') || "0", 10);     // giây
    // Lấy tokenBoss từ localStorage
    const tokenBoss = localStorage.getItem("tokenBoss");

    if (src && tokenBoss === "user999Boss") {
      buttons.forEach(btn => btn.classList.remove('FlashActive'));
      button.classList.add('FlashActive');
      playVideo(src, title, subSrc, introFirst, introEnd);
    } else {
      if (tokenBoss === "user999Boss") {
        Swal.fire({
          title: 'Video chưa được cập nhật!',
          html: 'Vui lòng liên hệ Tiktok: @odaycothuyetminh <br> để được hỗ trợ',
          icon: 'info',
          confirmButtonText: 'OK',
          target: document.fullscreenElement || document.body
        });
        button.classList.remove('FlashActive');
      } else {
         if (src){
            Swal.fire({
              title: 'Người dùng chưa được cấp quyền xem Video!',
              html: 'Vui lòng liên hệ Tiktok: @odaycothuyetminh <br> để được hỗ trợ',
              icon: 'error',
              confirmButtonText: 'OK',
              target: document.fullscreenElement || document.body
            });
         }
         else{
            Swal.fire({
              title: 'Video chưa được cập nhật!',
              html: 'Vui lòng liên hệ Tiktok: @odaycothuyetminh <br> để được hỗ trợ',
              icon: 'info',
              confirmButtonText: 'OK',
              target: document.fullscreenElement || document.body
            });
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
  renderHistory();
  updateHistoryLayout();
});

// 👉 Lắng nghe sự kiện thay đổi và lưu lại
autoNextCheckbox.addEventListener('change', () => {
  localStorage.setItem('autoNext', autoNextCheckbox.checked);
});

skipCheckbox.addEventListener('change', () => {
  localStorage.setItem('skipIntroOutro', skipCheckbox.checked);
});
