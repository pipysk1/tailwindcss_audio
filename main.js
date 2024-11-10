document.addEventListener("DOMContentLoaded", () => {
  const audioPlayer = document.getElementById("audioPlayer");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const tapList = document.getElementById("tapList");
  const currentTapElement = document.getElementById("current-tap");
  const speedControl = document.getElementById("speedControl");
  const volumeControl = document.getElementById("volumeControl");
  const speedValue = document.getElementById("speedValue");
  const volumeValue = document.getElementById("volumeValue");
  const audioIdentifier = document.getElementById("audioIdentifier");
  const loadAudioBtn = document.getElementById("loadAudioBtn");

  let currentTapIndex = 0;
  let tapSources = [];
  const STORAGE_KEY_TAP = "currentTap";
  const STORAGE_KEY_TIME = "currentTime";
  const STORAGE_KEY_SPEED = "currentSpeed";
  const STORAGE_KEY_AUDIO_ID = "audioIdentifier";

  loadAudioBtn.addEventListener("click", () => {
    const audioIdentifierValue = audioIdentifier.value.trim();
    if (audioIdentifierValue) {
      tapList.innerHTML = ""; // Xóa danh sách bài cũ
      localStorage.setItem(STORAGE_KEY_AUDIO_ID, audioIdentifierValue); // Lưu giá trị audioIdentifier vào localStorage
      fetchAudioList(audioIdentifierValue);
    } else {
      console.warn("Vui lòng nhập mã audio!");
    }
  });

  const fetchAudioList = async (nameUrl) => {
    try {
      const response = await fetch(`https://archive.org/metadata/${nameUrl}`);
      const data = await response.json();
      const fragment = document.createDocumentFragment();
      tapSources = data.files
        .filter((file) => file.format === "VBR MP3")
        .map((file) => {
          const match = file.name.match(/^\d+/);
          const title = match ? `Tập ${match[0].padStart(3, "0")}` : file.name;
          return {
            url: `https://archive.org/download/${nameUrl}/${file.name}`,
            title: title,
          };
        });
      tapSources.forEach((tap, index) => {
        const li = document.createElement("li");
        li.textContent = tap.title;
        li.dataset.index = index;
        li.addEventListener("click", () => loadTap(index));
        fragment.appendChild(li);
      });
      tapList.appendChild(fragment);

      loadSavedTapAndTime();
    } catch (error) {
      console.error("Error fetching audio list:", error);
    }
  };

  const loadTap = (index) => {
    currentTapIndex = index;
    audioPlayer.src = tapSources[index].url;
    currentTapElement.textContent = tapSources[index].title;
    const savedSpeed = localStorage.getItem(STORAGE_KEY_SPEED) || 1;
    audioPlayer.playbackRate = savedSpeed;
    speedControl.value = savedSpeed;
    speedValue.textContent = `${savedSpeed}x`;
    audioPlayer.play();
    localStorage.setItem(STORAGE_KEY_TAP, index);
    localStorage.setItem(STORAGE_KEY_TIME, 0);
    highlightCurrentTap();
  };

  const loadSavedTapAndTime = () => {
    const savedTap = localStorage.getItem(STORAGE_KEY_TAP);
    const savedTime = localStorage.getItem(STORAGE_KEY_TIME);
    const savedSpeed = localStorage.getItem(STORAGE_KEY_SPEED);

    if (savedTap !== null) {
      currentTapIndex = parseInt(savedTap, 10);
      loadTap(currentTapIndex);
      if (savedTime !== null && !isNaN(savedTime)) {
        audioPlayer.currentTime = parseFloat(savedTime);
      }
    } else {
      loadTap(0);
    }

    if (savedSpeed !== null) {
      audioPlayer.playbackRate = parseFloat(savedSpeed);
      speedControl.value = savedSpeed;
      speedValue.textContent = `${savedSpeed}x`;
    }
  };

  const highlightCurrentTap = () => {
    const tapItems = tapList.querySelectorAll("li");
    tapItems.forEach((item) => {
      if (parseInt(item.dataset.index) === currentTapIndex) {
        item.classList.add("bg-blue-200");
      } else {
        item.classList.remove("bg-blue-200");
      }
    });
  };

  audioPlayer.addEventListener("timeupdate", () => {
    localStorage.setItem(STORAGE_KEY_TIME, audioPlayer.currentTime);
  });

  audioPlayer.addEventListener("ended", () => {
    currentTapIndex = (currentTapIndex + 1) % tapSources.length;
    loadTap(currentTapIndex);
  });

  playPauseBtn.addEventListener("click", () => {
    if (audioPlayer.paused) {
      audioPlayer.play();
      playPauseBtn.textContent = "⏸";
    } else {
      audioPlayer.pause();
      playPauseBtn.textContent = "▶️";
    }
  });

  prevBtn.addEventListener("click", () => {
    currentTapIndex =
      (currentTapIndex - 1 + tapSources.length) % tapSources.length;
    loadTap(currentTapIndex);
  });

  nextBtn.addEventListener("click", () => {
    currentTapIndex = (currentTapIndex + 1) % tapSources.length;
    loadTap(currentTapIndex);
  });

  speedControl.addEventListener("input", () => {
    const newSpeed = speedControl.value;
    audioPlayer.playbackRate = newSpeed;
    speedValue.textContent = `${newSpeed}x`;
    localStorage.setItem(STORAGE_KEY_SPEED, newSpeed);
  });

  volumeControl.addEventListener("input", () => {
    const newVolume = volumeControl.value;
    audioPlayer.volume = newVolume;
    volumeValue.textContent = `${Math.round(newVolume * 100)}%`;
  });

  // Tự động tải lại danh sách audio khi trang load, nếu có giá trị trong localStorage
  const savedAudioIdentifier = localStorage.getItem(STORAGE_KEY_AUDIO_ID);
  if (savedAudioIdentifier) {
    audioIdentifier.value = savedAudioIdentifier;
    fetchAudioList(savedAudioIdentifier);
  }
});
